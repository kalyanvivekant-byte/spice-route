import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLabelPdf } from '@/lib/shipping/sendcloud'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

// Streams the carrier label PDF for a parcel (admin only).
export async function GET(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parcel = request.nextUrl.searchParams.get('parcel')
  if (!parcel) return NextResponse.json({ error: 'Missing parcel' }, { status: 400 })

  try {
    const pdf = await getLabelPdf(parcel)
    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="label-${parcel}.pdf"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Label fetch failed' }, { status: 500 })
  }
}
