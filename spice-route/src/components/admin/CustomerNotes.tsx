'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function CustomerNotes({ customerId, initial }: { customerId: string; initial: string | null }) {
  const supabase = createClient()
  const [notes, setNotes] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ admin_notes: notes }).eq('id', customerId)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Notes saved')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="font-semibold mb-2">Admin notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Internal notes about this customer…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-saffron-500"
      />
      <button onClick={save} disabled={saving} className="mt-2 bg-saffron-500 hover:bg-saffron-600 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50">
        {saving ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}
