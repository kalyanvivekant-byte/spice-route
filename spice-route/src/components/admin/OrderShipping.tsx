'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Truck, RefreshCw, Printer, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/vat'

type Shipment = {
  id: string
  carrier: string | null
  method_name: string | null
  tracking_number: string | null
  tracking_url: string | null
  label_url: string | null
  status: string | null
  weight_grams: number | null
}
type Method = { id: string; name: string; carrier: string; price: number | null }

export function OrderShipping({
  orderId, countryCode, canShip, sendcloudReady, shipment,
}: {
  orderId: string
  countryCode: string
  canShip: boolean
  sendcloudReady: boolean
  shipment: Shipment | null
}) {
  const router = useRouter()
  const [weight, setWeight] = useState('1000')
  const [methods, setMethods] = useState<Method[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadRates() {
    setLoading(true)
    try {
      const res = await fetch(`/api/shipping/rates?country=${countryCode}&weight=${weight}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Could not load rates'); return }
      if (!data.configured) { toast.error('Sendcloud not configured'); return }
      setMethods(data.methods)
      if (data.methods[0]) setSelected(data.methods[0].id)
      if (data.methods.length === 0) toast('No shipping methods for this destination/weight')
    } finally { setLoading(false) }
  }

  async function createShipment() {
    if (!selected) return toast.error('Choose a shipping method')
    setLoading(true)
    const method = methods?.find((m) => m.id === selected)
    const res = await fetch('/api/admin/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, shippingOptionCode: selected, methodName: method?.name, weightGrams: Number(weight) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return toast.error(data.error ?? 'Failed to create shipment')
    toast.success('Label created & customer emailed')
    router.refresh()
  }

  async function refresh() {
    if (!shipment) return
    setLoading(true)
    const res = await fetch('/api/admin/shipments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentId: shipment.id }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return toast.error(d.error ?? 'Refresh failed') }
    toast.success('Tracking refreshed')
    router.refresh()
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2"><Truck className="h-4 w-4 text-saffron-400" /> Shipping</h2>

      {shipment ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Carrier</span><span className="text-gray-200">{shipment.carrier ?? '—'} {shipment.method_name ? `· ${shipment.method_name}` : ''}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-gray-200">{shipment.status ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Tracking</span>
            {shipment.tracking_url ? (
              <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline inline-flex items-center gap-1">
                {shipment.tracking_number ?? 'Track'} <ExternalLink className="h-3 w-3" />
              </a>
            ) : <span className="text-gray-200">{shipment.tracking_number ?? '—'}</span>}
          </div>
          <div className="flex gap-2 pt-2">
            {shipment.label_url && (
              <a href={shipment.label_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs px-3 py-1.5 rounded">
                <Printer className="h-3.5 w-3.5" /> Print label
              </a>
            )}
            <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh status
            </button>
          </div>
        </div>
      ) : !canShip ? (
        <p className="text-sm text-gray-500">This is a click &amp; collect order — nothing to ship.</p>
      ) : !sendcloudReady ? (
        <p className="text-sm text-gray-500">Sendcloud isn’t configured yet. Add <code className="text-gray-300">SENDCLOUD_PUBLIC_KEY</code> and <code className="text-gray-300">SENDCLOUD_SECRET_KEY</code> to enable label printing.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="text-xs text-gray-400">Parcel weight (grams)</span>
              <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-100 focus:outline-none focus:border-saffron-500" />
            </label>
            <button onClick={loadRates} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded text-xs disabled:opacity-50">
              {loading ? '…' : 'Get rates'}
            </button>
          </div>

          {methods && methods.length > 0 && (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {methods.map((m) => (
                <label key={m.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded border cursor-pointer ${selected === m.id ? 'border-saffron-500 bg-saffron-500/10' : 'border-gray-800 hover:border-gray-700'}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" checked={selected === m.id} onChange={() => setSelected(m.id)} />
                    <span className="text-gray-200">{m.name}</span>
                  </span>
                  <span className="text-gray-400">{m.price != null ? formatCurrency(m.price) : ''}</span>
                </label>
              ))}
            </div>
          )}

          {methods && (
            <button onClick={createShipment} disabled={loading || !selected}
              className="w-full bg-gradient-spice text-white font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create shipment & buy label'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
