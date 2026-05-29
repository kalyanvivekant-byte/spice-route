'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [variant, setVariant] = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('products')
        .select('*, variants:product_variants(*, inventory(*))')
        .eq('id', params.id)
        .maybeSingle()
      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProduct(data)
      const v = data.variants?.[0] ?? null
      setVariant(v)
      setInventory(v?.inventory?.[0] ?? v?.inventory ?? null)
      setLoading(false)
    })()
  }, [supabase, params.id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const errors: string[] = []

    const { error: pErr } = await supabase
      .from('products')
      .update({
        name: product.name,
        brand: product.brand,
        description: product.description,
        is_active: product.is_active,
        is_featured: product.is_featured,
      })
      .eq('id', product.id)
    if (pErr) errors.push(pErr.message)

    if (variant) {
      const { error: vErr } = await supabase
        .from('product_variants')
        .update({ price_eur: Number(variant.price_eur) })
        .eq('id', variant.id)
      if (vErr) errors.push(vErr.message)
    }

    if (inventory?.id) {
      const { error: iErr } = await supabase
        .from('inventory')
        .update({ quantity: Number(inventory.quantity) })
        .eq('id', inventory.id)
      if (iErr) errors.push(iErr.message)
    }

    setSaving(false)
    if (errors.length) return toast.error(errors[0])
    toast.success('Saved')
    router.push('/admin/products')
    router.refresh()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>
  if (notFound) {
    return (
      <div className="p-6">
        <p className="text-gray-300">Product not found.</p>
        <Link href="/admin/products" className="text-saffron-400 hover:underline text-sm">← Products</Link>
      </div>
    )
  }

  const input = 'mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white'

  return (
    <div className="p-6 max-w-xl">
      <Link href="/admin/products" className="text-saffron-400 hover:underline text-sm">← Products</Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">Edit Product</h1>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm text-gray-300">Name</label>
          <input className={input} value={product.name ?? ''} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300">Brand</label>
          <input className={input} value={product.brand ?? ''} onChange={(e) => setProduct({ ...product, brand: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300">Description</label>
          <textarea className={input} rows={3} value={product.description ?? ''} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
        </div>
        {variant && (
          <div>
            <label className="text-sm text-gray-300">Price (€) — {variant.name}</label>
            <input
              type="number"
              step="0.01"
              className={input}
              value={variant.price_eur ?? ''}
              onChange={(e) => setVariant({ ...variant, price_eur: e.target.value })}
            />
          </div>
        )}
        {inventory?.id && (
          <div>
            <label className="text-sm text-gray-300">Stock quantity</label>
            <input
              type="number"
              className={input}
              value={inventory.quantity ?? ''}
              onChange={(e) => setInventory({ ...inventory, quantity: e.target.value })}
            />
          </div>
        )}
        <div className="flex gap-6 text-sm text-gray-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!product.is_active} onChange={(e) => setProduct({ ...product, is_active: e.target.checked })} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!product.is_featured} onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })} />
            Featured
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
