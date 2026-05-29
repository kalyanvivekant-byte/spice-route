import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'

export const metadata = { title: 'All Products · Spice Route' }

const SELECT = `
  id, name, slug, brand, dietary_tags, is_featured, expiry_discount,
  images:product_images(url, is_primary),
  variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity)),
  reviews(rating)
`

function mapProduct(p: any) {
  return {
    ...p,
    primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
    stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
    avg_rating: p.reviews?.length
      ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length
      : 0,
    review_count: p.reviews?.length ?? 0,
  }
}

export default async function ProductsPage() {
  const supabase = createClient()
  const { data, count } = await supabase
    .from('products')
    .select(SELECT, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(96)

  const products = (data ?? []).map(mapProduct)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">All Products</h1>
      <p className="text-muted-foreground text-sm mb-6">{count ?? products.length} products</p>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products available yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
