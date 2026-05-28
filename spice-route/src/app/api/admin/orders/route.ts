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
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, status, driverId, refundAmount } = await request.json()
  const supabase = createAdminClient()

  const updateData: Record<string, any> = {}
  if (status) updateData.status = status
  if (driverId) updateData.driver_id = driverId

  const { data: order } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

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
  if (refundAmount && order.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
    if (pi.latest_charge) {
      await stripe.refunds.create({
        charge: pi.latest_charge as string,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer',
      })
    }
  }

  return NextResponse.json({ order })
}
