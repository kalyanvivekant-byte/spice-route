'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Variant {
  id: string
  name: string
  inventory: { id: string }[] | { id: string } | null
}

interface Product {
  id: string
  name: string
  brand: string | null
  is_active: boolean
  images: { url: string; is_primary: boolean }[]
  variants: Variant[]
}

type Row = Product & { _busy?: boolean }

function variantHasInv(v: Variant) {
  const inv = v.inventory
  if (Array.isArray(inv)) return inv.length > 0
  return !!inv
}

export function UntrackedProducts({ products }: { products: Product[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  // Products with at least one variant not yet tracked in inventory
  const [rows, setRows] = useState<Row[]>(() =>
    products.filter((p) => !((p.variants ?? []).length > 0 && p.variants.every(variantHasInv)))
  )

  function set(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function add(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.variants?.length) return toast.error('This product has no variants yet')
    set(id, { _busy: true })
    const missing = row.variants.filter((v) => !variantHasInv(v))
    const { error } = await supabase
      .from('inventory')
      .insert(missing.map((v) => ({ variant_id: v.id, quantity: 0, low_stock_threshold: 10 })))
    if (error) { toast.error(error.message); set(id, { _busy: false }); return }
    toast.success(`${row.name} added to inventory`)
    setRows((prev) => prev.filter((r) => r.id !== id))
    router.refresh()
  }

  async function remove(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!confirm(`Delete "${row.name}" completely? This removes the product, its variants, stock, and images. This cannot be undone.`)) return
    set(id, { _busy: true })

    const variantIds = (row.variants ?? []).map((v) => v.id)
    if (variantIds.length) await supabase.from('inventory').delete().in('variant_id', variantIds)
    await supabase.from('product_images').delete().eq('product_id', id)
    await supabase.from('product_variants').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast.error(error.message); set(id, { _busy: false }); return }

    toast.success(`${row.name} deleted`)
    setRows((prev) => prev.filter((r) => r.id !== id))
    router.refresh()
  }

  if (rows.length === 0) return null

  return (
    <div className="mb-6 bg-white border border-saffron-100 shadow-sm rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-saffron-50 transition"
      >
        <span className="font-semibold text-gray-900">
          Products not in inventory{' '}
          <span className="text-gray-400 text-sm font-normal">— {rows.length}</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-saffron-100">
          {rows.map((r) => {
            const img = r.images?.find((i) => i.is_primary)?.url ?? r.images?.[0]?.url
            return (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl border border-saffron-200">
                <div className="relative h-12 w-12 shrink-0 rounded-lg bg-saffron-50 overflow-hidden flex items-center justify-center">
                  {img ? (
                    <Image src={img} alt={r.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <span className="text-xl">🌶️</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {r.brand && <p className="text-[11px] text-gray-500 truncate">{r.brand}</p>}
                  <p className="text-sm text-gray-900 truncate">{r.name}</p>
                  <p className="text-[11px] text-gray-400">{r.variants?.length ?? 0} variant(s){r.is_active ? '' : ' · inactive'}</p>
                </div>
                <button
                  onClick={() => add(r.id)}
                  disabled={r._busy}
                  title="Add to inventory"
                  className="flex items-center gap-1 text-xs bg-gradient-spice hover:opacity-90 disabled:opacity-40 text-white px-2 py-1.5 rounded-lg transition shrink-0"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
                <button
                  onClick={() => remove(r.id)}
                  disabled={r._busy}
                  title="Delete product"
                  className="flex items-center justify-center text-xs text-red-500 hover:text-white hover:bg-red-500 disabled:opacity-40 px-2 py-1.5 rounded-lg transition shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
