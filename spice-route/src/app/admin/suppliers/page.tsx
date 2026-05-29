import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminSuppliersPage() {
  const supabase = createAdminClient()
  const { data: suppliers, count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Suppliers ({count ?? 0})</h1>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Contact</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Lead time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {suppliers?.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-800/50 transition">
                <td className="p-4 text-white">{s.name}</td>
                <td className="p-4 text-gray-400">{s.contact_name ?? '–'}</td>
                <td className="p-4 text-gray-400">{s.email ?? '–'}</td>
                <td className="p-4 text-gray-400">{s.phone ?? '–'}</td>
                <td className="p-4 text-gray-400">{s.lead_time_days ?? 7} days</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!suppliers || suppliers.length === 0) && (
          <p className="p-6 text-gray-500 text-sm">No suppliers yet.</p>
        )}
      </div>
    </div>
  )
}
