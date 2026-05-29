'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface Initial {
  full_name: string
  email: string
  phone: string
  newsletter: boolean
  referral_code: string
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(initial.full_name)
  const [phone, setPhone] = useState(initial.phone)
  const [newsletter, setNewsletter] = useState(initial.newsletter)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not signed in')
      setSaving(false)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, newsletter })
      .eq('id', user.id)
    if (error) toast.error(error.message)
    else toast.success('Profile updated')
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-5">
      <div>
        <label className="text-sm font-medium">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          value={initial.email}
          disabled
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-muted/40 text-muted-foreground"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
        />
        Send me offers and the newsletter
      </label>
      {initial.referral_code && (
        <p className="text-xs text-muted-foreground">
          Your referral code: <span className="font-mono">{initial.referral_code}</span>
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
