import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/vat'
import { format } from 'date-fns'
import { CustomerNotes } from '@/components/admin/CustomerNotes'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data: customer } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at, admin_notes, referral_code')
    .eq('id', params.id)
    .single()
  if (!customer) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total_eur, status, created_at')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const valid = (orders ?? []).filter((o) => !['pending_payment', 'cancelled'].includes(o.status))
  const lifetime = valid.reduce((s, o) => s + Number(o.total_eur), 0)
  const aov = valid.length ? lifetime / valid.length : 0

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <Link href="/admin/customers" className="text-sm text-saffron-400 hover:underline">← Customers</Link>

      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold">{customer.full_name ?? 'Customer'}</h1>
        <p className="text-sm text-gray-400">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</p>
        <p className="text-xs text-gray-500 mt-1">
          Joined {format(new Date(customer.created_at), 'dd MMM yyyy')} · {customer.role}
          {customer.referral_code ? ` · ref ${customer.referral_code}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Lifetime spend', value: formatCurrency(lifetime) },
          { label: 'Orders', value: valid.length.toString() },
          { label: 'Avg order', value: formatCurrency(aov) },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Order history</h2>
          {(orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-800">
                {orders!.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-800/50">
                    <td className="py-2"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-saffron-400 hover:underline">#{o.order_number}</Link></td>
                    <td className="py-2 text-gray-400 text-xs">{format(new Date(o.created_at), 'dd MMM yyyy')}</td>
                    <td className="py-2"><span className="text-xs bg-gray-700 px-2 py-0.5 rounded capitalize">{o.status.replace(/_/g, ' ')}</span></td>
                    <td className="py-2 text-right font-medium">{formatCurrency(o.total_eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <CustomerNotes customerId={customer.id} initial={customer.admin_notes} />
      </div>
    </div>
  )
}
