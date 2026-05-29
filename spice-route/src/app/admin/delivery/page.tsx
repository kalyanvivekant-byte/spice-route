import { createAdminClient } from '@/lib/supabase/server'
import { DeliveryManager } from './DeliveryManager'

export default async function AdminDeliveryPage() {
  const supabase = createAdminClient()
  const [{ data: zones }, { data: slots }] = await Promise.all([
    supabase
      .from('delivery_zones')
      .select('id, name, country_code, postal_prefix, min_order_eur, delivery_fee_eur, free_delivery_above_eur, express_fee_eur, is_active')
      .order('name'),
    supabase
      .from('delivery_slots')
      .select('id, date, slot_label, capacity, booked, is_express, zone:delivery_zones(name)')
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date')
      .limit(100),
  ])

  return <DeliveryManager zones={(zones as any) ?? []} slots={(slots as any) ?? []} />
}
