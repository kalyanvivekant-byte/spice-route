import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['en', 'nl', 'de', 'fr']
const defaultLocale = 'en'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const response = await updateSession(request)
    // Additional admin check is done in the admin layout server component
    return response
  }

  // Update Supabase session
  const supabaseResponse = await updateSession(request)

  // Apply intl middleware
  const intlResponse = intlMiddleware(request)

  // Merge cookies from supabase response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
