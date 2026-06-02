import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { SalesCharts } from '@/components/admin/SalesCharts'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const supabase = createAdminClient()
  const days = [7, 30, 90].includes(Number(searchParams.range)) ? Number(searchParams.range) : 30
  const since = subDays(new Date(), days - 1)
  const sinceIso = subDays(new Date(), days).toISOString()

  // Valid (paid/fulfilled) orders in range
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_eur, created_at, channel, user_id')
    .not('status', 'in', '("pending_payment","cancelled")')
    .gte('created_at', sinceIso)

  const orderList = orders ?? []
  const orderIds = orderList.map((o) => o.id)

  // Order items for those orders
  let items: any[] = []
  if (orderIds.length) {
    const { data: itemRows } = await supabase
      .from('order_items')
      .select('order_id, product_id, product_name, quantity, total_price_eur')
      .in('order_id', orderIds)
    items = itemRows ?? []
  }

  // Category lookup (resolve subcategory → top-level)
  const { data: cats } = await supabase.from('categories').select('id, name, parent_id')
  const catById = new Map((cats ?? []).map((c: any) => [c.id, c]))
  function topCatName(catId: string | null): string {
    let c = catId ? catById.get(catId) : null
    while (c?.parent_id && catById.get(c.parent_id)) c = catById.get(c.parent_id)
    return c?.name ?? 'Uncategorised'
  }
  const { data: prods } = await supabase.from('products').select('id, category_id')
  const prodCat = new Map((prods ?? []).map((p: any) => [p.id, p.category_id]))

  // ── Summary
  const totalRevenue = orderList.reduce((s, o) => s + Number(o.total_eur), 0)
  const totalOrders = orderList.length
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0
  const counts = orderList.reduce((acc: Record<string, number>, o) => {
    if (o.user_id) acc[o.user_id] = (acc[o.user_id] ?? 0) + 1
    return acc
  }, {})
  const repeatRate =
    Object.values(counts).filter((c) => c > 1).length / Math.max(Object.keys(counts).length, 1)

  // ── Daily series (fill zeros)
  const byDay = new Map<string, { revenue: number; orders: number }>()
  for (const o of orderList) {
    const k = format(new Date(o.created_at), 'yyyy-MM-dd')
    const cur = byDay.get(k) ?? { revenue: 0, orders: 0 }
    cur.revenue += Number(o.total_eur); cur.orders += 1
    byDay.set(k, cur)
  }
  const daily = eachDayOfInterval({ start: since, end: new Date() }).map((d) => {
    const k = format(d, 'yyyy-MM-dd')
    const v = byDay.get(k) ?? { revenue: 0, orders: 0 }
    return { label: format(d, 'd MMM'), revenue: Math.round(v.revenue * 100) / 100, orders: v.orders }
  })

  // ── Category + product sales
  const catTotals = new Map<string, number>()
  const prodTotals = new Map<string, { name: string; units: number; revenue: number }>()
  for (const it of items) {
    const name = topCatName(prodCat.get(it.product_id) ?? null)
    catTotals.set(name, (catTotals.get(name) ?? 0) + Number(it.total_price_eur))
    const key = it.product_id ?? it.product_name
    const cur = prodTotals.get(key) ?? { name: it.product_name, units: 0, revenue: 0 }
    cur.units += it.quantity; cur.revenue += Number(it.total_price_eur)
    prodTotals.set(key, cur)
  }
  const categories = Array.from(catTotals.entries())
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
  const topProducts = Array.from(prodTotals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ── Channel split
  const chTotals = new Map<string, number>()
  for (const o of orderList) {
    const ch = (o as any).channel ?? 'web'
    chTotals.set(ch, (chTotals.get(ch) ?? 0) + Number(o.total_eur))
  }
  const channels = Array.from(chTotals.entries()).map(([name, revenue]) => ({ name, revenue }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/analytics?range=${r.days}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${days === r.days ? 'bg-saffron-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Orders', value: totalOrders.toString() },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue) },
          { label: 'Repeat Customer Rate', value: `${(repeatRate * 100).toFixed(1)}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <SalesCharts daily={daily} categories={categories} channels={channels} />

      {/* Top products */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold mb-4">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No sales in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-800">
                <th className="text-left pb-2">Product</th>
                <th className="text-right pb-2">Units Sold</th>
                <th className="text-right pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {topProducts.map((p, i) => (
                <tr key={p.name + i}>
                  <td className="py-2 text-gray-300"><span className="text-gray-500 mr-2">#{i + 1}</span>{p.name}</td>
                  <td className="py-2 text-right text-gray-300">{p.units}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
