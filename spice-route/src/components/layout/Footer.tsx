import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🌶️</span>
            <span className="text-white font-bold text-lg">Spice Route</span>
          </div>
          <p className="text-sm">
            Authentic Indian groceries delivered fresh across Europe.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Facebook" className="hover:text-white transition">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white transition">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Shop</h3>
          <ul className="space-y-2 text-sm">
            {['Flours & Grains', 'Spices', 'Lentils & Pulses', 'Rice', 'Snacks', 'Beverages'].map((c) => (
              <li key={c}>
                <Link href={`/categories/${c.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="hover:text-white transition">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Customer Service</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/account/orders" className="hover:text-white transition">Track Order</Link></li>
            <li><Link href="/returns" className="hover:text-white transition">Returns & Refunds</Link></li>
            <li><Link href="/delivery" className="hover:text-white transition">Delivery Info</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
            <li><Link href="/gdpr" className="hover:text-white transition">GDPR / Data Rights</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Spice Route BV. All rights reserved.</p>
          <div className="flex gap-4">
            <span>KvK: 12345678</span>
            <span>VAT No: NL123456789B01</span>
          </div>
          <div className="flex gap-2">
            {/* Payment icons */}
            {['Visa', 'MC', 'iDEAL', 'SEPA', 'Bancontact'].map((p) => (
              <span key={p} className="border border-gray-700 rounded px-1.5 py-0.5 text-xs">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
