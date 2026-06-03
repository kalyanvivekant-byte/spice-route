import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'
import { AdminOrderActions } from '@/components/admin/AdminOrderActions'
import { OrderShipping } from '@/components/admin/OrderShipping'
import { OrderNotes } from '@/components/admin/OrderNotes'
import { sendcloudConfigured } from '@/lib/shipping/sendcloud'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-gray-700 text-gray-300',
  received: 'bg-blue-500/20 text-blue-300',
  picking: 'bg-indigo-500/20 text-indigo-300',
  packed: 'bg-purple-500/20 text-purple-300',
  out_for_delivery: 'bg-amber-500/20 text-amber-300',
  delivered: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
  refunded: 'bg-red-500/20 text-red-300',
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', params.id)
    .single()
  if (!order) notFound()

  const [{ data: events }, { data: shipment }, profileRes] = await Promise.all([
    supabase.from('order_events').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
    supabase.from('shipments').select('*').eq('order_id', order.id).order('created_at', { ascending: false }).maybeSingle(),
    order.user_id
      ? supabase.from('profiles').select('full_name, email, phone').eq('id', order.user_id).single()
      : Promise.resolve({ data: null } as any),
  ])

  const addr = order.delivery_address ?? {}
  const customerEmail = order.guest_email ?? profileRes?.data?.email ?? '—'
  const customerName = `${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim() || profileRes?.data?.full_name || 'Guest'

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <Link href="/admin/orders" className="text-sm text-saffron-400 hover:underline">← Orders</Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono">#{order.order_number}</h1>
          <p className="text-sm text-gray-400">{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')} · {order.channel === 'pos' ? 'In-store (POS)' : 'Online'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-700'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
          <AdminOrderActions orderId={order.id} currentStatus={order.status} total={order.total_eur} paymentIntentId={order.stripe_payment_intent_id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items + shipping + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-3">Items</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-800">
                {order.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td className="py-2 text-gray-200">{it.product_name} <span className="text-gray-500">· {it.variant_name}</span></td>
                    <td className="py-2 text-right text-gray-400">×{it.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(it.total_price_eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-800 mt-3 pt-3 space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal_eur)} />
              {order.discount_eur > 0 && <Row label={`Discount${order.promo_code ? ' (' + order.promo_code + ')' : ''}`} value={`−${formatCurrency(order.discount_eur)}`} />}
              <Row label="Delivery" value={formatCurrency(order.delivery_fee_eur)} />
              <Row label={`VAT (incl.)`} value={formatCurrency(order.vat_eur)} muted />
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{formatCurrency(order.total_eur)}</span></div>
            </div>
          </div>

          <OrderShipping
            orderId={order.id}
            countryCode={(addr.country_code ?? order.country_code ?? 'NL')}
            canShip={!!addr.street_line1}
            sendcloudReady={sendcloudConfigured()}
            shipment={shipment ?? null}
          />

          <OrderNotes orderId={order.id} initialEvents={events ?? []} />
        </div>

        {/* Right: customer + address + payment */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-2">Customer</h2>
            <p className="text-sm text-gray-200">{customerName}</p>
            <p className="text-sm text-gray-400">{customerEmail}</p>
            {addr.phone && <p className="text-sm text-gray-400">{addr.phone}</p>}
            {order.user_id && <Link href={`/admin/customers/${order.user_id}`} className="text-xs text-saffron-400 hover:underline mt-1 inline-block">View customer →</Link>}
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-2">{order.delivery_type === 'click_and_collect' ? 'Pickup' : 'Delivery address'}</h2>
            {addr.street_line1 ? (
              <address className="text-sm text-gray-300 not-italic leading-relaxed">
                {addr.street_line1}{addr.street_line2 ? `, ${addr.street_line2}` : ''}<br />
                {addr.postal_code} {addr.city}<br />
                {addr.country_code}
              </address>
            ) : (
              <p className="text-sm text-gray-500">Click &amp; collect — no delivery address.</p>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <h2 className="font-semibold mb-2">Payment</h2>
            <p className="text-sm text-gray-300 capitalize">{(order.payment_method ?? 'unknown').replace(/_/g, ' ')}</p>
            {order.cash_received_eur != null && (
              <p className="text-xs text-gray-400 mt-1">Cash {formatCurrency(order.cash_received_eur)} · change {formatCurrency(order.change_due_eur ?? 0)}</p>
            )}
            {order.stripe_payment_intent_id && <p className="text-xs text-gray-500 mt-1 font-mono truncate">{order.stripe_payment_intent_id}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-gray-500' : 'text-gray-300'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}
