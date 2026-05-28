import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { sendOrderConfirmation, sendRefundConfirmation } from '@/lib/email/resend'
import { notifyOrderStatus } from '@/lib/sms/twilio'
import { awardLoyaltyPoints } from '@/lib/loyalty'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent

      // Update order status
      const { data: order } = await supabase
        .from('orders')
        .update({ status: 'received', payment_method: pi.payment_method_types[0] })
        .eq('stripe_payment_intent_id', pi.id)
        .select('*, items:order_items(*)')
        .single()

      if (!order) break

      // Book delivery slot
      if (order.delivery_slot_id) {
        await supabase.rpc('book_delivery_slot', { p_slot_id: order.delivery_slot_id })
      }

      // Decrement inventory
      if (order.items) {
        for (const item of order.items) {
          await supabase.rpc('decrement_inventory', {
            p_variant_id: item.variant_id,
            p_qty: item.quantity,
          })
        }
      }

      // Send confirmation email
      const email = order.guest_email ?? (await supabase.from('profiles').select('email').eq('id', order.user_id).single()).data?.email
      if (email) {
        await sendOrderConfirmation(order, email).catch(console.error)
      }

      // Award loyalty points
      if (order.user_id) {
        await awardLoyaltyPoints(order.user_id, order.id, order.total_eur).catch(console.error)
      }

      // SMS notification
      const phone = order.delivery_address?.phone
      if (phone) {
        await notifyOrderStatus(phone, order.order_number, 'received').catch(console.error)
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const { data: order } = await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', charge.payment_intent as string)
        .select()
        .single()

      if (order) {
        const email = order.guest_email ?? (await supabase.from('profiles').select('email').eq('id', order.user_id).single()).data?.email
        if (email) {
          await sendRefundConfirmation(order, email, charge.amount_refunded / 100).catch(console.error)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
