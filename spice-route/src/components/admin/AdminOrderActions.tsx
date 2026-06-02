'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  received: ['picking'],
  picking: ['packed'],
  packed: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

export function AdminOrderActions({
  orderId, currentStatus, total, paymentIntentId,
}: {
  orderId: string
  currentStatus: string
  total?: number
  paymentIntentId?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const nextStatuses = STATUS_TRANSITIONS[currentStatus] ?? []
  const canRefund = !!paymentIntentId && !['refunded', 'cancelled', 'pending_payment'].includes(currentStatus)

  async function updateStatus(status: string) {
    setLoading(true)
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    const data = await res.json()
    if (data.error) toast.error(data.error)
    else {
      toast.success(`Order updated to ${status.replace(/_/g, ' ')}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function refund() {
    const fullStr = total != null ? total.toFixed(2) : ''
    const input = window.prompt(
      `Refund amount in € (max ${fullStr || '—'}). Leave as the full amount for a complete refund:`,
      fullStr
    )
    if (input === null) return
    const amount = parseFloat(input)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    if (!confirm(`Refund €${amount.toFixed(2)} to the customer? This cannot be undone.`)) return

    setLoading(true)
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, refundAmount: amount }),
    })
    const data = await res.json()
    if (data.error) toast.error(data.error)
    else {
      toast.success(`Refunded €${amount.toFixed(2)}`)
      router.refresh()
    }
    setLoading(false)
  }

  if (nextStatuses.length === 0 && !canRefund) return <span className="text-xs text-gray-500">–</span>

  return (
    <div className="flex flex-wrap gap-1">
      {nextStatuses.map((status) => (
        <button
          key={status}
          onClick={() => updateStatus(status)}
          disabled={loading}
          className="px-2 py-1 text-xs bg-saffron-500 hover:bg-saffron-600 text-white rounded transition capitalize disabled:opacity-50"
        >
          → {status.replace(/_/g, ' ')}
        </button>
      ))}
      {canRefund && (
        <button
          onClick={refund}
          disabled={loading}
          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition disabled:opacity-50"
        >
          Refund
        </button>
      )}
    </div>
  )
}
