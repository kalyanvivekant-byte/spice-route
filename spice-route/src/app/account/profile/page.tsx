import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, newsletter, referral_code')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <ProfileForm
        initial={{
          full_name: profile?.full_name ?? '',
          email: profile?.email ?? user.email ?? '',
          phone: profile?.phone ?? '',
          newsletter: profile?.newsletter ?? false,
          referral_code: profile?.referral_code ?? '',
        }}
      />
    </div>
  )
}
