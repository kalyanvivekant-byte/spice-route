'use client'

import Image from 'next/image'
import { formatCurrency, getVATRate, calculateOrderTotals } from '@/lib/vat'
import type { CartItem } from '@/types'

interface Props {
  items: CartItem[]
  deliveryData?: any
}

export function OrderSummary({ items, deliveryData }: Props) {
  const countryCode = deliveryData?.countryCode ?? 'NL'
  const deliveryFee = deliveryData?.isExpress ? 9.99 : 4.99
  const totals = calculateOrderTotals(
    items.map((i) => ({ price: i.price, quantity: i.quantity })),
    deliveryFee,
    0,
    countryCode
  )
  const vatRate = getVATRate(countryCode)

  return (
    <div className="bg-muted/30 rounded-2xl p-5 sticky top-24">
      <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

      <ul className="divide-y mb-4">
        {items.map((item) => (
          <li key={item.variantId} className="py-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🌶️</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.variantName} × {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span>{totals.deliveryFee === 0 ? 'Free' : formatCurrency(totals.deliveryFee)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>–{formatCurrency(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>VAT ({(vatRate * 100).toFixed(1)}%)</span>
          <span>{formatCurrency(totals.vatAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground space-y-1">
        <p>🔒 Secure checkout powered by Stripe</p>
        <p>📦 14-day hassle-free returns</p>
        <p>🌶️ Allergens and VAT included</p>
      </div>
    </div>
  )
}
