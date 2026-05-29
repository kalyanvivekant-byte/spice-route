import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { HeroBanner } from '@/components/layout/HeroBanner'
import { CategoryGrid } from '@/components/layout/CategoryGrid'
import { FestivalBanner } from '@/components/layout/FestivalBanner'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Spice Route – Authentic Indian Groceries in Europe',
}

export const revalidate = 3600 // ISR every hour

async function getFeaturedProducts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(url, is_primary),
      variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity))
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(8)

  return data ?? []
}

async function getDeals() {
  const supabase = createClient()
  const { data } = await supabase
    .from('product_variants')
    .select(`
      *,
      inventory(quantity),
      product:products(*, images:product_images(url, is_primary))
    `)
    .not('compare_at_price_eur', 'is', null)
    .eq('is_active', true)
    .limit(4)

  return data ?? []
}

export default async function HomePage() {
  const [featured, deals] = await Promise.all([getFeaturedProducts(), getDeals()])

  const featuredProducts = featured.map((p: any) => ({
    ...p,
    primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
    stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
  }))

  const dealProducts = deals.map((v: any) => ({
    ...v.product,
    primary_image: v.product?.images?.find((i: any) => i.is_primary)?.url ?? v.product?.images?.[0]?.url,
    min_price: v.price_eur,
    stock: v.inventory?.quantity ?? 0,
    variants: [v],
  }))

  return (
    <>
      <HeroBanner />
      <FestivalBanner />

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Categories */}
        <section>
          <div className="mb-6">
            <span className="eyebrow">Browse</span>
            <h2 className="mt-2 text-3xl font-extrabold">Shop by <span className="text-gradient-spice">Category</span></h2>
          </div>
          <CategoryGrid />
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="eyebrow">Handpicked</span>
              <h2 className="mt-2 text-3xl font-extrabold">Featured <span className="text-gradient-spice">Products</span></h2>
            </div>
            <Link href="/products" className="text-saffron-600 hover:text-saffron-700 font-semibold text-sm shrink-0">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Deals Section */}
        {dealProducts.length > 0 && (
          <section className="section-soft rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-saffron-200/40 blur-3xl" aria-hidden />
            <div className="relative flex items-end justify-between mb-6">
              <div>
                <span className="eyebrow">🔥 Limited time</span>
                <h2 className="mt-2 text-3xl font-extrabold">Today&apos;s <span className="text-gradient-spice">Deals</span></h2>
                <p className="text-muted-foreground text-sm mt-1">Limited time offers on top products</p>
              </div>
              <Link href="/deals" className="text-saffron-600 hover:text-saffron-700 font-semibold text-sm shrink-0">
                View all deals →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {dealProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* USPs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚚', title: 'Free Delivery', desc: 'On orders over €50' },
            { icon: '🌶️', title: 'Authentic Brands', desc: 'MDH, Heera, TRS & more' },
            { icon: '🔒', title: 'Secure Checkout', desc: 'iDEAL, SEPA, Stripe' },
            { icon: '↩️', title: '14-Day Returns', desc: 'Hassle-free returns' },
          ].map((usp) => (
            <div key={usp.title} className="card-lift text-center p-5 bg-white rounded-2xl border border-saffron-100/70 shadow-sm">
              <div className="text-4xl mb-2">{usp.icon}</div>
              <h3 className="font-display font-bold text-sm">{usp.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{usp.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
