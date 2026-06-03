import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendOrderDispatched } from '@/lib/email/resend'
import { notifyOrderStatus } from '@/lib/sms/twilio'
import { stripe } from '@/lib/stripe/client'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// GET all orders with filters
export async function GET(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const status = request.nextUrl.searchParams.get('status')
  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1')
  const limit = 50

  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count } = await query
  return NextResponse.json({ orders: data, total: count })
}

// PATCH update order status / assign driver
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, status, driverId, refundAmount, tags } = await request.json()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {}
  if (status) updateData.status = status
  if (driverId) updateData.driver_id = driverId
  if (tags) updateData.tags = tags

  const { data: order } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (status) {
    await supabase.from('order_events').insert({
      order_id: orderId, type: 'status', created_by: admin.id,
      message: `Status changed to ${String(status).replace(/_/g, ' ')}`,
    })
  }

  // Send notifications
  const email = order.guest_email ?? (await supabase.from('profiles').select('email').eq('id', order.user_id).single()).data?.email
  const phone = order.delivery_address?.phone

  if (status === 'out_for_delivery' && email) {
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.id}`
    await sendOrderDispatched(order, email, trackingUrl).catch(console.error)
  }
  if (phone && status) {
    await notifyOrderStatus(phone, order.order_number, status).catch(console.error)
  }

  // Handle refunds
  if (refundAmount) {
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'This order has no Stripe payment to refund' }, { status: 400 })
    }
    const amount = Number(refundAmount)
    if (!amount || amount <= 0 || amount > Number(order.total_eur)) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
    }
    try {
      const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
      if (!pi.latest_charge) {
        return NextResponse.json({ error: 'No charge found for this payment' }, { status: 400 })
      }
      await stripe.refunds.create({
        charge: pi.latest_charge as string,
        amount: Math.round(amount * 100),
        reason: 'requested_by_customer',
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message ?? 'Refund failed' }, { status: 500 })
    }

    // Mark as refunded (full or partial) and record the amount.
    const fullyRefunded = amount >= Number(order.total_eur)
    const { data: refunded } = await supabase
      .from('orders')
      .update({ status: 'refunded', notes: `${order.notes ? order.notes + ' · ' : ''}Refunded €${amount.toFixed(2)}${fullyRefunded ? ' (full)' : ' (partial)'}` })
      .eq('id', orderId)
      .select()
      .single()

    await supabase.from('order_events').insert({
      order_id: orderId, type: 'refund', created_by: admin.id,
      message: `Refunded €${amount.toFixed(2)}${fullyRefunded ? ' (full)' : ' (partial)'}`,
    })
    if (phone) await notifyOrderStatus(phone, order.order_number, 'refunded').catch(console.error)
    return NextResponse.json({ order: refunded ?? order, refunded: amount })
  }

  return NextResponse.json({ order })
}
