import type { SupabaseClient } from '@supabase/supabase-js'

const PRODUCT_SELECT = `
  id, name, slug, brand, dietary_tags, is_featured, expiry_discount, created_at,
  images:product_images(url, is_primary),
  variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity)),
  reviews(rating)
`

export type CollectionRow = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  type: string
  show_on_home?: boolean
}

export function mapProduct(p: any) {
  return {
    ...p,
    primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
    stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
    avg_rating: p.reviews?.length
      ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length
      : 0,
    review_count: p.reviews?.length ?? 0,
  }
}

function isOnSale(p: any) {
  return (p.variants ?? []).some(
    (v: any) => v.compare_at_price_eur && Number(v.compare_at_price_eur) > Number(v.price_eur)
  )
}

/**
 * Resolve the products that belong to a collection, depending on its type.
 * Works with any Supabase client (anon for storefront, admin for previews).
 */
export async function resolveCollectionProducts(
  supabase: SupabaseClient,
  collection: { id: string; type: string },
  limit = 24
) {
  if (collection.type === 'manual') {
    const { data } = await supabase
      .from('collection_products')
      .select(`sort_order, product:products(${PRODUCT_SELECT})`)
      .eq('collection_id', collection.id)
      .order('sort_order', { ascending: true })
      .limit(limit)
    return (data ?? [])
      .map((r: any) => r.product)
      .filter((p: any) => p && p.is_active !== false)
      .map(mapProduct)
  }

  if (collection.type === 'bestsellers') {
    // Aggregate units sold from order_items.
    const { data: sold } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .not('product_id', 'is', null)
      .limit(5000)
    const totals = new Map<string, number>()
    for (const r of (sold ?? []) as any[]) {
      totals.set(r.product_id, (totals.get(r.product_id) ?? 0) + (r.quantity ?? 0))
    }
    const topIds = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id)
    if (topIds.length) {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('id', topIds)
        .eq('is_active', true)
      const order = new Map(topIds.map((id, i) => [id, i]))
      return (data ?? [])
        .map(mapProduct)
        .sort((a: any, b: any) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    }
    // Fallback: featured products when there are no sales yet.
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit)
    return (data ?? []).map(mapProduct)
  }

  if (collection.type === 'featured') {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit)
    return (data ?? []).map(mapProduct)
  }

  if (collection.type === 'new_arrivals') {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []).map(mapProduct)
  }

  if (collection.type === 'on_sale') {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(96)
    return (data ?? []).filter(isOnSale).map(mapProduct).slice(0, limit)
  }

  return []
}
