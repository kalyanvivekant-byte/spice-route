import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calculateOrderTotals } from '@/lib/vat'

type PosItem = { variantId: string; quantity: number }
type Payment = { method: 'cash' | 'card' | 'terminal'; cashReceived?: number }

/**
 * Record an in-store POS sale.
 * - Validates live stock against the same inventory the website uses.
 * - Creates an order (channel = 'pos', status = 'delivered') + order_items.
 * - Decrements inventory so the website never oversells.
 */
export async function POST(request: NextRequest) {
  try {
    // Staff guard
    const auth = createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'cashier'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const items: PosItem[] = body.items ?? []
    const payment: Payment = body.payment ?? { method: 'cash' }
    const countryCode: string = body.countryCode ?? 'NL'

    if (!items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const supabase = createAdminClient()

    // Load variants + stock
    const variantIds = items.map((i) => i.variantId)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, price_eur, name, product_id, product:products(name, images:product_images(url, is_primary)), inventory(quantity)')
      .in('id', variantIds)

    if (!variants || variants.length !== items.length) {
      return NextResponse.json({ error: 'Some products are no longer available' }, { status: 400 })
    }

    // Validate stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: 'Product not found' }, { status: 400 })
      const stock = (variant.inventory as any)?.quantity ?? 0
      if (item.quantity < 1) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${stock} left of ${(variant.product as any)?.name ?? 'item'}` },
          { status: 400 }
        )
      }
    }

    // Totals (prices are VAT-inclusive; no delivery fee in-store)
    const cartItems = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!
      return { price: Number(variant.price_eur), quantity: item.quantity }
    })
    const totals = calculateOrderTotals(cartItems, 0, 0, countryCode)

    // Cash handling
    let cashReceived: number | null = null
    let changeDue: number | null = null
    if (payment.method === 'cash') {
      cashReceived = Number(payment.cashReceived ?? 0)
      if (cashReceived < totals.total) {
        return NextResponse.json({ error: 'Cash received is less than total' }, { status: 400 })
      }
      changeDue = Math.round((cashReceived - totals.total) * 100) / 100
    }

    const paymentMethodLabel =
      payment.method === 'cash' ? 'cash' : payment.method === 'terminal' ? 'card_terminal' : 'card_manual'

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null,
        status: 'delivered',
        channel: 'pos',
        delivery_type: 'click_and_collect',
        payment_method: paymentMethodLabel,
        country_code: countryCode,
        subtotal_eur: totals.subtotal,
        delivery_fee_eur: 0,
        discount_eur: 0,
        vat_eur: totals.vatAmount,
        vat_rate: totals.vatRate,
        total_eur: totals.total,
        cash_received_eur: cashReceived,
        change_due_eur: changeDue,
        notes: `In-store sale by ${profile.role}`,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Order items
    const orderItems = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!
      const product = variant.product as any
      return {
        order_id: order.id,
        variant_id: item.variantId,
        product_id: variant.product_id,
        product_name: product?.name ?? '',
        variant_name: variant.name,
        quantity: item.quantity,
        unit_price_eur: Number(variant.price_eur),
        total_price_eur: Math.round(Number(variant.price_eur) * item.quantity * 100) / 100,
        vat_rate: totals.vatRate,
        image_url:
          product?.images?.find((i: any) => i.is_primary)?.url ?? product?.images?.[0]?.url ?? null,
      }
    })
    await supabase.from('order_items').insert(orderItems)

    // Decrement shared inventory
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)!
      const current = (variant.inventory as any)?.quantity ?? 0
      await supabase
        .from('inventory')
        .update({ quantity: Math.max(0, current - item.quantity) })
        .eq('variant_id', item.variantId)
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      total: totals.total,
      vat: totals.vatAmount,
      changeDue,
      cashReceived,
      paymentMethod: paymentMethodLabel,
    })
  } catch (error: any) {
    console.error('pos/checkout error', error)
    return NextResponse.json({ error: error.message ?? 'Checkout failed' }, { status: 500 })
  }
}
