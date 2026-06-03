import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, message } = await request.json()
  if (!orderId || !message?.trim()) return NextResponse.json({ error: 'Missing note' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('order_events')
    .insert({ order_id: orderId, type: 'note', message: message.trim(), created_by: admin.id })
    .select('id, type, message, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}
