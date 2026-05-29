'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SLIDES = [
  {
    id: 1,
    title: 'Authentic Indian Groceries',
    subtitle: 'Delivered fresh across Europe – Netherlands, Germany, France & Belgium',
    cta: 'Shop Now',
    href: '/categories/flours-grains',
    bg: 'from-saffron-600 to-saffron-800',
    emoji: '🌶️',
  },
  {
    id: 2,
    title: 'Diwali Special Collection',
    subtitle: 'Stock up on sweets, snacks, and pooja essentials this festive season',
    cta: 'Explore Deals',
    href: '/categories/spices',
    bg: 'from-yellow-500 to-orange-600',
    emoji: '🪔',
  },
  {
    id: 3,
    title: 'Fresh Spices, Every Week',
    subtitle: 'MDH, Everest, Heera – all your favourite Indian spice brands',
    cta: 'Shop Spices',
    href: '/categories/spices',
    bg: 'from-red-600 to-red-800',
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
    <div className={`relative bg-gradient-to-r ${slide.bg} text-white overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex items-center">
        <div className="flex-1 space-y-4">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wide">
            Spice Route – Premium Indian Grocery
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">{slide.title}</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-xl">{slide.subtitle}</p>
          <div className="flex gap-3 pt-2">
            <Button size="lg" variant="secondary" className="rounded-full font-semibold" asChild>
              <Link href={slide.href}>{slide.cta}</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-white border-white hover:bg-white/10" asChild>
              <Link href="/register">Sign Up for €5 Off</Link>
            </Button>
          </div>
        </div>
        <div className="hidden md:flex text-[150px] ml-12 select-none" aria-hidden>
          {slide.emoji}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
