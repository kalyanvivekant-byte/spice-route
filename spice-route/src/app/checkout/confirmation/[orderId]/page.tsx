import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function ConfirmationPage({ params }: { params: { orderId: string } }) {
  const supabase = createAdminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', params.orderId)
    .single()

  if (!order || order.status === 'pending_payment') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link href="/" className="mt-4 inline-block text-saffron-600 hover:underline">Return home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-20 w-20 text-green-500" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Confirmed! 🎉</h1>
      <p className="text-muted-foreground mb-1">
        Thank you for your order. A confirmation email has been sent to you.
      </p>
      <p className="font-semibold text-lg mt-3">Order #{order.order_number}</p>

      <div className="bg-muted/30 rounded-2xl p-6 mt-8 text-left">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <ul className="divide-y">
          {order.items?.map((item: any) => (
            <li key={item.id} className="py-3 flex justify-between text-sm">
              <span>{item.product_name} – {item.variant_name} × {item.quantity}</span>
              <span className="font-medium">{formatCurrency(item.total_price_eur)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal_eur)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{formatCurrency(order.delivery_fee_eur)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatCurrency(order.vat_eur)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total_eur)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <Link href="/account/orders" className="px-6 py-3 border rounded-xl font-medium hover:bg-muted transition">
          View Orders
        </Link>
        <Link href="/" className="px-6 py-3 bg-saffron-500 text-white rounded-xl font-medium hover:bg-saffron-600 transition">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
