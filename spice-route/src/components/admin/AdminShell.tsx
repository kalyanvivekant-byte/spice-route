'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, BarChart2, Truck, Users, Settings, Warehouse, Building2, Menu, X, ScanLine, LayoutGrid, Image, Tag,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS Register', icon: ScanLine },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
  { href: '/admin/collections', label: 'Collections', icon: LayoutGrid },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Building2 },
  { href: '/admin/delivery', label: 'Delivery', icon: Truck },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminShell({ children, userLabel }: { children: React.ReactNode; userLabel: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const SidebarBody = (
    <>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 font-bold text-white">
          <span className="text-xl">🌶️</span>
          <span className="text-sm">Spice Route Admin</span>
        </Link>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-white" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? 'bg-saffron-500/15 text-saffron-300' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 truncate">{userLabel}</div>
        <Link href="/" className="text-xs text-saffron-400 hover:underline mt-1 block">← Back to store</Link>
      </div>
    </>
  )

  return (
    <div className="md:flex md:h-screen bg-gray-950">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-gray-900 text-white px-4 h-14 border-b border-gray-800">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-gray-200 hover:text-white">
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span className="text-lg">🌶️</span>
          <span className="text-sm">Spice Route Admin</span>
        </Link>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-gray-900 text-gray-200 flex-col shrink-0">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-gray-900 text-gray-200 flex flex-col">
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:overflow-auto bg-gray-950 text-white">
        {children}
      </main>
    </div>
  )
}
