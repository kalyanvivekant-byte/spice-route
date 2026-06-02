'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, Trash2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

type Promo = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_eur: number | null
  max_uses: number | null
  uses_count: number
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
}
type Row = Promo & { _saving?: boolean; _isNew?: boolean }

const inp = 'w-full bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'

function toDateInput(iso: string | null) { return iso ? iso.slice(0, 10) : '' }
function fromDateInput(d: string, endOfDay = false) {
  if (!d) return null
  return new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString()
}

const empty = (): Row => {
  const inYear = new Date(); inYear.setFullYear(inYear.getFullYear() + 1)
  return {
    id: `new-${Math.random().toString(36).slice(2)}`,
    code: '', description: '', discount_type: 'percentage', discount_value: 10,
    min_order_eur: 0, max_uses: null, uses_count: 0,
    valid_from: new Date().toISOString(), valid_until: inYear.toISOString(),
    is_active: true, _isNew: true,
  }
}

export function DiscountsManager({ promos }: { promos: Promo[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>(() => promos.map((p) => ({ ...p })))

  function patch(id: string, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function save(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.code.trim()) return toast.error('Code is required')
    if (!row.valid_until) return toast.error('Set an expiry date (codes require one to validate at checkout)')

    patch(id, { _saving: true })
    const payload = {
      code: row.code.trim().toUpperCase(),
      description: row.description || null,
      discount_type: row.discount_type,
      discount_value: Number(row.discount_value) || 0,
      min_order_eur: row.min_order_eur != null ? Number(row.min_order_eur) : 0,
      max_uses: row.max_uses != null && String(row.max_uses) !== '' ? Number(row.max_uses) : null,
      valid_from: row.valid_from,
      valid_until: row.valid_until,
      is_active: row.is_active,
    }

    if (row._isNew) {
      const { data, error } = await supabase.from('promo_codes').insert(payload).select().single()
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...(data as Promo) } : r)))
      toast.success('Promo code created')
    } else {
      const { error } = await supabase.from('promo_codes').update(payload).eq('id', id)
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      patch(id, { _saving: false, code: payload.code })
      toast.success('Saved')
    }
  }

  async function remove(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (row._isNew) { setRows((prev) => prev.filter((r) => r.id !== id)); return }
    if (!confirm(`Delete promo code "${row.code}"?`)) return
    const { error } = await supabase.from('promo_codes').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Tag className="h-6 w-6 text-saffron-600" /> Discounts</h1>
          <p className="text-sm text-gray-500">Promo codes customers enter at checkout. Percentage or fixed amount off, with optional minimum order, usage cap, and expiry.</p>
        </div>
        <button onClick={() => setRows((p) => [empty(), ...p])} className="flex items-center gap-2 bg-gradient-spice text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> New code
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-gray-400">No promo codes yet.</p>}
        {rows.map((row) => {
          const expired = row.valid_until ? new Date(row.valid_until) < new Date() : false
          const used = row.max_uses != null && row.uses_count >= row.max_uses
          return (
            <div key={row.id} className="bg-white border border-saffron-100 shadow-sm rounded-2xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="text-xs text-gray-500">Code</label>
                  <input className={`${inp} font-mono uppercase`} value={row.code} onChange={(e) => patch(row.id, { code: e.target.value })} placeholder="DIWALI10" />
                </div>
                <div className="sm:col-span-5">
                  <label className="text-xs text-gray-500">Description</label>
                  <input className={inp} value={row.description ?? ''} onChange={(e) => patch(row.id, { description: e.target.value })} placeholder="10% off Diwali sale" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Type</label>
                  <select className={inp} value={row.discount_type} onChange={(e) => patch(row.id, { discount_type: e.target.value as any })}>
                    <option value="percentage">% off</option>
                    <option value="fixed">€ off</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">{row.discount_type === 'percentage' ? 'Percent' : 'Amount €'}</label>
                  <input type="number" className={inp} value={row.discount_value} onChange={(e) => patch(row.id, { discount_value: Number(e.target.value) })} />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Min order €</label>
                  <input type="number" className={inp} value={row.min_order_eur ?? 0} onChange={(e) => patch(row.id, { min_order_eur: Number(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Max uses</label>
                  <input type="number" className={inp} placeholder="∞" value={row.max_uses ?? ''} onChange={(e) => patch(row.id, { max_uses: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Starts</label>
                  <input type="date" className={inp} value={toDateInput(row.valid_from)} onChange={(e) => patch(row.id, { valid_from: fromDateInput(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Expires</label>
                  <input type="date" className={inp} value={toDateInput(row.valid_until)} onChange={(e) => patch(row.id, { valid_until: fromDateInput(e.target.value, true) })} />
                </div>
                <div className="sm:col-span-4 flex items-center gap-3 justify-end pb-1">
                  <span className="text-xs text-gray-400">{row.uses_count} used</span>
                  {expired && <span className="text-xs font-medium text-red-500">expired</span>}
                  {used && <span className="text-xs font-medium text-amber-600">cap reached</span>}
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={row.is_active} onChange={(e) => patch(row.id, { is_active: e.target.checked })} /> Active
                  </label>
                  <button onClick={() => save(row.id)} disabled={row._saving} className="flex items-center gap-1.5 bg-gradient-spice text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                    <Save className="h-3.5 w-3.5" /> {row._saving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => remove(row.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
