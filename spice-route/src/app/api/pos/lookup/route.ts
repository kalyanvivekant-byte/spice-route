import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POS barcode / SKU lookup.
 * GET /api/pos/lookup?code=8901234567890
 * Returns the matching variant (with product name, image, price, stock) or 404.
 */
export async function GET(request: NextRequest) {
  // Staff guard
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'cashier'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const code = request.nextUrl.searchParams.get('code')?.trim()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: variant } = await supabase
    .from('product_variants')
    .select(`
      id, name, sku, barcode, price_eur,
      product:products(id, name, brand, images:product_images(url, is_primary)),
      inventory(quantity)
    `)
    .or(`barcode.eq.${code},sku.eq.${code}`)
    .eq('is_active', true)
    .maybeSingle()

  if (!variant) return NextResponse.json({ found: false }, { status: 404 })

  const product = variant.product as any
  return NextResponse.json({
    found: true,
    item: {
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      productName: product?.name ?? '',
      price: Number(variant.price_eur),
      stock: (variant.inventory as any)?.quantity ?? 0,
      image:
        product?.images?.find((i: any) => i.is_primary)?.url ??
        product?.images?.[0]?.url ??
        null,
    },
  })
}
