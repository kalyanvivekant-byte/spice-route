import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  { key: 'received', label: 'Order received' },
  { key: 'picking', label: 'Picking items' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export default async function TrackOrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, total_eur, created_at, delivery_address')
    .eq('id', params.id)
    .maybeSingle()

  if (!order) notFound()

  const { data: shipment } = await supabase
    .from('shipments')
    .select('carrier, method_name, tracking_number, tracking_url, status')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .maybeSingle()

  const currentIndex = STEPS.findIndex((s) => s.key === order.status)
  const cancelled = order.status === 'cancelled' || order.status === 'refunded'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Track Order</h1>
      <p className="text-muted-foreground text-sm mb-8">#{order.order_number}</p>

      {shipment?.tracking_number && (
        <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 mb-8">
          <p className="text-sm font-semibold text-gray-900">
            Shipped{shipment.carrier ? ` via ${shipment.carrier}` : ''}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            Tracking: <span className="font-mono">{shipment.tracking_number}</span>
            {shipment.status ? ` · ${shipment.status}` : ''}
          </p>
          {shipment.tracking_url && (
            <a href={shipment.tracking_url} target="_blank" rel="noreferrer"
              className="inline-block mt-2 text-sm font-semibold text-saffron-700 hover:underline">
              Track parcel with carrier →
            </a>
          )}
        </div>
      )}

      {cancelled ? (
        <div className="rounded-2xl border p-6 text-center">
          <p className="font-medium capitalize">This order was {order.status.replace(/_/g, ' ')}.</p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-muted ml-3 space-y-8">
          {STEPS.map((step, i) => {
            const done = i <= currentIndex
            const active = i === currentIndex
            return (
              <li key={step.key} className="ml-6">
                <span
                  className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ${
                    done ? 'bg-saffron-500' : 'bg-muted'
                  }`}
                >
                  {done && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <p className={`text-sm font-medium ${active ? 'text-saffron-600' : done ? '' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-10">
        <Link href="/account/orders" className="text-saffron-600 hover:underline text-sm font-medium">
          ← Back to my orders
        </Link>
      </div>
    </div>
  )
}
