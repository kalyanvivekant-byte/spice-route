import Link from 'next/link'

const CATEGORIES = [
  { name: 'Flours & Grains', slug: 'flours-grains', icon: '🌾', color: 'bg-amber-50 hover:bg-amber-100' },
  { name: 'Spices', slug: 'spices', icon: '🌶️', color: 'bg-red-50 hover:bg-red-100' },
  { name: 'Lentils & Pulses', slug: 'lentils-pulses', icon: '🫘', color: 'bg-orange-50 hover:bg-orange-100' },
  { name: 'Rice', slug: 'rice', icon: '🍚', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: 'Pickles & Chutneys', slug: 'pickles-chutneys', icon: '🫙', color: 'bg-green-50 hover:bg-green-100' },
  { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊', color: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'Beverages', slug: 'beverages', icon: '🫖', color: 'bg-teal-50 hover:bg-teal-100' },
  { name: 'Snacks', slug: 'snacks', icon: '🥜', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { name: 'Pooja Items', slug: 'pooja-items', icon: '🪔', color: 'bg-purple-50 hover:bg-purple-100' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', color: 'bg-pink-50 hover:bg-pink-100' },
  { name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬', color: 'bg-emerald-50 hover:bg-emerald-100' },
]

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/categories/${cat.slug}`}
          className={`${cat.color} rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors group`}
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
          <span className="text-xs font-medium text-center leading-tight text-gray-700">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
