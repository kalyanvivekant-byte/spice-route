import { createAdminClient } from '@/lib/supabase/server'
import { BannersManager } from './BannersManager'

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
  const supabase = createAdminClient()
  const { data: banners } = await supabase
    .from('banners')
    .select('id, title, image_url, mobile_image_url, link_url, sort_order, is_active')
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-full bg-[#fffaf3] text-gray-900 p-4 sm:p-6">
      <BannersManager banners={(banners as any) ?? []} />
    </div>
  )
}
