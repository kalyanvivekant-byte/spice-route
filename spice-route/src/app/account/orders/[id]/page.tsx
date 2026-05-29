import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/account/orders/${params.id}`)

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(product_name, quantity, unit_price_eur, image_url)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) notFound()

  const addr = order.delivery_address as any

  return (
    <div>
      <Link href="/account/orders" className="text-saffron-600 hover:underline text-sm">
        ← All orders
      </Link>
      <div className="flex items-center justify-between mt-3 mb-6">
        <h1 className="text-2xl font-bold">#{order.order_number}</h1>
        <span className="text-sm text-muted-foreground">
          {format(new Date(order.created_at), 'dd MMM yyyy')}
        </span>
      </div>

      <div className="border rounded-2xl divide-y">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">{item.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unit_price_eur)}
              </p>
            </div>
            <span className="font-medium text-sm">
              {formatCurrency(item.quantity * item.unit_price_eur)}
            </span>
          </div>
        ))}
      </div>

      <div className="max-w-xs ml-auto mt-6 space-y-1 text-sm">
        <Row label="Subtotal" value={formatCurrency(order.subtotal_eur)} />
        <Row label="Delivery" value={formatCurrency(order.delivery_fee_eur)} />
        {order.discount_eur > 0 && <Row label="Discount" value={`–${formatCurrency(order.discount_eur)}`} />}
        <Row label="VAT" value={formatCurrency(order.vat_eur)} />
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Total</span>
          <span>{formatCurrency(order.total_eur)}</span>
        </div>
      </div>

      {addr && (
        <div className="mt-8">
          <h2 className="font-semibold mb-2 text-sm">Delivery address</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {addr.first_name} {addr.last_name}<br />
            {addr.street_line1}{addr.street_line2 ? `, ${addr.street_line2}` : ''}<br />
            {addr.postal_code} {addr.city}, {addr.country_code}
          </p>
        </div>
      )}

      {order.status === 'out_for_delivery' && (
        <Link
          href={`/track/${order.id}`}
          className="mt-6 inline-block text-blue-600 hover:underline text-sm font-medium"
        >
          Track live →
        </Link>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
