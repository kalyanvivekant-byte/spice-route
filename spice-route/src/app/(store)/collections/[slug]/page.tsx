import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { resolveCollectionProducts } from '@/lib/collections'

interface Props { params: { slug: string } }

export const revalidate = 600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('collections').select('title, subtitle').eq('slug', params.slug).maybeSingle()
  if (!data) return { title: 'Collection Not Found' }
  return { title: `${data.title} · Spice Route`, description: data.subtitle ?? undefined }
}

export default async function CollectionPage({ params }: Props) {
  const supabase = createClient()
  const { data: collection } = await supabase
    .from('collections')
    .select('id, title, subtitle, type')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!collection) notFound()

  const products = await resolveCollectionProducts(supabase, collection as any, 96)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">{collection.title}</h1>
        {collection.subtitle && <p className="text-muted-foreground text-sm mt-1">{collection.subtitle}</p>}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-muted-foreground">Nothing here yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
