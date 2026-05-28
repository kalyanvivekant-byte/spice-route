import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

export async function GET() {
  const supabase = createAdminClient()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('total_eur, created_at')
    .not('status', 'in', '("pending_payment","cancelled")')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at')

  // Group by day
  const byDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'MMM d')
    byDay[day] = 0
  }

  data?.forEach((order) => {
    const day = format(new Date(order.created_at), 'MMM d')
    if (byDay[day] !== undefined) byDay[day] += order.total_eur
  })

  return NextResponse.json(
    Object.entries(byDay).map(([day, revenue]) => ({ day, revenue: Math.round(revenue * 100) / 100 }))
  )
}
