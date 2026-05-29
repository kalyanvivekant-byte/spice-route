import { createAdminClient } from '@/lib/supabase/server'
import { InventoryTable } from './InventoryTable'

export default async function AdminInventoryPage() {
  const supabase = createAdminClient()
  const { data: items } = await supabase
    .from('inventory')
    .select(`
      id, quantity, low_stock_threshold, cost_price_eur, expiry_date,
      variant:product_variants(name, sku, product:products(name)),
      supplier:suppliers(name)
    `)
    .order('quantity', { ascending: true })
    .limit(200)

  return <InventoryTable items={(items as any) ?? []} />
}
