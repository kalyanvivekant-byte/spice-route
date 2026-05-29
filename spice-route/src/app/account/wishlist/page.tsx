import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import Link from 'next/link'

export default async function WishlistPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/wishlist')

  const { data: rows } = await supabase
    .from('wishlists')
    .select(`
      product:products(
        id, name, slug, brand, dietary_tags, is_featured, expiry_discount,
        images:product_images(url, is_primary),
        variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity)),
        reviews(rating)
      )
    `)
    .eq('user_id', user.id)

  const products = (rows ?? [])
    .map((r: any) => r.product)
    .filter(Boolean)
    .map((p: any) => ({
      ...p,
      primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
      min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
      stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
      avg_rating: p.reviews?.length
        ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length
        : 0,
      review_count: p.reviews?.length ?? 0,
    }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wishlist</h1>

      {products.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl">
          <div className="text-5xl mb-4">❤️</div>
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link href="/products" className="mt-3 inline-block text-saffron-600 hover:underline text-sm">
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
