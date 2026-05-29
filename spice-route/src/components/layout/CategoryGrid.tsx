import Link from 'next/link'

const CATEGORIES = [
  { name: 'Flours & Grains', slug: 'flours-grains', icon: '🌾', color: 'from-amber-100 to-amber-50 border-amber-200' },
  { name: 'Spices', slug: 'spices', icon: '🌶️', color: 'from-red-100 to-red-50 border-red-200' },
  { name: 'Lentils & Pulses', slug: 'lentils-pulses', icon: '🫘', color: 'from-orange-100 to-orange-50 border-orange-200' },
  { name: 'Rice', slug: 'rice', icon: '🍚', color: 'from-yellow-100 to-yellow-50 border-yellow-200' },
  { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', icon: '🫙', color: 'from-lime-100 to-lime-50 border-lime-200' },
  { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊', color: 'from-sky-100 to-sky-50 border-sky-200' },
  { name: 'Beverages', slug: 'beverages', icon: '🫖', color: 'from-teal-100 to-teal-50 border-teal-200' },
  { name: 'Snacks', slug: 'snacks', icon: '🥜', color: 'from-amber-100 to-yellow-50 border-amber-200' },
  { name: 'Pooja Items', slug: 'pooja-items', icon: '🪔', color: 'from-purple-100 to-purple-50 border-purple-200' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', color: 'from-pink-100 to-pink-50 border-pink-200' },
  { name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬', color: 'from-emerald-100 to-emerald-50 border-emerald-200' },
]

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className={`card-lift bg-gradient-to-b ${cat.color} border rounded-2xl p-4 flex flex-col items-center gap-2 group`}
        >
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
          <span className="text-xs font-semibold text-center leading-tight text-gray-700">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
