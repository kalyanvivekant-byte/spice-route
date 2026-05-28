import { VAT_RATES } from '@/types'

export function getVATRate(countryCode: string): number {
  const rate = VAT_RATES.find((r) => r.country_code === countryCode)
  return rate?.food_rate ?? 0.09 // default Netherlands
}

export function calculateVAT(subtotal: number, countryCode: string): number {
  const rate = getVATRate(countryCode)
  // Subtotal is VAT-inclusive; extract VAT portion
  return subtotal - subtotal / (1 + rate)
}

export function calculateOrderTotals(
  items: { price: number; quantity: number }[],
  deliveryFee: number,
  discount: number,
  countryCode: string
) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountedSubtotal = Math.max(0, subtotal - discount)
  const vatRate = getVATRate(countryCode)
  const vatAmount = (discountedSubtotal + deliveryFee) * vatRate / (1 + vatRate)
  const total = discountedSubtotal + deliveryFee

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    vatRate,
    total: Math.round(total * 100) / 100,
  }
}

export function formatCurrency(amount: number, currency = 'EUR', locale = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
