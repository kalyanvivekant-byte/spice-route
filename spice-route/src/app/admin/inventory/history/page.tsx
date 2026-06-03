import { createAdminClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const REASON_COLORS: Record<string, string> = {
  received: 'bg-green-100 text-green-700',
  correction: 'bg-amber-100 text-amber-700',
  sale: 'bg-blue-100 text-blue-700',
  damage: 'bg-red-100 text-red-700',
  count: 'bg-gray-100 text-gray-700',
}

export default async function InventoryHistoryPage() {
  const supabase = createAdminClient()
  const { data: adj } = await supabase
    .from('inventory_adjustments')
    .select('id, delta, new_quantity, reason, created_at, variant:product_variants(name, product:products(name)), supplier:suppliers(name), profile:profiles!created_by(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(300)

  return (
    <div className="min-h-full bg-[#fffaf3] text-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold">Stock history</h1>
            <p className="text-sm text-gray-500">Every stock change — receiving, corrections, and edits.</p>
          </div>
          <Link href="/admin/inventory" className="text-sm text-saffron-600 hover:underline">← Inventory</Link>
        </div>

        <div className="bg-white border border-saffron-100 shadow-sm rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-saffron-100">
                <th className="p-3">When</th>
                <th className="p-3">Product</th>
                <th className="p-3">Change</th>
                <th className="p-3">New qty</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {(adj ?? []).length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No stock changes recorded yet.</td></tr>
              )}
              {(adj as any[] ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{format(new Date(a.created_at), 'dd MMM HH:mm')}</td>
                  <td className="p-3">{a.variant?.product?.name ?? '—'} <span className="text-gray-400">· {a.variant?.name}</span></td>
                  <td className={`p-3 font-semibold ${a.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{a.delta >= 0 ? `+${a.delta}` : a.delta}</td>
                  <td className="p-3 text-gray-700">{a.new_quantity}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${REASON_COLORS[a.reason] ?? 'bg-gray-100 text-gray-700'}`}>{a.reason ?? '—'}</span></td>
                  <td className="p-3 text-gray-500 text-xs">{a.supplier?.name ?? '—'}</td>
                  <td className="p-3 text-gray-500 text-xs">{a.profile?.full_name ?? a.profile?.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
