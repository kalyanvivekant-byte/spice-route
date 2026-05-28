'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, Grid3X3, List } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DIETARY_OPTIONS = [
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'vegetarian', label: '🥗 Vegetarian' },
  { value: 'gluten_free', label: '🚫 Gluten-Free' },
  { value: 'halal', label: '☾ Halal' },
  { value: 'organic', label: '🌿 Organic' },
]

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

interface Props {
  category: any
  products: any[]
  total: number
  page: number
  pageSize: number
  searchParams: Record<string, string | undefined>
}

export function ProductListingClient({ category, products, total, page, pageSize, searchParams }: Props) {
  const router = useRouter()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams as any)
    if (value === null) params.delete(key)
    else params.set(key, value)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">{total} products</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block w-64 shrink-0 space-y-6`}>
          <div>
            <h3 className="font-semibold mb-3">Dietary</h3>
            <div className="space-y-2">
              {DIETARY_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={searchParams.dietary === opt.value}
                    onChange={(e) => updateParam('dietary', e.target.checked ? opt.value : null)}
                    className="rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={searchParams.in_stock === 'true'}
                onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
              />
              In Stock Only
            </label>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={searchParams.min_price ?? ''}
                onChange={(e) => updateParam('min_price', e.target.value || null)}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                placeholder="Max"
                value={searchParams.max_price ?? ''}
                onChange={(e) => updateParam('max_price', e.target.value || null)}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Filters
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Select value={searchParams.sort ?? 'featured'} onValueChange={(v) => updateParam('sort', v)}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 ${view === 'grid' ? 'bg-muted' : ''}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 ${view === 'list' ? 'bg-muted' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={view === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-4'
            }>
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
