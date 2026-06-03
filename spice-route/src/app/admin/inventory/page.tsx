import { createAdminClient } from '@/lib/supabase/server'
import { InventoryManager } from './InventoryManager'
import { AddProductForm } from './AddProductForm'
import { UntrackedProducts } from './UntrackedProducts'
import { ScanToStock } from './ScanToStock'
import Link from 'next/link'
import { History } from 'lucide-react'

export default async function AdminInventoryPage() {
  const supabase = createAdminClient()

  const [{ data: items }, { data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('inventory')
      .select(`
        id, quantity, low_stock_threshold, cost_price_eur, expiry_date,
        variant:product_variants(
          id, name, sku, price_eur, compare_at_price_eur,
          product:products(id, name, brand, is_active, category:categories(id, name), images:product_images(id, url, is_primary))
        ),
        supplier:suppliers(id, name)
      `)
      .order('quantity', { ascending: true })
      .limit(500),
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
    <div className="min-h-full bg-[#fffaf3] text-gray-900">
      <div className="px-6 pt-6">
        <div className="flex justify-end mb-3">
          <Link href="/admin/inventory/history" className="inline-flex items-center gap-1.5 text-sm text-saffron-700 hover:underline">
            <History className="h-4 w-4" /> Stock history
          </Link>
        </div>
        <ScanToStock categories={(categories as any) ?? []} />
        <AddProductForm categories={(categories as any) ?? []} />
        <UntrackedProducts products={(products as any) ?? []} />
      </div>
      <InventoryManager items={(items as any) ?? []} categories={(categories as any) ?? []} />
    </div>
  )
}
