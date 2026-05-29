'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Zone {
  id: string
  name: string
  country_code: string
  postal_prefix: string | null
  min_order_eur: number | null
  delivery_fee_eur: number | null
  free_delivery_above_eur: number | null
  express_fee_eur: number | null
  is_active: boolean
}

interface Slot {
  id: string
  date: string
  slot_label: string
  capacity: number
  booked: number
  is_express: boolean
  zone: { name: string } | null
}

type ZoneRow = Zone & { _saving?: boolean; _isNew?: boolean }

const emptyZone = (): ZoneRow => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  name: '',
  country_code: 'NL',
  postal_prefix: '',
  min_order_eur: 30,
  delivery_fee_eur: 4.99,
  free_delivery_above_eur: 50,
  express_fee_eur: 5,
  is_active: true,
  _isNew: true,
})

const num = (v: any, d: number) => (v === '' || v == null ? d : Number(v))

export function DeliveryManager({ zones, slots }: { zones: Zone[]; slots: Slot[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<ZoneRow[]>(() => zones.map((z) => ({ ...z })))
  const [slotRows, setSlotRows] = useState<Slot[]>(slots)
  const [slot, setSlot] = useState({
    date: '', slot_label: '', start_time: '08:00', end_time: '10:00',
    zone_id: zones[0]?.id ?? '', capacity: 20, is_express: false,
  })

  function patch(id: string, p: Partial<ZoneRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function saveZone(id: string) {
    const z = rows.find((r) => r.id === id)
    if (!z) return
    if (!z.name.trim()) return toast.error('Zone name is required')
    if (!z.country_code || z.country_code.length !== 2) return toast.error('Country code must be 2 letters')

    patch(id, { _saving: true })
    const payload = {
      name: z.name.trim(),
      country_code: z.country_code.toUpperCase(),
      postal_prefix: z.postal_prefix || null,
      min_order_eur: num(z.min_order_eur, 30),
      delivery_fee_eur: num(z.delivery_fee_eur, 4.99),
      free_delivery_above_eur: num(z.free_delivery_above_eur, 50),
      express_fee_eur: num(z.express_fee_eur, 5),
      is_active: z.is_active,
    }
    if (z._isNew) {
      const { data, error } = await supabase.from('delivery_zones').insert(payload).select().single()
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...(data as Zone) } : r)))
      toast.success('Zone added')
    } else {
      const { error } = await supabase.from('delivery_zones').update(payload).eq('id', id)
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      patch(id, { _saving: false })
      toast.success('Zone saved')
    }
  }

  async function removeZone(id: string) {
    const z = rows.find((r) => r.id === id)
    if (!z) return
    if (z._isNew) return setRows((prev) => prev.filter((r) => r.id !== id))
    if (!confirm(`Delete zone "${z.name}"? This also removes its slots.`)) return
    const { error } = await supabase.from('delivery_zones').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success('Zone deleted')
  }

  async function addSlot() {
    if (!slot.date) return toast.error('Pick a date')
    if (!slot.slot_label.trim()) return toast.error('Slot label is required')
    if (!slot.zone_id) return toast.error('Pick a zone')
    const { data, error } = await supabase.from('delivery_slots').insert({
      date: slot.date,
      slot_label: slot.slot_label.trim(),
      start_time: slot.start_time,
      end_time: slot.end_time,
      zone_id: slot.zone_id,
      capacity: Number(slot.capacity) || 20,
      is_express: slot.is_express,
    }).select('id, date, slot_label, capacity, booked, is_express, zone:delivery_zones(name)').single()
    if (error) return toast.error(error.message)
    setSlotRows((prev) => [...prev, data as any].sort((a, b) => a.date.localeCompare(b.date)))
    setSlot((s) => ({ ...s, slot_label: '' }))
    toast.success('Slot created')
  }

  async function removeSlot(id: string) {
    if (!confirm('Delete this slot?')) return
    const { error } = await supabase.from('delivery_slots').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setSlotRows((prev) => prev.filter((s) => s.id !== id))
    toast.success('Slot deleted')
  }

  const inp = 'bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-saffron-500'

  return (
    <div className="p-6 space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Delivery zones</h1>
          <button onClick={() => setRows((p) => [emptyZone(), ...p])}
            className="flex items-center gap-1 text-sm bg-saffron-500 hover:bg-saffron-600 text-white px-3 py-1.5 rounded transition">
            <Plus className="h-4 w-4" /> Add zone
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Country</th>
                <th className="text-left p-3">Postal prefix</th>
                <th className="text-left p-3">Min order</th>
                <th className="text-left p-3">Fee</th>
                <th className="text-left p-3">Free above</th>
                <th className="text-left p-3">Active</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((z) => (
                <tr key={z.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-3"><input className={`${inp} w-32`} value={z.name} placeholder="Name *"
                    onChange={(e) => patch(z.id, { name: e.target.value })} /></td>
                  <td className="p-3"><input className={`${inp} w-14`} maxLength={2} value={z.country_code}
                    onChange={(e) => patch(z.id, { country_code: e.target.value })} /></td>
                  <td className="p-3"><input className={`${inp} w-20`} value={z.postal_prefix ?? ''}
                    onChange={(e) => patch(z.id, { postal_prefix: e.target.value })} /></td>
                  <td className="p-3"><input className={`${inp} w-20`} type="number" step="0.01" value={z.min_order_eur ?? ''}
                    onChange={(e) => patch(z.id, { min_order_eur: e.target.value as any })} /></td>
                  <td className="p-3"><input className={`${inp} w-20`} type="number" step="0.01" value={z.delivery_fee_eur ?? ''}
                    onChange={(e) => patch(z.id, { delivery_fee_eur: e.target.value as any })} /></td>
                  <td className="p-3"><input className={`${inp} w-20`} type="number" step="0.01" value={z.free_delivery_above_eur ?? ''}
                    onChange={(e) => patch(z.id, { free_delivery_above_eur: e.target.value as any })} /></td>
                  <td className="p-3 text-center"><input type="checkbox" checked={z.is_active}
                    onChange={(e) => patch(z.id, { is_active: e.target.checked })} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveZone(z.id)} disabled={z._saving}
                        className="flex items-center gap-1 text-xs bg-saffron-500 hover:bg-saffron-600 disabled:opacity-30 text-white px-3 py-1.5 rounded transition">
                        <Save className="h-3 w-3" />{z._saving ? 'Saving…' : z._isNew ? 'Add' : 'Save'}
                      </button>
                      <button onClick={() => removeZone(z.id)} className="text-gray-500 hover:text-red-400 transition" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-gray-500 text-sm">No zones yet. Click “Add zone”.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Delivery slots</h2>
        <div className="bg-gray-900 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-400">Date<br />
            <input type="date" className={inp} value={slot.date} onChange={(e) => setSlot({ ...slot, date: e.target.value })} /></label>
          <label className="text-xs text-gray-400">Label<br />
            <input className={inp} placeholder="Morning (8–10)" value={slot.slot_label} onChange={(e) => setSlot({ ...slot, slot_label: e.target.value })} /></label>
          <label className="text-xs text-gray-400">Start<br />
            <input type="time" className={inp} value={slot.start_time} onChange={(e) => setSlot({ ...slot, start_time: e.target.value })} /></label>
          <label className="text-xs text-gray-400">End<br />
            <input type="time" className={inp} value={slot.end_time} onChange={(e) => setSlot({ ...slot, end_time: e.target.value })} /></label>
          <label className="text-xs text-gray-400">Zone<br />
            <select className={inp} value={slot.zone_id} onChange={(e) => setSlot({ ...slot, zone_id: e.target.value })}>
              {rows.filter((z) => !z._isNew).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select></label>
          <label className="text-xs text-gray-400">Capacity<br />
            <input type="number" min={1} className={`${inp} w-20`} value={slot.capacity} onChange={(e) => setSlot({ ...slot, capacity: Number(e.target.value) })} /></label>
          <label className="text-xs text-gray-400 flex items-center gap-1 pb-1">
            <input type="checkbox" checked={slot.is_express} onChange={(e) => setSlot({ ...slot, is_express: e.target.checked })} /> Express</label>
          <button onClick={addSlot} className="flex items-center gap-1 text-sm bg-saffron-500 hover:bg-saffron-600 text-white px-3 py-2 rounded transition">
            <Plus className="h-4 w-4" /> Add slot
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Slot</th>
                <th className="text-left p-3">Zone</th>
                <th className="text-left p-3">Booked / Capacity</th>
                <th className="text-left p-3">Express</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {slotRows.map((s) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-3 text-white">{s.date}</td>
                  <td className="p-3 text-gray-400">{s.slot_label}</td>
                  <td className="p-3 text-gray-400">{s.zone?.name ?? '–'}</td>
                  <td className="p-3 text-gray-400">{s.booked} / {s.capacity}</td>
                  <td className="p-3 text-gray-400">{s.is_express ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <button onClick={() => removeSlot(s.id)} className="text-gray-500 hover:text-red-400 transition" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {slotRows.length === 0 && <p className="p-6 text-gray-500 text-sm">No upcoming slots.</p>}
        </div>
      </section>
    </div>
  )
}
