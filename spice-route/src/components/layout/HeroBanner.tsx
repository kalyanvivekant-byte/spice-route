'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SLIDES = [
  {
    id: 1,
    eyebrow: 'Premium Indian Grocery',
    title: 'Authentic Indian Groceries',
    subtitle: 'Delivered fresh across Europe – Netherlands, Germany, France & Belgium',
    cta: 'Shop Now',
    href: '/categories/flours-grains',
    bg: 'from-saffron-500 via-saffron-600 to-saffron-800',
    emoji: '🌶️',
  },
  {
    id: 2,
    eyebrow: 'Festive Season',
    title: 'Diwali Special Collection',
    subtitle: 'Stock up on sweets, snacks, and pooja essentials this festive season',
    cta: 'Explore Deals',
    href: '/categories/spices',
    bg: 'from-amber-500 via-orange-600 to-rose-600',
    emoji: '🪔',
  },
  {
    id: 3,
    eyebrow: 'Fresh Every Week',
    title: 'Fresh Spices, Every Week',
    subtitle: 'MDH, Everest, Heera – all your favourite Indian spice brands',
    cta: 'Shop Spices',
    href: '/categories/spices',
    bg: 'from-rose-600 via-red-700 to-amber-700',
    emoji: '🫚',
  },
]

export function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[current]

  return (
    <div className={`relative bg-gradient-to-br ${slide.bg} text-white overflow-hidden transition-[background] duration-700`}>
      {/* Decorative dotted texture */}
      <div className="absolute inset-0 pattern-dots opacity-40" aria-hidden />
      {/* Glow blobs */}
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 flex items-center">
        <div className="flex-1 space-y-5">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full ring-1 ring-white/25">
            ✦ {slide.eyebrow}
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[1.05] drop-shadow-sm">{slide.title}</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl">{slide.subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="rounded-full font-semibold bg-white text-saffron-700 hover:bg-amber-50 shadow-lg shadow-black/10" asChild>
              <Link href={slide.href}>{slide.cta} →</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-white border-white/70 bg-white/0 hover:bg-white/15" asChild>
              <Link href="/register">Sign Up for €5 Off</Link>
            </Button>
          </div>
        </div>
        <div className="hidden md:flex text-[160px] ml-12 select-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.25)] animate-[float_6s_ease-in-out_infinite]" aria-hidden>
          {slide.emoji}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>

      {/* Prev/Next */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
