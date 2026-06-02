'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

type Child = { name: string; slug: string }
type TopCat = { name: string; slug: string; icon: string; children: Child[] }

export function Navbar() {
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()
  const count = itemCount()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [tree, setTree] = useState<TopCat[]>(() => categories.map((c) => ({ ...c, children: [] })))
  const [openMobileCat, setOpenMobileCat] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, slug, parent_id, sort_order')
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return
        const bySlug = new Map(data.map((c: any) => [c.slug, c]))
        const childrenByParent = new Map<string, Child[]>()
        for (const c of data as any[]) {
          if (!c.parent_id) continue
          const arr = childrenByParent.get(c.parent_id) ?? []
          arr.push({ name: c.name, slug: c.slug })
          childrenByParent.set(c.parent_id, arr)
        }
        setTree(
          categories.map((top) => {
            const dbCat = bySlug.get(top.slug) as any
            const kids = (dbCat ? childrenByParent.get(dbCat.id) ?? [] : []).sort(
              (a, b) => a.name.localeCompare(b.name)
            )
            return { ...top, children: kids }
          })
        )
      })
  }, [])

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
              <li className="shrink-0">
                <Link
                  href="/collections/bestsellers"
                  className="flex items-center gap-1.5 rounded-full border border-saffron-100 bg-white px-3.5 py-1.5 text-gray-600 whitespace-nowrap hover:border-saffron-300 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                >
                  <span>⭐</span>
                  Bestsellers
                </Link>
              </li>
              <li className="shrink-0">
                <Link
                  href="/collections/new-arrivals"
                  className="flex items-center gap-1.5 rounded-full border border-saffron-100 bg-white px-3.5 py-1.5 text-gray-600 whitespace-nowrap hover:border-saffron-300 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                >
                  <span>🆕</span>
                  New Arrivals
                </Link>
              </li>
              <li className="shrink-0">
                <Link
                  href="/collections/bundles"
                  className="flex items-center gap-1.5 rounded-full border border-saffron-100 bg-white px-3.5 py-1.5 text-gray-600 whitespace-nowrap hover:border-saffron-300 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                >
                  <span>🎁</span>
                  Bundles
                </Link>
              </li>
              {tree.map((cat) => (
                <li key={cat.slug} className="shrink-0 relative group">
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="flex items-center gap-1.5 rounded-full border border-saffron-100 bg-white px-3.5 py-1.5 text-gray-600 whitespace-nowrap hover:border-saffron-300 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                    {cat.children.length > 0 && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                  </Link>
                  {cat.children.length > 0 && (
                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                      <div className="min-w-[220px] rounded-xl border border-saffron-100 bg-white shadow-lg p-2">
                        <Link
                          href={`/categories/${cat.slug}`}
                          className="block px-3 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50 rounded-lg"
                        >
                          All {cat.name} →
                        </Link>
                        {cat.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/categories/${child.slug}`}
                            className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-saffron-50 hover:text-saffron-700 rounded-lg"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
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
            <Link href="/collections/bestsellers" className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-saffron-600" onClick={() => setMobileOpen(false)}>
              <span>⭐</span> Bestsellers
            </Link>
            <Link href="/collections/new-arrivals" className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-saffron-600" onClick={() => setMobileOpen(false)}>
              <span>🆕</span> New Arrivals
            </Link>
            {tree.map((cat) => (
              <div key={cat.slug}>
                <div className="flex items-center">
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-saffron-600 flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <button
                      aria-label={`Toggle ${cat.name}`}
                      onClick={() => setOpenMobileCat(openMobileCat === cat.slug ? null : cat.slug)}
                      className="p-2 text-gray-400"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${openMobileCat === cat.slug ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {openMobileCat === cat.slug && cat.children.length > 0 && (
                  <div className="ml-7 border-l border-saffron-100 pl-3 pb-1">
                    {cat.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/categories/${child.slug}`}
                        className="block py-1.5 text-sm text-gray-500 hover:text-saffron-600"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  )
}
