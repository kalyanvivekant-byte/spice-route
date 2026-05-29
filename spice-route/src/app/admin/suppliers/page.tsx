import { createAdminClient } from '@/lib/supabase/server'
import { SuppliersManager } from './SuppliersManager'

export default async function AdminSuppliersPage() {
  const supabase = createAdminClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, contact_name, email, phone, address, lead_time_days, notes')
    .order('name', { ascending: true })

  return <SuppliersManager suppliers={(suppliers as any) ?? []} />
}
