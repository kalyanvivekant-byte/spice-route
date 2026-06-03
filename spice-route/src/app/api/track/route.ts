import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public order/parcel lookup → returns minimal tracking info (no PII).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'Enter an order or tracking number' }, { status: 400 })

  const supabase = createAdminClient()

  // 1) Try by tracking number directly.
  let { data: shipment } = await supabase
    .from('shipments')
    .select('carrier, method_name, tracking_number, tracking_url, status, order_id')
    .eq('tracking_number', q)
    .order('created_at', { ascending: false })
    .maybeSingle()

  let orderId: string | null = shipment?.order_id ?? null
  let orderStatus: string | null = null
  let orderNumber: string | null = null

  // 2) Otherwise try by order number.
  if (!shipment) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .ilike('order_number', q)
      .maybeSingle()
    if (order) {
      orderId = order.id
      orderStatus = order.status
      orderNumber = order.order_number
      const { data: sh } = await supabase
        .from('shipments')
        .select('carrier, method_name, tracking_number, tracking_url, status, order_id')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .maybeSingle()
      shipment = sh
    }
  }

  if (!shipment && !orderId) {
    return NextResponse.json({ found: false }, { status: 404 })
  }

  return NextResponse.json({
    found: true,
    orderId,
    orderNumber,
    orderStatus,
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          method: shipment.method_name,
          trackingNumber: shipment.tracking_number,
          trackingUrl: shipment.tracking_url,
          status: shipment.status,
        }
      : null,
  })
}
