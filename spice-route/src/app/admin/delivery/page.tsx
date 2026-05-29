import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'

export default async function AdminDeliveryPage() {
  const supabase = createAdminClient()
  const [{ data: zones }, { data: slots }] = await Promise.all([
    supabase.from('delivery_zones').select('*').order('name'),
    supabase
      .from('delivery_slots')
      .select('id, date, slot_label, capacity, booked, is_express, zone:delivery_zones(name)')
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date')
      .limit(50),
  ])

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Delivery</h1>

      <section>
        <h2 className="font-semibold mb-3">Zones</h2>
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Country</th>
                <th className="text-left p-4">Min order</th>
                <th className="text-left p-4">Fee</th>
                <th className="text-left p-4">Free above</th>
                <th className="text-left p-4">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {zones?.map((z: any) => (
                <tr key={z.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-white">{z.name}</td>
                  <td className="p-4 text-gray-400">{z.country_code}</td>
                  <td className="p-4 text-gray-400">{formatCurrency(z.min_order_eur ?? 0)}</td>
                  <td className="p-4 text-gray-400">{formatCurrency(z.delivery_fee_eur ?? 0)}</td>
                  <td className="p-4 text-gray-400">{formatCurrency(z.free_delivery_above_eur ?? 0)}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${z.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {z.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!zones || zones.length === 0) && <p className="p-6 text-gray-500 text-sm">No delivery zones configured.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Upcoming slots</h2>
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs">
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Slot</th>
                <th className="text-left p-4">Zone</th>
                <th className="text-left p-4">Booked / Capacity</th>
                <th className="text-left p-4">Express</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {slots?.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-white">{s.date}</td>
                  <td className="p-4 text-gray-400">{s.slot_label}</td>
                  <td className="p-4 text-gray-400">{s.zone?.name ?? '–'}</td>
                  <td className="p-4 text-gray-400">{s.booked} / {s.capacity}</td>
                  <td className="p-4 text-gray-400">{s.is_express ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!slots || slots.length === 0) && <p className="p-6 text-gray-500 text-sm">No upcoming slots.</p>}
        </div>
      </section>
    </div>
  )
}
