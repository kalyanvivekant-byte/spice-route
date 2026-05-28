import { NextRequest, NextResponse } from 'next/server'
import { stripe, getStripePaymentMethods } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateOrderTotals } from '@/lib/vat'

export async function POST(request: NextRequest) {
  try {
    const { items, deliveryData, userId } = await request.json()
    const supabase = createAdminClient()

    // Verify variant prices and stock
    const variantIds = items.map((i: any) => i.variantId)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, price_eur, name, product_id, product:products(name, images:product_images(url, is_primary)), inventory(quantity)')
      .in('id', variantIds)
      .eq('is_active', true)

    if (!variants || variants.length !== items.length) {
      return NextResponse.json({ error: 'Some products are no longer available' }, { status: 400 })
    }

    // Check stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: 'Product not found' }, { status: 400 })
      const stock = (variant.inventory as any)?.quantity ?? 0
      if (stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${(variant.product as any)?.name}` }, { status: 400 })
      }
    }

    // Calculate totals
    const cartItems = items.map((item: any) => {
      const variant = variants.find((v) => v.id === item.variantId)!
      return { price: variant.price_eur, quantity: item.quantity }
    })

    const isExpress = deliveryData.slotId?.includes('slot-4')
    const deliveryFee = isExpress ? 9.99 : 4.99
    const totals = calculateOrderTotals(cartItems, deliveryFee, 0, deliveryData.countryCode)

    // Create Stripe PaymentIntent
    const paymentMethods = getStripePaymentMethods(deliveryData.countryCode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totals.total * 100), // cents
      currency: 'eur',
      payment_method_types: paymentMethods,
      metadata: {
        userId: userId ?? 'guest',
        countryCode: deliveryData.countryCode,
      },
      receipt_email: deliveryData.email,
    })

    // Create order in DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId ?? null,
        guest_email: userId ? null : deliveryData.email,
        status: 'pending_payment',
        delivery_type: deliveryData.deliveryType,
        delivery_address: deliveryData.deliveryType === 'home_delivery' ? {
          first_name: deliveryData.firstName,
          last_name: deliveryData.lastName,
          street_line1: deliveryData.streetLine1,
          street_line2: deliveryData.streetLine2,
          city: deliveryData.city,
          postal_code: deliveryData.postalCode,
          country_code: deliveryData.countryCode,
          phone: deliveryData.phone,
        } : null,
        delivery_slot_id: deliveryData.slotId ?? null,
        country_code: deliveryData.countryCode,
        stripe_payment_intent_id: paymentIntent.id,
        subtotal_eur: totals.subtotal,
        delivery_fee_eur: totals.deliveryFee,
        discount_eur: totals.discount,
        vat_eur: totals.vatAmount,
        vat_rate: totals.vatRate,
        total_eur: totals.total,
        notes: deliveryData.notes ?? null,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = items.map((item: any) => {
      const variant = variants.find((v) => v.id === item.variantId)!
      const product = variant.product as any
      return {
        order_id: order.id,
        variant_id: item.variantId,
        product_id: variant.product_id,
        product_name: product?.name ?? '',
        variant_name: variant.name,
        quantity: item.quantity,
        unit_price_eur: variant.price_eur,
        total_price_eur: variant.price_eur * item.quantity,
        vat_rate: totals.vatRate,
        image_url: product?.images?.find((i: any) => i.is_primary)?.url ?? product?.images?.[0]?.url ?? null,
      }
    })

    await supabase.from('order_items').insert(orderItems)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error: any) {
    console.error('create-intent error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
