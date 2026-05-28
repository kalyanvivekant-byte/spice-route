import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { TrendingUp, ShoppingBag, Users, AlertTriangle } from 'lucide-react'
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [ordersResult, customersResult, revenueResult, lowStockResult] = await Promise.all([
    supabase.from('orders').select('id, status', { count: 'exact' }).neq('status', 'pending_payment'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
    supabase.from('orders').select('total_eur').not('status', 'in', '("pending_payment","cancelled")'),
    supabase.from('inventory')
      .select('quantity, low_stock_threshold, variant:product_variants(name, product:products(name))')
      .filter('quantity', 'lte', 'low_stock_threshold')
      .limit(5),
  ])

  const totalRevenue = revenueResult.data?.reduce((s, o) => s + o.total_eur, 0) ?? 0
  const pendingOrders = ordersResult.data?.filter(o => ['received','picking','packed'].includes(o.status)).length ?? 0

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Orders', value: (ordersResult.count ?? 0).toLocaleString(), icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Customers', value: (customersResult.count ?? 0).toLocaleString(), icon: Users, color: 'text-purple-400' },
    { label: 'Pending Orders', value: pendingOrders.toString(), icon: AlertTriangle, color: 'text-yellow-400' },
  ]

  const recentOrders = ordersResult.data?.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold mb-4">Revenue (last 30 days)</h2>
        <AdminRevenueChart />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order pipeline */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Order Pipeline</h2>
          <div className="space-y-2">
            {['received', 'picking', 'packed', 'out_for_delivery'].map((status) => {
              const count = ordersResult.data?.filter(o => o.status === status).length ?? 0
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Low Stock Alerts
          </h2>
          {lowStockResult.data?.length === 0 ? (
            <p className="text-sm text-gray-400">All stock levels are healthy!</p>
          ) : (
            <div className="space-y-2">
              {lowStockResult.data?.map((item: any) => (
                <div key={item.variant?.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate">{item.variant?.product?.name} ({item.variant?.name})</span>
                  <span className="text-red-400 font-medium">{item.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
