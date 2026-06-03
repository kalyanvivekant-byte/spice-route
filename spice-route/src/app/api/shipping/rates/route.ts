import { NextRequest, NextResponse } from 'next/server'
import { getShippingMethods, sendcloudConfigured } from '@/lib/shipping/sendcloud'

// Public: shipping options for a destination + weight (used at checkout and in admin).
export async function GET(request: NextRequest) {
  if (!sendcloudConfigured()) {
    return NextResponse.json({ configured: false, methods: [] })
  }
  const country = request.nextUrl.searchParams.get('country')?.toUpperCase()
  const weight = request.nextUrl.searchParams.get('weight')
  if (!country) return NextResponse.json({ error: 'Missing country' }, { status: 400 })

  try {
    const methods = await getShippingMethods({
      toCountry: country,
      weightGrams: weight ? Number(weight) : undefined,
    })
    return NextResponse.json({ configured: true, methods })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Rate lookup failed' }, { status: 500 })
  }
}
