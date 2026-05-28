'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

async function fetchAutocomplete(query: string) {
  if (query.length < 2) return []
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
  return res.json()
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  const { data: results = [] } = useQuery({
    queryKey: ['search-autocomplete', query],
    queryFn: () => fetchAutocomplete(query),
    enabled: query.length >= 2,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search atta, dal, basmati... (Hindi/English)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className="w-full pl-9 pr-9 py-2 rounded-full border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          {results.map((product: any) => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left transition"
              onClick={() => {
                router.push(`/products/${product.slug}`)
                setOpen(false)
                setQuery('')
              }}
            >
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={36}
                  height={36}
                  className="rounded object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category_name}</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-saffron-600">
                €{product.min_price?.toFixed(2)}
              </span>
            </button>
          ))}
          <button
            className="w-full px-4 py-2.5 text-sm text-saffron-600 hover:bg-muted/50 text-center font-medium border-t"
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`)
              setOpen(false)
            }}
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  )
}
