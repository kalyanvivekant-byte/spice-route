import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Register · Spice Route POS' }

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/pos')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'cashier'].includes(profile.role)) redirect('/')

  return <div className="min-h-screen bg-[#fffaf3] text-gray-900">{children}</div>
}
