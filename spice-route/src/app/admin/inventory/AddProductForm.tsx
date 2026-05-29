'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function AddProductForm({ categories }: { categories: Category[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({
    name: '',
    brand: '',
    category_id: '',
    variant_name: '1 unit',
    sku: '',
    price: '',
    quantity: '0',
    threshold: '10',
    image_url: '',
    is_active: true,
  })

  function set(k: keyof typeof f, v: any) {
    setF((prev) => ({ ...prev, [k]: v }))
  }

  function reset() {
    setF({
      name: '', brand: '', category_id: '', variant_name: '1 unit', sku: '',
      price: '', quantity: '0', threshold: '10', image_url: '', is_active: true,
    })
  }

  async function submit() {
    if (!f.name.trim()) return toast.error('Product name is required')
    const price = Number(f.price)
    if (f.price === '' || Number.isNaN(price) || price < 0) return toast.error('Enter a valid price')
    const sku = f.sku.trim() || `${slugify(f.name).slice(0, 20)}-${Math.random().toString(36).slice(2, 6)}`
    const quantity = parseInt(f.quantity, 10) || 0
    const threshold = parseInt(f.threshold, 10) || 10

    setSaving(true)

    // 1. Product
    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({
        name: f.name.trim(),
        slug: `${slugify(f.name)}-${Math.random().toString(36).slice(2, 6)}`,
        brand: f.brand || null,
        category_id: f.category_id || null,
        is_active: f.is_active,
      })
      .select('id')
      .single()
    if (pErr || !product) { toast.error(pErr?.message ?? 'Failed to create product'); setSaving(false); return }

    // 2. Variant
    const { data: variant, error: vErr } = await supabase
      .from('product_variants')
      .insert({
        product_id: product.id,
        name: f.variant_name.trim() || 'Default',
        sku,
        price_eur: price,
        is_active: true,
      })
      .select('id')
      .single()
    if (vErr || !variant) {
      toast.error(vErr?.message ?? 'Failed to create variant')
      await supabase.from('products').delete().eq('id', product.id) // rollback
      setSaving(false)
      return
    }

    // 3. Inventory
    const { error: iErr } = await supabase
      .from('inventory')
      .insert({ variant_id: variant.id, quantity, low_stock_threshold: threshold })
    if (iErr) { toast.error(`Product created, but stock row failed: ${iErr.message}`); setSaving(false); return }

    // 4. Optional image
    if (f.image_url.trim()) {
      await supabase.from('product_images').insert({
        product_id: product.id, url: f.image_url.trim(), is_primary: true,
      })
    }

    toast.success(`${f.name} created`)
    reset()
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const inp =
    'w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-saffron-500'

  if (!open) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-sm bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="h-4 w-4" /> Add new product
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-gray-900 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">New product</h2>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="text-xs text-gray-400">Name *
          <input className={inp} value={f.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Brand
          <input className={inp} value={f.brand} onChange={(e) => set('brand', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Category
          <select className={inp} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400">Variant / size
          <input className={inp} value={f.variant_name} placeholder="e.g. 1kg, 500g" onChange={(e) => set('variant_name', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">SKU <span className="text-gray-600">(auto if blank)</span>
          <input className={inp} value={f.sku} onChange={(e) => set('sku', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Price € *
          <input className={inp} type="number" min={0} step="0.01" value={f.price} onChange={(e) => set('price', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Initial stock
          <input className={inp} type="number" min={0} value={f.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Low-stock threshold
          <input className={inp} type="number" min={0} value={f.threshold} onChange={(e) => set('threshold', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400">Image URL
          <input className={inp} value={f.image_url} placeholder="https://…" onChange={(e) => set('image_url', e.target.value)} />
        </label>
        <label className="text-xs text-gray-400 flex items-center gap-2 pt-5">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          Active (show on store)
        </label>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-1 text-sm bg-saffron-500 hover:bg-saffron-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition">
          <Plus className="h-4 w-4" />{saving ? 'Creating…' : 'Create product'}
        </button>
        <button onClick={() => { reset(); setOpen(false) }} className="text-sm text-gray-400 hover:text-white transition">
          Cancel
        </button>
      </div>
    </div>
  )
}
