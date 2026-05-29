import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ReactQueryProvider } from '@/components/shared/ReactQueryProvider'
import { CookieConsentBanner } from '@/components/shared/CookieConsentBanner'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Spice Route – Indian Groceries in Europe', template: '%s | Spice Route' },
  description:
    'Shop authentic Indian groceries online. Fresh spices, lentils, flours, rice, and more delivered across Europe.',
  keywords: ['indian groceries', 'spices', 'lentils', 'basmati rice', 'atta', 'european delivery'],
  openGraph: {
    type: 'website',
    locale: 'en_EU',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Spice Route',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReactQueryProvider>
          {children}
          <Toaster position="top-right" />
          <CookieConsentBanner />
        </ReactQueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
