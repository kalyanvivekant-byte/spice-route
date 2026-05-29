import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPoints } from '@/lib/loyalty'
import { POINTS_TO_EURO } from '@/lib/loyalty'
import { format } from 'date-fns'

export default async function LoyaltyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [points, transactionsResult, profile] = await Promise.all([
    getUserPoints(user.id),
    supabase.from('loyalty_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('referral_code').eq('id', user.id).single(),
  ])

  const transactions = transactionsResult.data ?? []
  const euroValue = points * POINTS_TO_EURO
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${profile.data?.referral_code}`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Loyalty Points</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-2xl p-6 mb-8">
        <p className="text-sm font-medium opacity-80">Your Balance</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-5xl font-bold">{points.toLocaleString()}</span>
          <span className="text-lg opacity-80">points</span>
        </div>
        <p className="text-sm opacity-90 mt-1">= €{euroValue.toFixed(2)} to redeem</p>
        <div className="mt-4 text-xs opacity-75">
          Earn 1 point per €1 spent · Redeem 100 points = €1 off
        </div>
      </div>

      {/* Referral */}
      <div className="border rounded-2xl p-5 mb-8">
        <h2 className="font-semibold mb-2">Refer a Friend – Earn €5!</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Share your unique link. When a friend makes their first order, you both get €5 credit.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralLink}
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-muted/50"
          />
          <button
            className="px-4 py-2 bg-saffron-500 text-white rounded-lg text-sm font-medium hover:bg-saffron-600 transition"
            onClick={() => {
              if (typeof navigator !== 'undefined') navigator.clipboard.writeText(referralLink)
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions yet. Start shopping to earn points!</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>
                </div>
                <span className={`font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.points > 0 ? '+' : ''}{t.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
