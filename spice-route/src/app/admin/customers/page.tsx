import { createAdminClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function AdminCustomersPage() {
  const supabase = createAdminClient()
  const { data: customers, count } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers ({count ?? 0})</h1>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {customers?.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-800/50 transition">
                <td className="p-4 text-white"><Link href={`/admin/customers/${c.id}`} className="text-saffron-400 hover:underline">{c.full_name ?? '–'}</Link></td>
                <td className="p-4 text-gray-400">{c.email}</td>
                <td className="p-4 text-gray-400">{c.phone ?? '–'}</td>
                <td className="p-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      c.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : c.role === 'driver'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {c.role}
                  </span>
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {format(new Date(c.created_at), 'dd MMM yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!customers || customers.length === 0) && (
          <p className="p-6 text-gray-500 text-sm">No customers yet.</p>
        )}
      </div>
    </div>
  )
}
