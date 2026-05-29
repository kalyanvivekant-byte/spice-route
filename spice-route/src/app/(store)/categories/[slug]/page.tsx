import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductListingClient } from '@/components/product/ProductListingClient'

interface Props {
  params: { slug: string }
  searchParams: { page?: string; sort?: string; brand?: string; dietary?: string; min_price?: string; max_price?: string; in_stock?: string }
}

export async function generateStaticParams() {
  const { createClient: createSupabase } = await import('@supabase/supabase-js')
  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.from('categories').select('slug').eq('is_active', true)
  return (data ?? []).map((c: any) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('categories').select('name, description').eq('slug', params.slug).single()
  if (!data) return { title: 'Category Not Found' }
  return { title: `${data.name} – Indian Groceries`, description: data.description ?? undefined }
}

export const revalidate = 3600

export default async function CategoryPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 24
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('products')
    .select(`
      id, name, slug, brand, dietary_tags, is_featured, expiry_discount,
      images:product_images(url, is_primary),
      variants:product_variants(id, name, price_eur, compare_at_price_eur, inventory(quantity)),
      reviews(rating)
    `, { count: 'exact' })
    .eq('category_id', category.id)
    .eq('is_active', true)

  if (searchParams.brand) query = query.eq('brand', searchParams.brand)
  if (searchParams.dietary) query = query.contains('dietary_tags', [searchParams.dietary])

  const sort = searchParams.sort ?? 'featured'
  if (sort === 'price_asc') query = query.order('variants.price_eur' as any, { ascending: true })
  else if (sort === 'price_desc') query = query.order('variants.price_eur' as any, { ascending: false })
  else if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else query = query.order('is_featured', { ascending: false })

  const { data: products, count } = await query.range(offset, offset + pageSize - 1)

  const mapped = (products ?? []).map((p: any) => ({
    ...p,
    primary_image: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
    stock: (p.variants ?? []).reduce((s: number, v: any) => s + (v.inventory?.quantity ?? 0), 0),
    avg_rating: p.reviews?.length ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length : 0,
    review_count: p.reviews?.length ?? 0,
  }))

  return (
    <ProductListingClient
      category={category}
      products={mapped}
      total={count ?? 0}
      page={page}
      pageSize={pageSize}
      searchParams={searchParams}
    />
  )
}
