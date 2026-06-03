'use client'

import { useEffect } from 'react'
import { Printer } from 'lucide-react'

export function PrintTrigger({ auto = true }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [auto])

  return (
    <button onClick={() => window.print()} className="print:hidden inline-flex items-center gap-1.5 bg-saffron-500 hover:bg-saffron-600 text-white text-sm px-3 py-1.5 rounded">
      <Printer className="h-4 w-4" /> Print
    </button>
  )
}
