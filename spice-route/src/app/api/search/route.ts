import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expandSearchQuery } from '@/lib/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '10')

  if (q.length < 2) return NextResponse.json([])

  const supabase = createClient()
  const expanded = expandSearchQuery(q)
  const tsQuery = expanded.map((t) => t.replace(/['"]/g, '')).join(' | ')

  const { data } = await supabase
    .from('products')
    .select(`
      id, name, slug, brand,
      images:product_images(url, is_primary),
      variants:product_variants(price_eur),
      category:categories(name)
    `)
    .eq('is_active', true)
    .textSearch('search_vector', tsQuery, { type: 'websearch' })
    .limit(limit)

  const results = (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category_name: p.category?.name ?? '',
    image_url: p.images?.find((i: any) => i.is_primary)?.url ?? p.images?.[0]?.url ?? null,
    min_price: Math.min(...(p.variants?.map((v: any) => v.price_eur) ?? [0])),
  }))

  return NextResponse.json(results)
}
