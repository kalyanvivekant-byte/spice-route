import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { code, orderId } = await request.json()
  const supabase = createAdminClient()

  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .gte('valid_until', new Date().toISOString())
    .single()

  if (!promo) return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 })
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 })
  }

  // Get order to check min order value
  const { data: order } = await supabase.from('orders').select('subtotal_eur').eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.subtotal_eur < promo.min_order_eur) {
    return NextResponse.json({ error: `Minimum order of €${promo.min_order_eur} required` }, { status: 400 })
  }

  const discount = promo.discount_type === 'percentage'
    ? order.subtotal_eur * (promo.discount_value / 100)
    : promo.discount_value

  // Apply discount to order
  await supabase
    .from('orders')
    .update({ promo_code: code, discount_eur: discount })
    .eq('id', orderId)

  // Increment uses
  await supabase.from('promo_codes').update({ uses_count: promo.uses_count + 1 }).eq('id', promo.id)

  return NextResponse.json({ discount, message: `${promo.description}` })
}
