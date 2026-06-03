'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { MessageSquare, Tag, Truck, RefreshCcw, CreditCard } from 'lucide-react'

type Event = { id: string; type: string; message: string; created_at: string }

const ICONS: Record<string, any> = {
  note: MessageSquare, status: Tag, fulfilment: Truck, refund: RefreshCcw, payment: CreditCard,
}

export function OrderNotes({ orderId, initialEvents }: { orderId: string; initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote() {
    if (!note.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/order-notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, message: note }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) return toast.error(data.error ?? 'Failed to add note')
    setEvents((prev) => [data.event, ...prev])
    setNote('')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="font-semibold mb-3">Timeline &amp; notes</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addNote() }}
          placeholder="Add an internal note…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saffron-500"
        />
        <button onClick={addNote} disabled={saving} className="bg-saffron-500 hover:bg-saffron-600 text-white text-sm px-4 rounded disabled:opacity-50">
          {saving ? '…' : 'Add'}
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const Icon = ICONS[e.type] ?? MessageSquare
            return (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-gray-200">{e.message}</p>
                  <p className="text-xs text-gray-500">{format(new Date(e.created_at), 'dd MMM HH:mm')}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
