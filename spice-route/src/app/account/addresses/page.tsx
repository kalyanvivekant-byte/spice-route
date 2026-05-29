import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AddressesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/account/addresses')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Addresses</h1>

      {!addresses?.length ? (
        <div className="text-center py-16 border rounded-2xl">
          <div className="text-5xl mb-4">📍</div>
          <p className="text-muted-foreground">No saved addresses yet.</p>
          <p className="text-muted-foreground text-sm mt-1">
            You can add a delivery address during checkout.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a: any) => (
            <div key={a.id} className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{a.label || 'Address'}</span>
                {a.is_default && (
                  <span className="text-xs bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {a.first_name} {a.last_name}<br />
                {a.street_line1}{a.street_line2 ? `, ${a.street_line2}` : ''}<br />
                {a.postal_code} {a.city}, {a.country_code}
                {a.phone && <><br />{a.phone}</>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
