'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Save, Trash2, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

type Collection = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  type: string
  sort_order: number
  is_active: boolean
  show_on_home: boolean
  _count?: number
}
type Row = Collection & { _saving?: boolean; _isNew?: boolean; _open?: boolean }

const TYPES = [
  { value: 'manual', label: 'Manual (pick products)' },
  { value: 'bestsellers', label: 'Bestsellers (auto)' },
  { value: 'new_arrivals', label: 'New Arrivals (auto)' },
  { value: 'on_sale', label: 'On Sale (auto)' },
  { value: 'featured', label: 'Featured (auto)' },
]

const inp = 'w-full bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const empty = (): Row => ({
  id: `new-${Math.random().toString(36).slice(2)}`,
  title: '', slug: '', subtitle: '', type: 'manual', sort_order: 0,
  is_active: true, show_on_home: false, _isNew: true,
})

export function CollectionsManager({ collections }: { collections: Collection[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>(() => collections.map((c) => ({ ...c })))

  function patch(id: string, p: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }

  async function save(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.title.trim()) return toast.error('Title is required')
    const slug = row.slug.trim() || slugify(row.title)

    patch(id, { _saving: true })
    const payload = {
      title: row.title.trim(),
      slug,
      subtitle: row.subtitle || null,
      type: row.type,
      sort_order: Number(row.sort_order) || 0,
      is_active: row.is_active,
      show_on_home: row.show_on_home,
    }

    if (row._isNew) {
      const { data, error } = await supabase.from('collections').insert(payload).select().single()
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...(data as Collection), _count: 0 } : r)))
      toast.success('Collection added')
    } else {
      const { error } = await supabase.from('collections').update(payload).eq('id', id)
      if (error) { toast.error(error.message); patch(id, { _saving: false }); return }
      patch(id, { _saving: false, slug })
      toast.success('Saved')
    }
  }

  async function remove(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (row._isNew) { setRows((prev) => prev.filter((r) => r.id !== id)); return }
    if (!confirm(`Delete collection "${row.title}"?`)) return
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) return toast.error(error.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Collections</h1>
          <p className="text-sm text-gray-500">Curate storefront rows. Auto types update themselves; “Manual” lets you pick products.</p>
        </div>
        <button
          onClick={() => setRows((p) => [empty(), ...p])}
          className="flex items-center gap-2 bg-gradient-spice text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-gray-400">No collections yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="bg-white border border-saffron-100 shadow-sm rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500">Title</label>
                <input className={inp} value={row.title} onChange={(e) => patch(row.id, { title: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500">Slug</label>
                <input className={inp} placeholder={slugify(row.title || '')} value={row.slug} onChange={(e) => patch(row.id, { slug: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500">Type</label>
                <select className={inp} value={row.type} onChange={(e) => patch(row.id, { type: e.target.value })}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-500">Order</label>
                <input type="number" className={inp} value={row.sort_order} onChange={(e) => patch(row.id, { sort_order: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button onClick={() => save(row.id)} disabled={row._saving} className="flex items-center gap-1.5 bg-gradient-spice text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                  <Save className="h-3.5 w-3.5" /> {row._saving ? '…' : 'Save'}
                </button>
                <button onClick={() => remove(row.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>

              <div className="sm:col-span-6">
                <label className="text-xs text-gray-500">Subtitle</label>
                <input className={inp} value={row.subtitle ?? ''} onChange={(e) => patch(row.id, { subtitle: e.target.value })} />
              </div>
              <div className="sm:col-span-6 flex items-center gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={row.is_active} onChange={(e) => patch(row.id, { is_active: e.target.checked })} /> Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={row.show_on_home} onChange={(e) => patch(row.id, { show_on_home: e.target.checked })} /> Show on homepage
                </label>
              </div>
            </div>

            {row.type === 'manual' && !row._isNew && (
              <div className="mt-3 border-t border-saffron-100 pt-3">
                <button onClick={() => patch(row.id, { _open: !row._open })} className="flex items-center gap-1.5 text-sm font-medium text-saffron-700">
                  {row._open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Manage products {row._count ? `(${row._count})` : ''}
                </button>
                {row._open && <ProductPicker collectionId={row.id} onCountChange={(n) => patch(row.id, { _count: n })} />}
              </div>
            )}
            {row.type === 'manual' && row._isNew && (
              <p className="mt-2 text-xs text-gray-400">Save first, then you can add products.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Manual-collection product picker ─────────────────────────
function ProductPicker({ collectionId, onCountChange }: { collectionId: string; onCountChange: (n: number) => void }) {
  const supabase = createClient()
  const [items, setItems] = useState<{ product_id: string; name: string; image: string | null }[] | null>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('collection_products')
      .select('product_id, sort_order, product:products(name, images:product_images(url, is_primary))')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true })
    const mapped = (data ?? []).map((r: any) => ({
      product_id: r.product_id,
      name: r.product?.name ?? '',
      image: r.product?.images?.find((i: any) => i.is_primary)?.url ?? r.product?.images?.[0]?.url ?? null,
    }))
    setItems(mapped)
    onCountChange(mapped.length)
  }

  if (items === null) { load(); return <p className="mt-2 text-xs text-gray-400">Loading…</p> }

  async function search(term: string) {
    setQ(term)
    if (term.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=8`)
      setResults(res.ok ? await res.json() : [])
    } finally { setSearching(false) }
  }

  async function add(p: any) {
    if (items!.some((i) => i.product_id === p.id)) return
    const { error } = await supabase.from('collection_products').insert({
      collection_id: collectionId, product_id: p.id, sort_order: items!.length,
    })
    if (error) return toast.error(error.message)
    const next = [...items!, { product_id: p.id, name: p.name, image: p.image_url ?? null }]
    setItems(next); onCountChange(next.length)
    setQ(''); setResults([])
  }

  async function removeItem(productId: string) {
    const { error } = await supabase.from('collection_products').delete()
      .eq('collection_id', collectionId).eq('product_id', productId)
    if (error) return toast.error(error.message)
    const next = items!.filter((i) => i.product_id !== productId)
    setItems(next); onCountChange(next.length)
  }

  return (
    <div className="mt-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={q} onChange={(e) => search(e.target.value)} placeholder="Search products to add…"
          className="w-full bg-white border border-saffron-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-saffron-500" />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-saffron-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((p) => (
              <button key={p.id} onClick={() => add(p)} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-saffron-50 text-sm">
                <span className="h-8 w-8 rounded bg-saffron-50 overflow-hidden flex items-center justify-center text-xs shrink-0">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : '🛒'}
                </span>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-xs text-gray-400">No products yet.</p>}
        {items.map((i) => (
          <span key={i.product_id} className="flex items-center gap-2 bg-saffron-50 border border-saffron-200 rounded-full pl-1 pr-2 py-1 text-xs">
            <span className="h-6 w-6 rounded-full bg-white overflow-hidden flex items-center justify-center">
              {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : '🛒'}
            </span>
            <span className="max-w-[160px] truncate">{i.name}</span>
            <button onClick={() => removeItem(i.product_id)} className="text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
    </div>
  )
}
