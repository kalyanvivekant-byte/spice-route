import { createAdminClient } from '@/lib/supabase/server'
import { DiscountsManager } from './DiscountsManager'

export const dynamic = 'force-dynamic'

export default async function AdminDiscountsPage() {
  const supabase = createAdminClient()
  const { data: promos } = await supabase
    .from('promo_codes')
    .select('id, code, description, discount_type, discount_value, min_order_eur, max_uses, uses_count, valid_from, valid_until, is_active')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-full bg-[#fffaf3] text-gray-900 p-4 sm:p-6">
      <DiscountsManager promos={(promos as any) ?? []} />
    </div>
  )
}
