import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { subDays, format } from 'date-fns'

export default async function AdminAnalyticsPage() {
  const supabase = createAdminClient()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const [revenueResult, topProducts, repeatCustomers, deliveryMetrics] = await Promise.all([
    supabase.from('orders')
      .select('total_eur, created_at')
      .not('status', 'in', '("pending_payment","cancelled")')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('product_sales_rank').select('*').limit(10),
    supabase.from('orders')
      .select('user_id')
      .not('user_id', 'is', null)
      .not('status', 'in', '("pending_payment","cancelled")')
      .gte('created_at', thirtyDaysAgo),
    supabase.from('orders')
      .select('status, created_at, updated_at')
      .eq('status', 'delivered')
      .gte('created_at', thirtyDaysAgo),
  ])

  const totalRevenue = revenueResult.data?.reduce((s, o) => s + o.total_eur, 0) ?? 0
  const totalOrders = revenueResult.data?.length ?? 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Repeat customers
  const customerOrderCounts = (repeatCustomers.data ?? []).reduce((acc: Record<string, number>, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + 1
    return acc
  }, {})
  const repeatRate = Object.values(customerOrderCounts).filter(c => c > 1).length / Math.max(Object.keys(customerOrderCounts).length, 1)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics (Last 30 Days)</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Orders', value: totalOrders.toString() },
          { label: 'Avg Order Value', value: formatCurrency(avgOrderValue) },
          { label: 'Repeat Customer Rate', value: `${(repeatRate * 100).toFixed(1)}%` },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold mb-4">Top Selling Products</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-800">
              <th className="text-left pb-2">Product</th>
              <th className="text-right pb-2">Units Sold</th>
              <th className="text-right pb-2">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {topProducts.data?.map((p: any, i: number) => (
              <tr key={p.product_id} className="py-2">
                <td className="py-2 text-gray-300">
                  <span className="text-gray-500 mr-2">#{i + 1}</span>
                  {p.name}
                </td>
                <td className="py-2 text-right text-gray-300">{p.total_sold}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(p.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
