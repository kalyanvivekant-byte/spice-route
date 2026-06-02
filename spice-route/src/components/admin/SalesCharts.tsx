'use client'

import { formatCurrency } from '@/lib/vat'

type Daily = { label: string; revenue: number; orders: number }
type NamedValue = { name: string; revenue: number; units?: number }

export function SalesCharts({
  daily, categories, channels,
}: {
  daily: Daily[]
  categories: NamedValue[]
  channels: NamedValue[]
}) {
  const maxDaily = Math.max(1, ...daily.map((d) => d.revenue))
  const maxCat = Math.max(1, ...categories.map((c) => c.revenue))
  const totalChannel = Math.max(1, channels.reduce((s, c) => s + c.revenue, 0))
  const channelColors: Record<string, string> = { web: 'bg-saffron-500', pos: 'bg-emerald-500' }

  return (
    <div className="space-y-6">
      {/* Daily revenue */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold mb-4">Daily Revenue</h2>
        <div className="flex items-end gap-[3px] h-40">
          {daily.map((d, i) => (
            <div key={i} className="group relative flex-1 flex flex-col justify-end h-full">
              <div
                className="w-full bg-saffron-500/80 hover:bg-saffron-400 rounded-t transition-all"
                style={{ height: `${(d.revenue / maxDaily) * 100}%` }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-black text-white text-[10px] rounded px-1.5 py-0.5 z-10">
                {d.label}: {formatCurrency(d.revenue)} · {d.orders} ord
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-2">
          <span>{daily[0]?.label}</span>
          <span>{daily[daily.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by category */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Sales by Category</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No sales in this period.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs text-gray-300 mb-0.5">
                    <span className="truncate mr-2">{c.name}</span>
                    <span className="shrink-0 font-medium">{formatCurrency(c.revenue)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-saffron-500 rounded-full" style={{ width: `${(c.revenue / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel split */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Online vs In-store (POS)</h2>
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {channels.map((c) => (
              <div key={c.name} className={channelColors[c.name] ?? 'bg-gray-500'} style={{ width: `${(c.revenue / totalChannel) * 100}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {channels.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${channelColors[c.name] ?? 'bg-gray-500'}`} />
                  <span className="capitalize text-gray-300">{c.name === 'pos' ? 'In-store (POS)' : 'Online'}</span>
                </span>
                <span className="text-gray-300">
                  {formatCurrency(c.revenue)}{' '}
                  <span className="text-gray-500 text-xs">({((c.revenue / totalChannel) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
