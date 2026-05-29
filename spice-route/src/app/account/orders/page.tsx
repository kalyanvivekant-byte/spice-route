import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  received: 'bg-blue-100 text-blue-800',
  picking: 'bg-purple-100 text-purple-800',
  packed: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(product_name, quantity, unit_price_eur, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {!orders?.length ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-muted-foreground">No orders yet.</p>
          <Link href="/products" className="mt-4 inline-block text-saffron-600 hover:underline">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="border rounded-2xl overflow-hidden">
              <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">#{order.order_number}</span>
                  <span className="text-muted-foreground text-xs ml-3">
                    {format(new Date(order.created_at), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                  <span className="font-bold">{formatCurrency(order.total_eur)}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.items?.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="text-xs bg-muted rounded px-2 py-1">
                      {item.product_name} ×{item.quantity}
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="text-xs text-muted-foreground rounded px-2 py-1">
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm text-saffron-600 hover:underline font-medium"
                  >
                    View Details
                  </Link>
                  {order.status === 'out_for_delivery' && (
                    <Link
                      href={`/track/${order.id}`}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Track Live
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
