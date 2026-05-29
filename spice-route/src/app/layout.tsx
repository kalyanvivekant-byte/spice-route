import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ReactQueryProvider } from '@/components/shared/ReactQueryProvider'
import { CookieConsentBanner } from '@/components/shared/CookieConsentBanner'
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister'
import { InstallPrompt } from '@/components/shared/InstallPrompt'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
})

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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Spice Route',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <ReactQueryProvider>
          {children}
          <Toaster position="top-right" />
          <CookieConsentBanner />
          <ServiceWorkerRegister />
          <InstallPrompt />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
