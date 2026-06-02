'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type Banner = {
  id: string
  title: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0)
  const n = banners.length

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => setI((p) => (p + 1) % n), 5000)
    return () => clearInterval(t)
  }, [n])

  if (n === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
          {banners.map((b) => {
            const inner = (
              <picture>
                {b.mobile_image_url && <source media="(max-width: 640px)" srcSet={b.mobile_image_url} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image_url} alt={b.title ?? ''} className="w-full h-auto object-cover" />
              </picture>
            )
            return (
              <div key={b.id} className="w-full shrink-0">
                {b.link_url ? <Link href={b.link_url}>{inner}</Link> : inner}
              </div>
            )
          })}
        </div>

        {n > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setI(idx)}
                aria-label={`Go to banner ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
