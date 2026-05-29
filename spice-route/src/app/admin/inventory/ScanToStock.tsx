'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarcodeScanner } from '@/components/admin/BarcodeScanner'
import { ScanBarcode, Loader2, Plus, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category { id: string; name: string }

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

type Mode = 'idle' | 'scanning' | 'looking' | 'found' | 'new'

export function ScanToStock({ categories }: { categories: Category[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('idle')
  const [barcode, setBarcode] = useState('')
  const [busy, setBusy] = useState(false)

  // existing-match state
  const [found, setFound] = useState<any>(null)
  const [addQty, setAddQty] = useState('1')

  // new-product state
  const [f, setF] = useState({
    name: '', brand: '', category_id: '', variant_name: '1 unit',
    price: '', quantity: '1', threshold: '10', image_url: '', is_active: true,
  })
  const setField = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }))

  function close() {
    setMode('idle'); setBarcode(''); setFound(null); setAddQty('1')
    setF({ name: '', brand: '', category_id: '', variant_name: '1 unit', price: '', quantity: '1', threshold: '10', image_url: '', is_active: true })
  }

  async function handleDetected(code: string) {
    setBarcode(code)
    setMode('looking')
    // 1) Does a variant with this barcode already exist?
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, name, sku, barcode, product:products(name), inventory(id, quantity)')
      .eq('barcode', code)
      .limit(1)
      .maybeSingle()

    if (variant) {
      setFound(variant)
      setMode('found')
      return
    }

    // 2) New barcode — look it up on Open Food Facts to pre-fill.
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,image_front_url,image_url`
      )
      const data = await res.json()
      if (data?.status === 1 && data.product) {
        setF((p) => ({
          ...p,
          name: data.product.product_name || '',
          brand: (data.product.brands || '').split(',')[0]?.trim() || '',
          image_url: data.product.image_front_url || data.product.image_url || '',
        }))
        toast.success('Found product details — set price & stock')
      } else {
        toast('Barcode not in the database — fill in the details', { icon: '🔍' })
      }
    } catch {
      toast('Could not reach product lookup — fill in the details', { icon: '🔍' })
    }
    setMode('new')
  }

  // --- existing: add stock ---
  async function saveAddStock() {
    if (!found) return
    const add = parseInt(addQty, 10)
    if (Number.isNaN(add) || add === 0) return toast.error('Enter a quantity to add')
    setBusy(true)
    const inv = Array.isArray(found.inventory) ? found.inventory[0] : found.inventory
    if (inv?.id) {
      const next = Math.max(0, (inv.quantity ?? 0) + add)
      const { error } = await supabase.from('inventory').update({ quantity: next, updated_at: new Date().toISOString() }).eq('id', inv.id)
      if (error) { toast.error(error.message); setBusy(false); return }
    } else {
      const { error } = await supabase.from('inventory').insert({ variant_id: found.id, quantity: Math.max(0, add), low_stock_threshold: 10 })
      if (error) { toast.error(error.message); setBusy(false); return }
    }
    toast.success(`+${add} added to ${found.product?.name ?? 'product'}`)
    setBusy(false)
    close()
    router.refresh()
  }

  // --- new: create product with barcode ---
  async function createNew() {
    if (!f.name.trim()) return toast.error('Product name is required')
    const price = Number(f.price)
    if (f.price === '' || Number.isNaN(price) || price < 0) return toast.error('Enter a valid price')
    const quantity = parseInt(f.quantity, 10) || 0
    const threshold = parseInt(f.threshold, 10) || 10
    const sku = `${slugify(f.name).slice(0, 20)}-${Math.random().toString(36).slice(2, 6)}`

    setBusy(true)
    const { data: product, error: pErr } = await supabase
      .from('products')
      .insert({ name: f.name.trim(), slug: `${slugify(f.name)}-${Math.random().toString(36).slice(2, 6)}`, brand: f.brand || null, category_id: f.category_id || null, is_active: f.is_active })
      .select('id').single()
    if (pErr || !product) { toast.error(pErr?.message ?? 'Failed to create product'); setBusy(false); return }

    const { data: variant, error: vErr } = await supabase
      .from('product_variants')
      .insert({ product_id: product.id, name: f.variant_name.trim() || 'Default', sku, barcode, price_eur: price, is_active: true })
      .select('id').single()
    if (vErr || !variant) {
      toast.error(vErr?.message ?? 'Failed to create variant')
      await supabase.from('products').delete().eq('id', product.id)
      setBusy(false); return
    }

    const { error: iErr } = await supabase.from('inventory').insert({ variant_id: variant.id, quantity, low_stock_threshold: threshold })
    if (iErr) { toast.error(`Product created, but stock row failed: ${iErr.message}`); setBusy(false); return }

    if (f.image_url.trim()) {
      await supabase.from('product_images').insert({ product_id: product.id, url: f.image_url.trim(), is_primary: true })
    }
    toast.success(`${f.name} created`)
    setBusy(false)
    close()
    router.refresh()
  }

  const inp = 'w-full bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'

  return (
    <div className="mb-4">
      <button
        onClick={() => setMode('scanning')}
        className="flex items-center gap-2 text-sm bg-white border border-saffron-200 hover:border-saffron-400 text-gray-700 px-4 py-2 rounded-lg transition"
      >
        <ScanBarcode className="h-4 w-4 text-saffron-600" /> Scan barcode to add stock
      </button>

      {mode === 'scanning' && (
        <BarcodeScanner onDetected={handleDetected} onClose={close} />
      )}

      {mode === 'looking' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking up <span className="font-mono">{barcode}</span>…
        </div>
      )}

      {/* Existing product found → add stock */}
      {mode === 'found' && found && (
        <div className="mt-3 bg-white border border-saffron-100 shadow-sm rounded-2xl p-4 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Already in catalogue</h3>
            <button onClick={close} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-sm text-gray-700">{found.product?.name} <span className="text-gray-400">· {found.name}</span></p>
          <p className="text-xs text-gray-400 mb-3">Barcode <span className="font-mono">{barcode}</span> · current stock {(Array.isArray(found.inventory) ? found.inventory[0]?.quantity : found.inventory?.quantity) ?? 0}</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Add quantity</label>
            <input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="w-24 bg-white border border-saffron-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-saffron-500" />
            <button onClick={saveAddStock} disabled={busy} className="flex items-center gap-1 text-sm bg-gradient-spice text-white px-4 py-2 rounded-lg disabled:opacity-40 transition">
              <Check className="h-4 w-4" />{busy ? 'Saving…' : 'Add stock'}
            </button>
            <button onClick={() => setMode('scanning')} className="text-sm text-saffron-600 hover:text-saffron-700">Scan another</button>
          </div>
        </div>
      )}

      {/* New product → create with prefilled details */}
      {mode === 'new' && (
        <div className="mt-3 bg-white border border-saffron-100 shadow-sm rounded-2xl p-5 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">New product from barcode <span className="font-mono text-gray-400 text-sm">{barcode}</span></h3>
            <button onClick={close} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="text-xs text-gray-500 sm:col-span-2 lg:col-span-1">Product name *
              <input className={inp} value={f.name} onChange={(e) => setField('name', e.target.value)} /></label>
            <label className="text-xs text-gray-500">Brand
              <input className={inp} value={f.brand} onChange={(e) => setField('brand', e.target.value)} /></label>
            <label className="text-xs text-gray-500">Category
              <select className={inp} value={f.category_id} onChange={(e) => setField('category_id', e.target.value)}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <label className="text-xs text-gray-500">Variant / size
              <input className={inp} value={f.variant_name} placeholder="e.g. 1kg, 500g" onChange={(e) => setField('variant_name', e.target.value)} /></label>
            <label className="text-xs text-gray-500">Price € *
              <input className={inp} type="number" min={0} step="0.01" value={f.price} onChange={(e) => setField('price', e.target.value)} /></label>
            <label className="text-xs text-gray-500">Initial stock
              <input className={inp} type="number" min={0} value={f.quantity} onChange={(e) => setField('quantity', e.target.value)} /></label>
            <label className="text-xs text-gray-500">Low-stock threshold
              <input className={inp} type="number" min={0} value={f.threshold} onChange={(e) => setField('threshold', e.target.value)} /></label>
            <label className="text-xs text-gray-500 sm:col-span-2">Image URL
              <input className={inp} value={f.image_url} placeholder="https://…" onChange={(e) => setField('image_url', e.target.value)} /></label>
            <label className="text-xs text-gray-500 flex items-center gap-2 pt-5">
              <input type="checkbox" checked={f.is_active} onChange={(e) => setField('is_active', e.target.checked)} /> Active (show on store)
            </label>
          </div>

          {f.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image_url} alt="" className="mt-3 h-20 w-20 rounded-lg object-cover border border-saffron-200" />
          )}

          <div className="flex items-center gap-3 mt-5">
            <button onClick={createNew} disabled={busy} className="flex items-center gap-1 text-sm bg-gradient-spice hover:opacity-90 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition">
              <Plus className="h-4 w-4" />{busy ? 'Creating…' : 'Create product'}
            </button>
            <button onClick={() => setMode('scanning')} className="text-sm text-saffron-600 hover:text-saffron-700">Scan another</button>
            <button onClick={close} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
