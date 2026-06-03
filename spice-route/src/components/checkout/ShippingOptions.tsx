'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/vat'

type Method = { id: number; name: string; carrier: string; price: number | null }

// Informational: shows which carriers can deliver to the chosen country.
// (Delivery price is still set by your zone rules; this is for transparency.)
export function ShippingOptions({ country }: { country?: string }) {
  const [methods, setMethods] = useState<Method[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!country || country.length !== 2) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/shipping/rates?country=${country}&weight=1000`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.configured && Array.isArray(d.methods)) {
          // De-dupe by carrier for a clean summary.
          const seen = new Set<string>()
          const list: Method[] = []
          for (const m of d.methods) {
            if (seen.has(m.carrier)) continue
            seen.add(m.carrier); list.push(m)
          }
          setMethods(list.slice(0, 6))
        } else setMethods(null)
      })
      .catch(() => setMethods(null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [country])

  if (loading) return <p className="text-xs text-muted-foreground mt-2">Checking carriers…</p>
  if (!methods || methods.length === 0) return null

  return (
    <div className="mt-3 rounded-xl border border-saffron-100 bg-saffron-50/50 p-3">
      <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
        <Truck className="h-3.5 w-3.5 text-saffron-600" /> Carriers delivering to {country}
      </p>
      <ul className="flex flex-wrap gap-2">
        {methods.map((m) => (
          <li key={m.id} className="text-xs bg-white border border-saffron-100 rounded-full px-2.5 py-1 text-gray-600">
            {m.carrier}{m.price != null ? ` · from ${formatCurrency(m.price)}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
