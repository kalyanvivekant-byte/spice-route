import { createAdminClient } from '@/lib/supabase/server'
import { NotificationTester } from '@/components/admin/NotificationTester'

export default async function AdminSettingsPage() {
  const supabase = createAdminClient()
  const [{ count: products }, { count: categories }, { count: promos }] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('promo_codes').select('id', { count: 'exact', head: true }),
  ])

  const env = (k: string) => (process.env[k] ? 'Configured' : 'Not set')

  const integrations = [
    { name: 'Supabase', status: env('NEXT_PUBLIC_SUPABASE_URL') },
    { name: 'Stripe (secret key)', status: env('STRIPE_SECRET_KEY') },
    { name: 'Stripe webhook', status: env('STRIPE_WEBHOOK_SECRET') },
    { name: 'Resend (email)', status: env('RESEND_API_KEY') },
    { name: 'Twilio (SMS)', status: env('TWILIO_AUTH_TOKEN') },
    { name: 'Admin emails', status: env('NEXT_PUBLIC_ADMIN_EMAILS') },
  ]

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section>
        <h2 className="font-semibold mb-3">Store overview</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Products', value: products ?? 0 },
            { label: 'Categories', value: categories ?? 0 },
            { label: 'Promo codes', value: promos ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Integrations</h2>
        <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center justify-between p-4 text-sm">
              <span className="text-gray-300">{i.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  i.status === 'Configured'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {i.status}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Manage these values as environment variables in your hosting provider.
        </p>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Test email &amp; SMS</h2>
        <p className="text-xs text-gray-500 mb-3">Sends a real test and shows the provider’s exact response — use this to diagnose delivery issues.</p>
        <NotificationTester />
      </section>
    </div>
  )
}
