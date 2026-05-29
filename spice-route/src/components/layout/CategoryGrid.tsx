import Link from 'next/link'

const CATEGORIES = [
  { name: 'Flours & Grains', slug: 'flours-grains', icon: '🌾', badge: 'bg-amber-100 text-amber-700' },
  { name: 'Spices', slug: 'spices', icon: '🌶️', badge: 'bg-red-100 text-red-700' },
  { name: 'Lentils & Pulses', slug: 'lentils-pulses', icon: '🫘', badge: 'bg-orange-100 text-orange-700' },
  { name: 'Rice', slug: 'rice', icon: '🍚', badge: 'bg-yellow-100 text-yellow-700' },
  { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', icon: '🫙', badge: 'bg-lime-100 text-lime-700' },
  { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊', badge: 'bg-sky-100 text-sky-700' },
  { name: 'Beverages', slug: 'beverages', icon: '🫖', badge: 'bg-teal-100 text-teal-700' },
  { name: 'Snacks', slug: 'snacks', icon: '🥜', badge: 'bg-amber-100 text-amber-700' },
  { name: 'Pooja Items', slug: 'pooja-items', icon: '🪔', badge: 'bg-purple-100 text-purple-700' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', badge: 'bg-pink-100 text-pink-700' },
  { name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬', badge: 'bg-emerald-100 text-emerald-700' },
]

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white border border-saffron-100/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-saffron-300"
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:scale-110 ${cat.badge}`}
          >
            {cat.icon}
          </span>
          <span className="text-xs font-semibold text-center leading-tight text-gray-700 group-hover:text-saffron-700 transition-colors">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
