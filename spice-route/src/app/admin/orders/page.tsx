import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { OrdersTable } from '@/components/admin/OrdersTable'

const STATUS_PIPELINE = ['received', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; q?: string; from?: string; to?: string }
}) {
  const supabase = createAdminClient()
  const status = searchParams.status ?? ''
  const q = searchParams.q?.trim() ?? ''
  const from = searchParams.from ?? ''
  const to = searchParams.to ?? ''
  const page = parseInt(searchParams.page ?? '1')
  const limit = 50

  let query = supabase
    .from('orders')
    .select('*, items:order_items(product_name, quantity)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`order_number.ilike.%${q}%,guest_email.ilike.%${q}%`)
  if (from) query = query.gte('created_at', new Date(`${from}T00:00:00`).toISOString())
  if (to) query = query.lte('created_at', new Date(`${to}T23:59:59`).toISOString())

  const { data: orders, count } = await query
  const qsFor = (s: string) => {
    const p = new URLSearchParams()
    if (s) p.set('status', s)
    if (q) p.set('q', q)
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    const str = p.toString()
    return `/admin/orders${str ? '?' + str : ''}`
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-gray-400 text-sm">{count?.toLocaleString()} total</span>
      </div>

      {/* Search + date filter */}
      <form method="get" className="flex flex-wrap items-end gap-2 mb-4">
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Search</label>
          <input name="q" defaultValue={q} placeholder="Order # or email"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-saffron-500 w-56" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">From</label>
          <input type="date" name="from" defaultValue={from} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-saffron-500" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">To</label>
          <input type="date" name="to" defaultValue={to} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-saffron-500" />
        </div>
        <button className="bg-saffron-500 hover:bg-saffron-600 text-white text-sm px-4 py-1.5 rounded-lg">Filter</button>
        {(q || from || to) && (
          <Link href={status ? `/admin/orders?status=${status}` : '/admin/orders'} className="text-sm text-gray-400 hover:text-white px-2 py-1.5">Clear</Link>
        )}
      </form>

      {/* Pipeline filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={qsFor('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!status ? 'bg-saffron-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>All</Link>
        {STATUS_PIPELINE.map((s) => (
          <Link key={s} href={qsFor(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${status === s ? 'bg-saffron-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <OrdersTable orders={(orders as any) ?? []} />
    </div>
  )
}
