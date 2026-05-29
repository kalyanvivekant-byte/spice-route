import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { User, ShoppingBag, MapPin, Heart, Star, Settings } from 'lucide-react'

const accountNav = [
  { href: '/account/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/loyalty', label: 'Loyalty Points', icon: Star },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          <aside className="md:col-span-1">
            <nav className="space-y-1">
              {accountNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
      <Footer />
    </>
  )
}
