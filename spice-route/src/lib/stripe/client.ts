import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PAYMENT_METHODS = [
  'card',
  'ideal',
  'sepa_debit',
  'bancontact',
  'link',
] as const

export function getStripePaymentMethods(countryCode: string): string[] {
  const base = ['card', 'link']
  switch (countryCode) {
    case 'NL':
      return [...base, 'ideal', 'sepa_debit']
    case 'BE':
      return [...base, 'bancontact', 'sepa_debit']
    case 'DE':
    case 'FR':
    case 'ES':
    case 'IT':
      return [...base, 'sepa_debit']
    default:
      return base
  }
}
