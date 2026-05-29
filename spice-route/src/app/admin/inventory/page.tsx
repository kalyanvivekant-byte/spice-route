import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'

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

  const lowCount = (items ?? []).filter(
    (i: any) => i.quantity <= (i.low_stock_threshold ?? 10)
  ).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <span className="text-sm text-yellow-400">{lowCount} item(s) low on stock</span>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Supplier</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Threshold</th>
              <th className="text-left p-4">Cost</th>
              <th className="text-left p-4">Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items?.map((i: any) => {
              const low = i.quantity <= (i.low_stock_threshold ?? 10)
              return (
                <tr key={i.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-white">
                    {i.variant?.product?.name}
                    <span className="text-gray-500 text-xs"> · {i.variant?.name}</span>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{i.variant?.sku ?? '–'}</td>
                  <td className="p-4 text-gray-400 text-xs">{i.supplier?.name ?? '–'}</td>
                  <td className="p-4">
                    <span className={`font-medium ${low ? 'text-red-400' : 'text-green-400'}`}>
                      {i.quantity} {low && '⚠️'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{i.low_stock_threshold}</td>
                  <td className="p-4 text-gray-400">
                    {i.cost_price_eur != null ? formatCurrency(i.cost_price_eur) : '–'}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{i.expiry_date ?? '–'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(!items || items.length === 0) && (
          <p className="p-6 text-gray-500 text-sm">No inventory records yet.</p>
        )}
      </div>
    </div>
  )
}
