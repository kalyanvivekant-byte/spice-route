'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/vat'
import { AdminOrderActions } from '@/components/admin/AdminOrderActions'

type Order = {
  id: string
  order_number: string
  guest_email: string | null
  user_id: string | null
  items?: any[]
  total_eur: number
  status: string
  channel?: string
  created_at: string
  stripe_payment_intent_id: string | null
}

const BULK_STATUSES = ['picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled']

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const allChecked = orders.length > 0 && selected.size === orders.length
  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(orders.map((o) => o.id)))
  }

  async function bulkUpdate(status: string) {
    if (selected.size === 0) return
    if (!confirm(`Set ${selected.size} order(s) to "${status.replace(/_/g, ' ')}"?`)) return
    setBusy(true)
    let ok = 0
    for (const id of selected) {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status }),
      })
      if (res.ok) ok++
    }
    setBusy(false)
    setSelected(new Set())
    toast.success(`Updated ${ok} order(s)`)
    router.refresh()
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <span className="text-sm text-gray-300">{selected.size} selected</span>
          <span className="text-gray-500 text-xs">Mark as:</span>
          {BULK_STATUSES.map((s) => (
            <button key={s} onClick={() => bulkUpdate(s)} disabled={busy}
              className="px-2 py-1 text-xs bg-saffron-500 hover:bg-saffron-600 text-white rounded capitalize disabled:opacity-50">
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs">
            <th className="p-4 w-8"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
            <th className="text-left p-4">Order</th>
            <th className="text-left p-4">Customer</th>
            <th className="text-left p-4">Items</th>
            <th className="text-left p-4">Total</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Date</th>
            <th className="text-left p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {orders.length === 0 && (
            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No orders match.</td></tr>
          )}
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-800/50 transition">
              <td className="p-4"><input type="checkbox" checked={selected.has(order.id)} onChange={() => toggle(order.id)} /></td>
              <td className="p-4">
                <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-saffron-400 hover:underline">#{order.order_number}</Link>
                {order.channel === 'pos' && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">POS</span>}
              </td>
              <td className="p-4 text-gray-300 text-xs">{order.guest_email ?? (order.user_id ? order.user_id.slice(0, 8) + '…' : '—')}</td>
              <td className="p-4 text-gray-400 text-xs">{order.items?.length ?? 0} items</td>
              <td className="p-4 font-medium">{formatCurrency(order.total_eur)}</td>
              <td className="p-4"><span className="text-xs bg-gray-700 px-2 py-1 rounded capitalize">{order.status.replace(/_/g, ' ')}</span></td>
              <td className="p-4 text-gray-400 text-xs">{format(new Date(order.created_at), 'dd MMM HH:mm')}</td>
              <td className="p-4">
                <AdminOrderActions orderId={order.id} currentStatus={order.status} total={order.total_eur} paymentIntentId={order.stripe_payment_intent_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
