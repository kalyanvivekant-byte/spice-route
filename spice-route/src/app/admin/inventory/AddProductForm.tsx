'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Search, ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { GROCERY_ITEMS } from '@/data/indian-grocery-items'

interface Category {
  id: string
  name: string
}

interface PhotoResult {
  url: string
  label: string
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function AddProductForm({ categories }: { categories: Category[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // searchable name picker
  const [query, setQuery] = useState('')
  const [showList, setShowList] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // photo lookup
  const [photos, setPhotos] = useState<PhotoResult[]>([])
  const [photoLoading, setPhotoLoading] = useState(false)

  const [f, setF] = useState({
    name: '', brand: '', category_id: '', variant_name: '1 unit', sku: '',
    price: '', quantity: '0', threshold: '10', image_url: '', is_active: true, is_bundle: false,
  })

  function set(k: keyof typeof f, v: any) {
    setF((prev) => ({ ...prev, [k]: v }))
  }

  function reset() {
    setF({ name: '', brand: '', category_id: '', variant_name: '1 unit', sku: '', price: '', quantity: '0', threshold: '10', image_url: '', is_active: true, is_bundle: false })
    setQuery('')
    setPhotos([])
  }

  // close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowList(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GROCERY_ITEMS.slice(0, 30)
    return GROCERY_ITEMS.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    ).slice(0, 40)
  }, [query])

  function pick(item: (typeof GROCERY_ITEMS)[number]) {
    set('name', item.name)
    if (item.brand) set('brand', item.brand)
    // try to match the suggested category to one of the store's categories
    const match = categories.find((c) => c.name.toLowerCase().includes(item.category.toLowerCase().split(' ')[0]))
    if (match) set('category_id', match.id)
    setQuery(item.name)
    setShowList(false)
  }

  async function findPhotos() {
    const term = (f.name || query).trim()
    if (!term) return toast.error('Enter or pick a product name first')
    setPhotoLoading(true)
    setPhotos([])
    try {
      const searchTerm = f.brand ? `${f.brand} ${term}` : term
      const url =
        'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=12' +
        '&fields=product_name,brands,image_front_small_url,image_small_url' +
        '&search_terms=' + encodeURIComponent(searchTerm)
      const res = await fetch(url)
      const data = await res.json()
      const results: PhotoResult[] = (data.products ?? [])
        .map((p: any) => ({
          url: p.image_front_small_url || p.image_small_url || '',
          label: [p.brands, p.product_name].filter(Boolean).join(' · '),
        }))
        .filter((p: PhotoResult) => p.url)
      if (results.length === 0) toast('No photos found — try a simpler name or paste a URL', { icon: '🔍' })
      setPhotos(results.slice(0, 8))
    } catch {
      toast.error('Photo lookup failed — you can paste an image URL instead')
    } finally {
      setPhotoLoading(false)
    }
  }

  async function submit() {
    if (!f.name.trim()) return toast.error('Product name is required')
    const price = Number(f.price)
    if (f.price === '' || Number.isNaN(price) || price < 0) return toast.error('Enter a valid price')
    const sku = f.sku.trim() || `${slugify(f.name).slice(0, 20)}-${Math.random().toString(36).slice(2, 6)}`
    const quantity = parseInt(f.quantity, 10) || 0
    const threshold = parseInt(f.threshold, 10) || 10

    setSaving(true)

    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({
        name: f.name.trim(),
        slug: `${slugify(f.name)}-${Math.random().toString(36).slice(2, 6)}`,
        brand: f.brand || null,
        category_id: f.category_id || null,
        is_active: f.is_active,
        is_bundle: f.is_bundle,
      })
      .select('id').single()
    if (pErr || !product) { toast.error(pErr?.message ?? 'Failed to create product'); setSaving(false); return }

    const { data: variant, error: vErr } = await supabase
      .from('product_variants')
      .insert({ product_id: product.id, name: f.variant_name.trim() || 'Default', sku, price_eur: price, is_active: true })
      .select('id').single()
    if (vErr || !variant) {
      toast.error(vErr?.message ?? 'Failed to create variant')
      await supabase.from('products').delete().eq('id', product.id)
      setSaving(false); return
    }

    const { error: iErr } = await supabase
      .from('inventory')
      .insert({ variant_id: variant.id, quantity, low_stock_threshold: threshold })
    if (iErr) { toast.error(`Product created, but stock row failed: ${iErr.message}`); setSaving(false); return }

    if (f.image_url.trim()) {
      await supabase.from('product_images').insert({ product_id: product.id, url: f.image_url.trim(), is_primary: true })
    }

    toast.success(`${f.name} created`)
    reset()
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const inp = 'w-full bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'

  if (!open) {
    return (
      <div className="mb-6">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-sm bg-gradient-spice hover:opacity-90 text-white px-4 py-2 rounded-lg transition">
          <Plus className="h-4 w-4" /> Add new product
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-white border border-saffron-100 shadow-sm rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">New product</h2>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 transition"><X className="h-5 w-5" /></button>
      </div>

      {/* Searchable name picker */}
      <div ref={pickerRef} className="relative mb-4">
        <label className="text-xs text-gray-500">Product name * <span className="text-gray-400">— search the Indian grocery list or type your own</span></label>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className={`${inp} pl-8`}
            value={query}
            placeholder="e.g. Toor Dal, MDH Garam Masala, Basmati Rice…"
            onChange={(e) => { setQuery(e.target.value); set('name', e.target.value); setShowList(true) }}
            onFocus={() => setShowList(true)}
          />
        </div>
        {showList && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-auto bg-white border border-saffron-200 rounded-lg shadow-xl">
            {matches.map((item) => (
              <button
                key={`${item.name}-${item.brand ?? ''}`}
                type="button"
                onClick={() => pick(item)}
                className="w-full text-left px-3 py-2 hover:bg-saffron-50 transition flex items-center justify-between gap-2"
              >
                <span className="text-sm text-gray-900">{item.name}</span>
                <span className="text-[11px] text-gray-400 shrink-0">{item.brand ? `${item.brand} · ` : ''}{item.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="text-xs text-gray-500">Brand
          <input className={inp} value={f.brand} onChange={(e) => set('brand', e.target.value)} /></label>
        <label className="text-xs text-gray-500">Category
          <select className={inp} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className="text-xs text-gray-500">Variant / size
          <input className={inp} value={f.variant_name} placeholder="e.g. 1kg, 500g" onChange={(e) => set('variant_name', e.target.value)} /></label>
        <label className="text-xs text-gray-500">SKU <span className="text-gray-600">(auto if blank)</span>
          <input className={inp} value={f.sku} onChange={(e) => set('sku', e.target.value)} /></label>
        <label className="text-xs text-gray-500">Price € *
          <input className={inp} type="number" min={0} step="0.01" value={f.price} onChange={(e) => set('price', e.target.value)} /></label>
        <label className="text-xs text-gray-500">Initial stock
          <input className={inp} type="number" min={0} value={f.quantity} onChange={(e) => set('quantity', e.target.value)} /></label>
        <label className="text-xs text-gray-500">Low-stock threshold
          <input className={inp} type="number" min={0} value={f.threshold} onChange={(e) => set('threshold', e.target.value)} /></label>
        <label className="text-xs text-gray-500 flex items-center gap-2 pt-5">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active (show on store)
        </label>
        <label className="text-xs text-gray-500 flex items-center gap-2 pt-5">
          <input type="checkbox" checked={f.is_bundle} onChange={(e) => set('is_bundle', e.target.checked)} /> Bundle / combo pack
        </label>
      </div>

      {/* Photo */}
      <div className="mt-4">
        <div className="flex items-end gap-2">
          <label className="text-xs text-gray-500 flex-1">Image URL
            <input className={inp} value={f.image_url} placeholder="https://… or use Find photo" onChange={(e) => set('image_url', e.target.value)} /></label>
          <button type="button" onClick={findPhotos} disabled={photoLoading}
            className="flex items-center gap-1 text-sm bg-white border border-saffron-200 hover:border-saffron-400 disabled:opacity-40 text-gray-700 px-3 py-2 rounded-lg transition shrink-0">
            {photoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Find photo
          </button>
        </div>
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((p) => (
              <button key={p.url} type="button" onClick={() => set('image_url', p.url)} title={p.label}
                className={`h-16 w-16 rounded border overflow-hidden ${f.image_url === p.url ? 'border-saffron-500 ring-2 ring-saffron-500' : 'border-saffron-200 hover:border-saffron-400'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {f.image_url && (
          <p className="text-[11px] text-green-600 mt-2 truncate">Selected image: {f.image_url}</p>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-1 text-sm bg-gradient-spice hover:opacity-90 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition">
          <Plus className="h-4 w-4" />{saving ? 'Creating…' : 'Create product'}
        </button>
        <button onClick={() => { reset(); setOpen(false) }} className="text-sm text-gray-400 hover:text-gray-700 transition">Cancel</button>
      </div>
    </div>
  )
}
