'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type Banner = {
  id: string
  title: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
}
type Row = Banner & { _saving?: boolean; _isNew?: boolean }

const inp = 'w-full bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'

const empty = (): Row => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  title: '', image_url: '', mobile_image_url: '', link_url: '', sort_order: 0, is_active: true, _isNew: true,
})

export function BannersManager({ banners }: { banners: Banner[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>(() => banners.map((b) => ({ ...b })))

  function patch(id: string, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function save(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.image_url.trim()) return toast.error('Image URL is required')
    patch(id, { _saving: true })
    const payload = {
      title: row.title || null,
      image_url: row.image_url.trim(),
      mobile_image_url: row.mobile_image_url || null,
      link_url: row.link_url || null,
      sort_order: Number(row.sort_order) || 0,
      is_active: row.is_active,
    }
    if (row._isNew) {
      const { data, error } = await supabase.from('banners').insert(payload).select().single()
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...(data as Banner) } : r)))
      toast.success('Banner added')
    } else {
      const { error } = await supabase.from('banners').update(payload).eq('id', id)
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      patch(id, { _saving: false })
      toast.success('Saved')
    }
  }

  async function remove(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (row._isNew) { setRows((prev) => prev.filter((r) => r.id !== id)); return }
    if (!confirm('Delete this banner?')) return
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Homepage Banners</h1>
          <p className="text-sm text-gray-500">Rotating banners shown near the top of the homepage. Paste image URLs (e.g. from Supabase Storage).</p>
        </div>
        <button onClick={() => setRows((p) => [empty(), ...p])} className="flex items-center gap-2 bg-gradient-spice text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-gray-400">No banners yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="bg-white border border-saffron-100 shadow-sm rounded-2xl p-4">
            <div className="flex gap-4">
              <div className="h-20 w-36 shrink-0 rounded-lg bg-saffron-50 overflow-hidden flex items-center justify-center text-gray-300 text-xs">
                {row.image_url ? <img src={row.image_url} alt="" className="h-full w-full object-cover" /> : 'preview'}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="text-xs text-gray-500">Desktop image URL</label>
                  <input className={inp} value={row.image_url} onChange={(e) => patch(row.id, { image_url: e.target.value })} />
                </div>
                <div className="sm:col-span-6">
                  <label className="text-xs text-gray-500">Mobile image URL (optional)</label>
                  <input className={inp} value={row.mobile_image_url ?? ''} onChange={(e) => patch(row.id, { mobile_image_url: e.target.value })} />
                </div>
                <div className="sm:col-span-5">
                  <label className="text-xs text-gray-500">Link URL (optional)</label>
                  <input className={inp} placeholder="/collections/bundles" value={row.link_url ?? ''} onChange={(e) => patch(row.id, { link_url: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs text-gray-500">Title / alt</label>
                  <input className={inp} value={row.title ?? ''} onChange={(e) => patch(row.id, { title: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs text-gray-500">Order</label>
                  <input type="number" className={inp} value={row.sort_order} onChange={(e) => patch(row.id, { sort_order: Number(e.target.value) })} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 justify-end pb-1">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600">
                    <input type="checkbox" checked={row.is_active} onChange={(e) => patch(row.id, { is_active: e.target.checked })} /> On
                  </label>
                  <button onClick={() => save(row.id)} disabled={row._saving} className="flex items-center gap-1.5 bg-gradient-spice text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                    <Save className="h-3.5 w-3.5" /> {row._saving ? '…' : 'Save'}
                  </button>
                  <button onClick={() => remove(row.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
