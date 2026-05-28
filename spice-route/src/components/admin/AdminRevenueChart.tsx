'use client'

import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subDays } from 'date-fns'

async function fetchRevenueData() {
  const res = await fetch('/api/admin/analytics/revenue')
  return res.json()
}

export function AdminRevenueChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: fetchRevenueData,
  })

  if (isLoading) return <div className="h-48 skeleton rounded-lg" />

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `€${v}`} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          formatter={(v: number) => [`€${v.toFixed(2)}`, 'Revenue']}
        />
        <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revenue)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
