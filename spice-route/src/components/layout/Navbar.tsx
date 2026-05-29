'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { SearchBar } from '@/components/layout/SearchBar'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const categories = [
  { name: 'Flours & Grains', slug: 'flours-grains', icon: '🌾' },
  { name: 'Spices', slug: 'spices', icon: '🌶️' },
  { name: 'Lentils & Pulses', slug: 'lentils-pulses', icon: '🫘' },
  { name: 'Rice', slug: 'rice', icon: '🍚' },
  { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', icon: '🫙' },
  { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊' },
  { name: 'Beverages', slug: 'beverages', icon: '🫖' },
  { name: 'Snacks', slug: 'snacks', icon: '🥜' },
  { name: 'Pooja Items', slug: 'pooja-items', icon: '🪔' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴' },
  { name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬' },
]

export function Navbar() {
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()
  const count = itemCount()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky-header border-b">
        {/* Top bar */}
        <div className="bg-gradient-spice text-white text-xs py-1.5 text-center font-medium tracking-wide">
          🚚 Free delivery on orders over €50 · Serving Netherlands, Germany, France &amp; Belgium
        </div>

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-xl shrink-0">
            <span className="text-2xl">🌶️</span>
            <span className="text-gradient-spice">Spice Route</span>
          </Link>

          {/* Search */}
          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/wishlist">Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/loyalty">Loyalty Points</Link>
                    </DropdownMenuItem>
                    {user.email && process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').includes(user.email) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">Create Account</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-saffron-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Category nav — pill strip, desktop only (mobile uses the menu) */}
        <nav className="hidden md:block border-t bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex flex-wrap gap-2 py-2.5 text-sm">
              <li className="shrink-0">
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 rounded-full bg-gradient-spice text-white px-3.5 py-1.5 font-semibold whitespace-nowrap shadow-sm hover:opacity-90 transition"
                >
                  <span>🛍️</span>
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug} className="shrink-0">
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="flex items-center gap-1.5 rounded-full border border-saffron-100 bg-white px-3.5 py-1.5 text-gray-600 whitespace-nowrap hover:border-saffron-300 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3">
            <SearchBar />
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            <Link
              href="/products"
              className="flex items-center gap-2 py-2 text-sm font-semibold text-saffron-600 hover:text-saffron-700"
              onClick={() => setMobileOpen(false)}
            >
              <span>🛍️</span>
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-saffron-600"
                onClick={() => setMobileOpen(false)}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  )
}
