import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductDetailClient } from './ProductDetailClient'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, brand')
    .eq('slug', params.slug)
    .single()

  if (!product) return { title: 'Product Not Found' }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Spice Route`,
      description: product.description.slice(0, 160),
    },
  }
}

export const revalidate = 3600

export default async function ProductDetailPage({ params }: Props) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      images:product_images(url, alt_text, is_primary),
      variants:product_variants(*, inventory(*)),
      reviews(*, user:profiles(full_name, avatar_url))
    `)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const productAny = product as any

  // Related products
  const { data: related } = await supabase
    .from('products')
    .select('*, images:product_images(url, is_primary), variants:product_variants(price_eur), inventory(quantity)')
    .eq('category_id', productAny.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  const relatedMapped = (related ?? []).map((p: any) => ({
    ...p,
    primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
    stock: p.inventory?.quantity ?? 0,
  }))

  // Structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand ?? 'Spice Route' },
    offers: product.variants?.map((v: any) => ({
      '@type': 'Offer',
      price: v.price_eur,
      priceCurrency: 'EUR',
      availability: v.inventory?.quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    })),
    aggregateRating: product.reviews?.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: (product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length).toFixed(1),
      reviewCount: product.reviews.length,
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailClient product={product} related={relatedMapped} />
    </>
  )
}
