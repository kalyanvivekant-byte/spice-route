'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
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

type Row = Product & { _busy?: boolean; _inInventory: boolean }

function variantHasInv(v: Variant) {
  const inv = v.inventory
  if (Array.isArray(inv)) return inv.length > 0
  return !!inv
}

export function ProductCatalog({ products }: { products: Product[] }) {
  const supabase = createClient()
  const [open, setOpen] = useState(true)
  const [rows, setRows] = useState<Row[]>(() =>
    products.map((p) => ({
      ...p,
      _inInventory: (p.variants ?? []).length > 0 && p.variants.every(variantHasInv),
    }))
  )

  function set(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function toggle(id: string, include: boolean) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    if (!row.variants?.length) return toast.error('This product has no variants yet — add one in Products first.')

    set(id, { _busy: true })

    if (include) {
      const missing = row.variants.filter((v) => !variantHasInv(v))
      if (missing.length) {
        const { error } = await supabase
          .from('inventory')
          .insert(missing.map((v) => ({ variant_id: v.id, quantity: 0, low_stock_threshold: 10 })))
        if (error) { toast.error(error.message); set(id, { _busy: false }); return }
      }
      set(id, { _busy: false, _inInventory: true })
      toast.success(`${row.name} added to inventory`)
    } else {
      if (!confirm(`Remove "${row.name}" from inventory? Its stock counts will be deleted.`)) {
        set(id, { _busy: false })
        return
      }
      const ids = row.variants.map((v) => v.id)
      const { error } = await supabase.from('inventory').delete().in('variant_id', ids)
      if (error) { toast.error(error.message); set(id, { _busy: false }); return }
      set(id, { _busy: false, _inInventory: false })
      toast.success(`${row.name} removed from inventory`)
    }
  }

  const shown = rows.filter((r) => r._inInventory).length

  return (
    <div className="mb-6 bg-gray-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition"
      >
        <span className="font-semibold">
          Product catalog{' '}
          <span className="text-gray-400 text-sm font-normal">
            — {shown} of {rows.length} in inventory
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-gray-800">
          {rows.map((r) => {
            const img = r.images?.find((i) => i.is_primary)?.url ?? r.images?.[0]?.url
            return (
              <label
                key={r.id}
                className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${
                  r._inInventory ? 'border-saffron-500 bg-saffron-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 rounded bg-gray-800 overflow-hidden flex items-center justify-center">
                  {img ? (
                    <Image src={img} alt={r.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <span className="text-xl">🌶️</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {r.brand && <p className="text-[11px] text-gray-500 truncate">{r.brand}</p>}
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-[11px] text-gray-500">{r.variants?.length ?? 0} variant(s){r.is_active ? '' : ' · inactive'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={r._inInventory}
                  disabled={r._busy}
                  onChange={(e) => toggle(r.id, e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`h-6 w-6 shrink-0 rounded flex items-center justify-center border ${
                    r._inInventory ? 'bg-saffron-500 border-saffron-500' : 'border-gray-600'
                  } ${r._busy ? 'opacity-40' : ''}`}
                >
                  {r._inInventory && <Check className="h-4 w-4 text-white" />}
                </span>
              </label>
            )
          })}
          {rows.length === 0 && <p className="text-gray-500 text-sm col-span-full">No products yet.</p>}
        </div>
      )}
    </div>
  )
}
