'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { formatCurrency, getVATRate } from '@/lib/vat'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  user: any
  deliveryData: any
  onBack: () => void
}

function CheckoutForm({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { clearCart } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  async function handleApplyPromo() {
    try {
      const res = await fetch('/api/checkout/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderId }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(`Promo applied! ${formatCurrency(data.discount)} off`)
        setPromoApplied(true)
      }
    } catch {
      toast.error('Failed to apply promo code')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation/${orderId}`,
      },
    })

    if (error) {
      toast.error(error.message ?? 'Payment failed')
      setIsLoading(false)
    } else {
      clearCart()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-saffron-500" />
          Secure Payment
        </h2>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {/* Promo code */}
      <div>
        <label className="text-sm font-medium block mb-2">Promo Code</label>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            disabled={promoApplied}
            className="flex-1 border rounded-lg px-3 py-2 text-sm disabled:opacity-60"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyPromo}
            disabled={!promoCode || promoApplied}
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Your payment is secured by Stripe with 256-bit SSL encryption.
        <br />
        Per EU Distance Selling Regulations you have a 14-day right to return.
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={isLoading || !stripe}>
          {isLoading ? 'Processing...' : 'Place Order'}
        </Button>
      </div>
    </form>
  )
}

export function PaymentStep({ user, deliveryData, onBack }: Props) {
  const { items, subtotal } = useCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const vatRate = getVATRate(deliveryData.countryCode)
  const sub = subtotal()

  useEffect(() => {
    async function createIntent() {
      try {
        const res = await fetch('/api/checkout/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            deliveryData,
            userId: user?.id ?? null,
          }),
        })
        const data = await res.json()
        if (data.error) setError(data.error)
        else {
          setClientSecret(data.clientSecret)
          setOrderId(data.orderId)
        }
      } catch {
        setError('Failed to initialise payment. Please try again.')
      }
    }
    createIntent()
  }, [])

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={onBack}>← Back to Delivery</Button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg skeleton" />
        ))}
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#f97316' },
        },
      }}
    >
      <CheckoutForm orderId={orderId!} onBack={onBack} />
    </Elements>
  )
}
