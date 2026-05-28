'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { DeliveryStep } from '@/components/checkout/DeliveryStep'
import { PaymentStep } from '@/components/checkout/PaymentStep'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { CheckCircle } from 'lucide-react'

type Step = 'delivery' | 'payment'

export default function CheckoutPage() {
  const { items } = useCart()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('delivery')
  const [deliveryData, setDeliveryData] = useState<any>(null)

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some items before checking out.</p>
        <a href="/products" className="text-saffron-600 hover:underline font-medium">Continue Shopping →</a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-8">
        {(['delivery', 'payment'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
              s === step ? 'bg-saffron-500 text-white' :
              (step === 'payment' && s === 'delivery') ? 'bg-green-500 text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {step === 'payment' && s === 'delivery' ? <CheckCircle className="h-5 w-5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium capitalize ${s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s}
            </span>
            {i < 1 && <div className="h-px w-12 bg-muted" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 'delivery' && (
            <DeliveryStep
              user={user}
              onComplete={(data) => {
                setDeliveryData(data)
                setStep('payment')
              }}
            />
          )}
          {step === 'payment' && deliveryData && (
            <PaymentStep
              user={user}
              deliveryData={deliveryData}
              onBack={() => setStep('delivery')}
            />
          )}
        </div>

        <div>
          <OrderSummary
            items={items}
            deliveryData={deliveryData}
          />
        </div>
      </div>
    </div>
  )
}
