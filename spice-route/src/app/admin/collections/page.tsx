import { createAdminClient } from '@/lib/supabase/server'
import { CollectionsManager } from './CollectionsManager'

export const dynamic = 'force-dynamic'

export default async function AdminCollectionsPage() {
  const supabase = createAdminClient()
  const { data: collections } = await supabase
    .from('collections')
    .select('id, title, slug, subtitle, type, sort_order, is_active, show_on_home')
    .order('sort_order', { ascending: true })

  // Product counts for manual collections.
  const { data: links } = await supabase.from('collection_products').select('collection_id')
  const counts = new Map<string, number>()
  for (const l of (links ?? []) as any[]) counts.set(l.collection_id, (counts.get(l.collection_id) ?? 0) + 1)

  const rows = ((collections as any[]) ?? []).map((c) => ({ ...c, _count: counts.get(c.id) ?? 0 }))

  return (
    <div className="min-h-full bg-[#fffaf3] text-gray-900 p-4 sm:p-6">
      <CollectionsManager collections={rows} />
    </div>
  )
}
