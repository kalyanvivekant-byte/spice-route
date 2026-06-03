import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { createParcelWithLabel, getParcelStatus, sendcloudConfigured } from '@/lib/shipping/sendcloud'
import { sendOrderDispatched } from '@/lib/email/resend'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// Create a shipment + label for an order via Sendcloud.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!sendcloudConfigured()) {
    return NextResponse.json({ error: 'Sendcloud is not configured. Add SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY.' }, { status: 400 })
  }

  const { orderId, shippingMethodId, methodName, weightGrams } = await request.json()
  if (!orderId || !shippingMethodId) return NextResponse.json({ error: 'Missing order or shipping method' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const addr = order.delivery_address ?? {}
  if (!addr.street_line1 || !addr.city || !addr.postal_code) {
    return NextResponse.json({ error: 'Order has no delivery address (click & collect orders cannot be shipped)' }, { status: 400 })
  }

  const email = order.guest_email ??
    (await supabase.from('profiles').select('email').eq('id', order.user_id).single()).data?.email ?? undefined

  let parcel
  try {
    parcel = await createParcelWithLabel({
      name: `${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim() || 'Customer',
      address: addr.street_line1,
      houseNumber: addr.house_number ?? '',
      city: addr.city,
      postalCode: addr.postal_code,
      countryCode: (addr.country_code ?? order.country_code ?? 'NL').toUpperCase(),
      email,
      telephone: addr.phone ?? '',
      orderNumber: order.order_number,
      weightGrams: Number(weightGrams) || 1000,
      shippingMethodId: Number(shippingMethodId),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Label creation failed' }, { status: 500 })
  }

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      order_id: orderId,
      provider: 'sendcloud',
      sendcloud_parcel_id: parcel.parcelId,
      carrier: parcel.carrier,
      method_name: parcel.methodName ?? methodName ?? null,
      tracking_number: parcel.trackingNumber,
      tracking_url: parcel.trackingUrl,
      label_url: parcel.labelUrl,
      status: parcel.status,
      weight_grams: Number(weightGrams) || 1000,
      created_by: admin.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Move order to out_for_delivery, log event, email tracking link.
  await supabase.from('orders').update({ status: 'out_for_delivery' }).eq('id', orderId)
  await supabase.from('order_events').insert({
    order_id: orderId, type: 'fulfilment', created_by: admin.id,
    message: `Shipment created${parcel.carrier ? ' via ' + parcel.carrier : ''}${parcel.trackingNumber ? ' · ' + parcel.trackingNumber : ''}`,
  })
  if (email && parcel.trackingUrl) {
    await sendOrderDispatched(order, email, parcel.trackingUrl).catch(console.error)
  }

  return NextResponse.json({ shipment })
}

// Refresh tracking status from Sendcloud.
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { shipmentId } = await request.json()
  const supabase = createAdminClient()
  const { data: shipment } = await supabase.from('shipments').select('*').eq('id', shipmentId).single()
  if (!shipment?.sendcloud_parcel_id) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })

  try {
    const s = await getParcelStatus(shipment.sendcloud_parcel_id)
    const { data: updated } = await supabase
      .from('shipments')
      .update({ status: s.status ?? shipment.status, tracking_number: s.trackingNumber ?? shipment.tracking_number, tracking_url: s.trackingUrl ?? shipment.tracking_url })
      .eq('id', shipmentId)
      .select()
      .single()
    return NextResponse.json({ shipment: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Refresh failed' }, { status: 500 })
  }
}
