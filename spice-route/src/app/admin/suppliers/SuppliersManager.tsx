'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  lead_time_days: number | null
  notes: string | null
}

type Row = Supplier & { _saving?: boolean; _isNew?: boolean }

const empty = (): Row => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  lead_time_days: 7,
  notes: '',
  _isNew: true,
})

export function SuppliersManager({ suppliers }: { suppliers: Supplier[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>(() => suppliers.map((s) => ({ ...s })))

  function patch(id: string, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function save(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.name.trim()) return toast.error('Name is required')

    patch(id, { _saving: true })
    const payload = {
      name: row.name.trim(),
      contact_name: row.contact_name || null,
      email: row.email || null,
      phone: row.phone || null,
      address: row.address || null,
      lead_time_days: row.lead_time_days != null ? Number(row.lead_time_days) : 7,
      notes: row.notes || null,
    }

    if (row._isNew) {
      const { data, error } = await supabase.from('suppliers').insert(payload).select().single()
      if (error) {
        toast.error(error.message)
        patch(id, { _saving: false })
        return
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...(data as Supplier) } : r)))
      toast.success('Supplier added')
    } else {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', id)
      if (error) {
        toast.error(error.message)
        patch(id, { _saving: false })
        return
      }
      patch(id, { _saving: false })
      toast.success('Supplier saved')
    }
  }

  async function remove(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (row._isNew) {
      setRows((prev) => prev.filter((r) => r.id !== id))
      return
    }
    if (!confirm(`Delete supplier "${row.name}"?`)) return
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success('Supplier deleted')
  }

  const inputCls =
    'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-saffron-500'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Suppliers ({rows.filter((r) => !r._isNew).length})</h1>
        <button
          onClick={() => setRows((prev) => [empty(), ...prev])}
          className="flex items-center gap-1 text-sm bg-saffron-500 hover:bg-saffron-600 text-white px-3 py-1.5 rounded transition"
        >
          <Plus className="h-4 w-4" /> Add supplier
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Lead (days)</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-800/50 transition">
                <td className="p-3">
                  <input className={inputCls} value={r.name} placeholder="Name *"
                    onChange={(e) => patch(r.id, { name: e.target.value })} />
                </td>
                <td className="p-3">
                  <input className={inputCls} value={r.contact_name ?? ''}
                    onChange={(e) => patch(r.id, { contact_name: e.target.value })} />
                </td>
                <td className="p-3">
                  <input className={inputCls} value={r.email ?? ''} type="email"
                    onChange={(e) => patch(r.id, { email: e.target.value })} />
                </td>
                <td className="p-3">
                  <input className={inputCls} value={r.phone ?? ''}
                    onChange={(e) => patch(r.id, { phone: e.target.value })} />
                </td>
                <td className="p-3">
                  <input className={`${inputCls} w-20`} type="number" min={0} value={r.lead_time_days ?? ''}
                    onChange={(e) => patch(r.id, { lead_time_days: e.target.value === '' ? null : Number(e.target.value) })} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => save(r.id)} disabled={r._saving}
                      className="flex items-center gap-1 text-xs bg-saffron-500 hover:bg-saffron-600 disabled:opacity-30 text-white px-3 py-1.5 rounded transition">
                      <Save className="h-3 w-3" />{r._saving ? 'Saving…' : r._isNew ? 'Add' : 'Save'}
                    </button>
                    <button onClick={() => remove(r.id)}
                      className="text-gray-500 hover:text-red-400 transition" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-gray-500 text-sm">No suppliers yet. Click “Add supplier”.</p>}
      </div>
    </div>
  )
}
