'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Package, ExternalLink } from 'lucide-react'

type Result = {
  found: boolean
  orderId: string | null
  orderNumber: string | null
  orderStatus: string | null
  shipment: { carrier: string | null; method: string | null; trackingNumber: string | null; trackingUrl: string | null; status: string | null } | null
}

export default function TrackPage() {
  const [q, setQ] = useState('')
  const [result, setResult] = useState<Result | 'notfound' | null>(null)
  const [loading, setLoading] = useState(false)

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(q.trim())}`)
      if (res.status === 404) { setResult('notfound'); return }
      const data = await res.json()
      setResult(res.ok ? data : 'notfound')
    } catch {
      setResult('notfound')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-extrabold mb-1">Track your order</h1>
      <p className="text-muted-foreground text-sm mb-6">Enter your order number (e.g. SR-…) or carrier tracking number.</p>

      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SR-20260603-ABC123 or tracking #"
            className="w-full border border-saffron-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-saffron-500"
          />
        </div>
        <button disabled={loading} className="bg-gradient-spice text-white font-semibold px-5 rounded-lg hover:opacity-90 disabled:opacity-50">
          {loading ? '…' : 'Track'}
        </button>
      </form>

      {result === 'notfound' && (
        <div className="mt-8 text-center rounded-2xl border p-6">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-muted-foreground">We couldn’t find that order or tracking number. Double-check and try again.</p>
        </div>
      )}

      {result && result !== 'notfound' && result.found && (
        <div className="mt-8 space-y-4">
          {result.shipment?.trackingNumber ? (
            <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-5 w-5 text-saffron-600" />
                <span className="font-semibold">Shipped{result.shipment.carrier ? ` via ${result.shipment.carrier}` : ''}</span>
              </div>
              <p className="text-sm text-gray-600">
                Tracking: <span className="font-mono">{result.shipment.trackingNumber}</span>
                {result.shipment.status ? ` · ${result.shipment.status}` : ''}
              </p>
              {result.shipment.trackingUrl && (
                <a href={result.shipment.trackingUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-3 bg-gradient-spice text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
                  Track parcel <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-gray-700">
                {result.orderNumber ? <>Order <span className="font-mono">{result.orderNumber}</span> is </> : 'Your order is '}
                <span className="font-medium capitalize">{(result.orderStatus ?? 'being processed').replace(/_/g, ' ')}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">No carrier tracking yet — we’ll email you a link once it ships.</p>
            </div>
          )}

          {result.orderId && (
            <Link href={`/track/${result.orderId}`} className="block text-center text-sm text-saffron-600 hover:underline">
              See full order status →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
