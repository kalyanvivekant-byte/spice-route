import { createClient } from '@/lib/supabase/server'
import { expandSearchQuery } from '@/lib/search'
import { ProductCard } from '@/components/product/ProductCard'

interface Props {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? ''
  let products: any[] = []
  let count = 0

  if (q.length >= 2) {
    const supabase = createClient()
    const expanded = expandSearchQuery(q)

    // Full-text search + trigram fallback
    const tsQuery = expanded.map((t) => t.replace(/['"]/g, '')).join(' | ')

    const { data, count: c } = await supabase
      .from('products')
      .select(`
        id, name, slug, brand, dietary_tags, is_featured, expiry_discount,
        images:product_images(url, is_primary),
        variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity)),
        reviews(rating)
      `, { count: 'exact' })
      .eq('is_active', true)
      .textSearch('search_vector', tsQuery, { type: 'websearch' })
      .limit(48)

    products = (data ?? []).map((p: any) => ({
      ...p,
      primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
      min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
      stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
      avg_rating: p.reviews?.length ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length : 0,
      review_count: p.reviews?.length ?? 0,
    }))
    count = c ?? 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">
        {q ? `Search results for "${q}"` : 'Search'}
      </h1>
      {q && <p className="text-muted-foreground text-sm mb-6">{count} products found</p>}

      {!q && (
        <p className="text-muted-foreground">Enter a search term above to find products.</p>
      )}

      {q && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium">No results for "{q}"</p>
          <p className="text-muted-foreground text-sm mt-2">
            Try searching in Hindi/English – we support transliteration (e.g. "atta" = "aata")
          </p>
        </div>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
