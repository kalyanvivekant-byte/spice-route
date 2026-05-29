import { createAdminClient } from '@/lib/supabase/server'
import { InventoryTable } from './InventoryTable'
import { ProductCatalog } from './ProductCatalog'
import { AddProductForm } from './AddProductForm'

export default async function AdminInventoryPage() {
  const supabase = createAdminClient()

  const [{ data: items }, { data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('inventory')
      .select(`
        id, quantity, low_stock_threshold, cost_price_eur, expiry_date,
        variant:product_variants(id, name, sku, price_eur, compare_at_price_eur, product:products(name)),
        supplier:suppliers(name)
      `)
      .order('quantity', { ascending: true })
      .limit(200),
    supabase
      .from('products')
      .select(`
        id, name, brand, is_active,
        images:product_images(url, is_primary),
        variants:product_variants(id, name, inventory(id))
      `)
      .order('name', { ascending: true })
      .limit(500),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <>
      <div className="px-6 pt-6">
        <AddProductForm categories={(categories as any) ?? []} />
        <ProductCatalog products={(products as any) ?? []} />
      </div>
      <InventoryTable items={(items as any) ?? []} />
    </>
  )
}
