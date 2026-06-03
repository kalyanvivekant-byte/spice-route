import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'
import { PrintTrigger } from '@/components/admin/PrintTrigger'

export const dynamic = 'force-dynamic'

export default async function OrderPrintPage({
  params, searchParams,
}: {
  params: { id: string }
  searchParams: { doc?: string }
}) {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', params.id)
    .single()
  if (!order) notFound()

  const isInvoice = searchParams.doc !== 'packing' // default = invoice
  const addr = order.delivery_address ?? {}
  const name = `${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim() || 'Customer'

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white text-black p-8 print:p-0 print:static">
      {/* Toolbar (hidden when printing) */}
      <div className="print:hidden flex items-center gap-3 mb-6 max-w-2xl mx-auto">
        <Link href={`/admin/orders/${order.id}`} className="text-sm text-saffron-600 hover:underline">← Back to order</Link>
        <Link href={`/admin/orders/${order.id}/print?doc=invoice`} className={`text-sm px-2 py-1 rounded ${isInvoice ? 'bg-saffron-100 text-saffron-700' : 'text-gray-500'}`}>Invoice</Link>
        <Link href={`/admin/orders/${order.id}/print?doc=packing`} className={`text-sm px-2 py-1 rounded ${!isInvoice ? 'bg-saffron-100 text-saffron-700' : 'text-gray-500'}`}>Packing slip</Link>
        <div className="ml-auto"><PrintTrigger /></div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
          <div>
            <div className="text-xl font-extrabold">🌶️ Spice Route</div>
            <div className="text-xs text-gray-500">Indian Groceries · Europe</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{isInvoice ? 'Invoice' : 'Packing Slip'}</div>
            <div className="text-sm font-mono">#{order.order_number}</div>
            <div className="text-xs text-gray-500">{format(new Date(order.created_at), 'dd MMM yyyy')}</div>
          </div>
        </div>

        {/* Ship to */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Ship to</div>
            <div className="font-medium">{name}</div>
            {addr.street_line1 ? (
              <div className="text-gray-600">
                {addr.street_line1}{addr.street_line2 ? `, ${addr.street_line2}` : ''}<br />
                {addr.postal_code} {addr.city}<br />{addr.country_code}
              </div>
            ) : <div className="text-gray-500">Click &amp; collect</div>}
            {addr.phone && <div className="text-gray-600">{addr.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Order</div>
            <div className="text-gray-600 capitalize">Status: {order.status.replace(/_/g, ' ')}</div>
            <div className="text-gray-600">{order.channel === 'pos' ? 'In-store (POS)' : 'Online'}</div>
            {isInvoice && <div className="text-gray-600 capitalize">Payment: {(order.payment_method ?? '—').replace(/_/g, ' ')}</div>}
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm border-t border-gray-200">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2">Item</th>
              <th className="py-2 text-center w-16">Qty</th>
              {isInvoice && <th className="py-2 text-right w-24">Price</th>}
              {isInvoice && <th className="py-2 text-right w-24">Total</th>}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it: any) => (
              <tr key={it.id} className="border-b border-gray-100">
                <td className="py-2">{it.product_name} <span className="text-gray-500">· {it.variant_name}</span></td>
                <td className="py-2 text-center">{it.quantity}</td>
                {isInvoice && <td className="py-2 text-right">{formatCurrency(it.unit_price_eur)}</td>}
                {isInvoice && <td className="py-2 text-right">{formatCurrency(it.total_price_eur)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals (invoice only) */}
        {isInvoice && (
          <div className="flex justify-end mt-4">
            <div className="w-56 text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal_eur)}</span></div>
              {order.discount_eur > 0 && <div className="flex justify-between text-gray-600"><span>Discount</span><span>−{formatCurrency(order.discount_eur)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatCurrency(order.delivery_fee_eur)}</span></div>
              <div className="flex justify-between text-gray-500 text-xs"><span>VAT (incl.)</span><span>{formatCurrency(order.vat_eur)}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1"><span>Total</span><span>{formatCurrency(order.total_eur)}</span></div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">Thank you for shopping with Spice Route 🌶️</p>
      </div>
    </div>
  )
}
