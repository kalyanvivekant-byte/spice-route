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

export function AdminOrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const nextStatuses = STATUS_TRANSITIONS[currentStatus] ?? []

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

  if (nextStatuses.length === 0) return <span className="text-xs text-gray-500">–</span>

  return (
    <div className="flex gap-1">
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
    </div>
  )
}
