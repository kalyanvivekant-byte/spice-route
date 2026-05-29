import { createAdminClient } from '@/lib/supabase/server'
import { Register, type PosItem, type PosCategory } from './Register'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
  const supabase = createAdminClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase
      .from('products')
      .select(`
        id, name, brand, category_id, is_active,
        images:product_images(url, is_primary),
        variants:product_variants(id, name, sku, barcode, price_eur, is_active, inventory(quantity))
      `)
      .eq('is_active', true)
      .limit(1000),
  ])

  // Flatten to one sellable tile per active variant.
  const items: PosItem[] = []
  for (const p of (products ?? []) as any[]) {
    const image =
      p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url ?? null
    for (const v of p.variants ?? []) {
      if (!v.is_active) continue
      items.push({
        variantId: v.id,
        variantName: v.name,
        productName: p.name,
        brand: p.brand ?? null,
        categoryId: p.category_id ?? null,
        sku: v.sku,
        barcode: v.barcode ?? null,
        price: Number(v.price_eur),
        stock: (v.inventory as any)?.quantity ?? 0,
        image,
      })
    }
  }

  items.sort((a, b) => a.productName.localeCompare(b.productName))

  const cats: PosCategory[] = ((categories ?? []) as any[]).map((c) => ({ id: c.id, name: c.name }))

  return <Register items={items} categories={cats} />
}
