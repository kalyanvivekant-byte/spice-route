'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NewProductPage() {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    brand: '',
    description: '',
    category_id: '',
    is_active: true,
    is_featured: false,
  })

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [supabase])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, category_id: form.category_id || null }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) return toast.error(json.error ?? 'Failed to create product')
    toast.success('Product created')
    router.push('/admin/products')
    router.refresh()
  }

  const input = 'mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white'

  return (
    <div className="p-6 max-w-xl">
      <Link href="/admin/products" className="text-saffron-400 hover:underline text-sm">← Products</Link>
      <h1 className="text-2xl font-bold mt-3 mb-6">New Product</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-300">Name</label>
          <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300">Brand</label>
          <input className={input} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300">Category</label>
          <select
            className={input}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300">Description</label>
          <textarea
            className={input}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex gap-6 text-sm text-gray-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            Featured
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create product'}
        </button>
        <p className="text-xs text-gray-500">
          You can add pricing, variants and stock after creating the product.
        </p>
      </form>
    </div>
  )
}
