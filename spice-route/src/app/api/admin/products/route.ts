import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  const { data, count } = await supabase
    .from('products')
    .select('*, variants:product_variants(*, inventory(*)), category:categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({ products: data, total: count })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const supabase = createAdminClient()

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: body.name,
      slug: body.slug ?? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description ?? '',
      category_id: body.category_id,
      brand: body.brand,
      country_of_origin: body.country_of_origin,
      weight_grams: body.weight_grams,
      dietary_tags: body.dietary_tags ?? [],
      allergens: body.allergens ?? [],
      nutritional_info: body.nutritional_info ?? null,
      ean_barcode: body.ean_barcode,
      is_active: body.is_active ?? true,
      is_featured: body.is_featured ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ product })
}
