import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'
import Link from 'next/link'
import { AdminOrderActions } from '@/components/admin/AdminOrderActions'

const STATUS_PIPELINE = ['received', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createAdminClient()
  const status = searchParams.status ?? ''
  const page = parseInt(searchParams.page ?? '1')
  const limit = 50

  let query = supabase
    .from('orders')
    .select('*, items:order_items(product_name, quantity)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)

  const { data: orders, count } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-gray-400 text-sm">{count?.toLocaleString()} total</span>
      </div>

      {/* Pipeline filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/orders"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!status ? 'bg-saffron-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          All
        </Link>
        {STATUS_PIPELINE.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${status === s ? 'bg-saffron-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Order</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {orders?.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-800/50 transition">
                <td className="p-4">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-saffron-400 hover:underline">
                    #{order.order_number}
                  </Link>
                </td>
                <td className="p-4 text-gray-300 text-xs">{order.guest_email ?? order.user_id?.slice(0, 8) + '...'}</td>
                <td className="p-4 text-gray-400 text-xs">{order.items?.length ?? 0} items</td>
                <td className="p-4 font-medium">{formatCurrency(order.total_eur)}</td>
                <td className="p-4">
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded capitalize">
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {format(new Date(order.created_at), 'dd MMM HH:mm')}
                </td>
                <td className="p-4">
                  <AdminOrderActions
                    orderId={order.id}
                    currentStatus={order.status}
                    total={order.total_eur}
                    paymentIntentId={order.stripe_payment_intent_id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
