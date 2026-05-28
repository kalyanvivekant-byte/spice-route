// Auto-detects upcoming Indian festivals and shows a promotional banner

const FESTIVALS: { name: string; emoji: string; month: number; day: number; message: string }[] = [
  { name: 'Diwali', emoji: '🪔', month: 10, day: 20, message: 'Stock up for Diwali! Sweets, dry fruits & pooja essentials' },
  { name: 'Holi', emoji: '🎨', month: 3, day: 10, message: 'Celebrate Holi with authentic colours and sweets!' },
  { name: 'Eid', emoji: '🌙', month: 4, day: 1, message: 'Eid Mubarak! Special deals on biryani, halal products & more' },
  { name: 'Navratri', emoji: '🌺', month: 10, day: 3, message: 'Navratri specials – fasting foods, sabudana, and more' },
  { name: 'Onam', emoji: '🌸', month: 9, day: 5, message: 'Happy Onam! Kerala specialties and payasam ingredients' },
]

function getUpcomingFestival() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()

  for (const festival of FESTIVALS) {
    const diffDays =
      (festival.month - currentMonth) * 30 + (festival.day - currentDay)
    if (diffDays >= 0 && diffDays <= 30) return festival
  }
  return null
}

export function FestivalBanner() {
  const festival = getUpcomingFestival()
  if (!festival) return null

  return (
    <div className="bg-gradient-to-r from-turmeric-500 to-saffron-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium">
        <span className="text-2xl">{festival.emoji}</span>
        <p>{festival.message}</p>
        <span className="text-2xl">{festival.emoji}</span>
      </div>
    </div>
  )
}
