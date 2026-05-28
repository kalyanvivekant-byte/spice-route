import { createAdminClient } from '@/lib/supabase/server'

export const POINTS_PER_EURO = 1
export const POINTS_TO_EURO = 0.01 // 100 points = €1

export async function awardLoyaltyPoints(
  userId: string,
  orderId: string,
  orderTotal: number
) {
  const points = Math.floor(orderTotal * POINTS_PER_EURO)
  if (points <= 0) return

  const supabase = createAdminClient()
  await supabase.from('loyalty_transactions').insert({
    user_id: userId,
    order_id: orderId,
    points,
    type: 'earn',
    description: `Points earned for order`,
  })
}

export async function redeemLoyaltyPoints(
  userId: string,
  orderId: string,
  points: number
) {
  const supabase = createAdminClient()
  const { data: balance } = await supabase
    .from('loyalty_transactions')
    .select('points')
    .eq('user_id', userId)

  const total = balance?.reduce((s, t) => s + t.points, 0) ?? 0
  if (total < points) throw new Error('Insufficient points')

  await supabase.from('loyalty_transactions').insert({
    user_id: userId,
    order_id: orderId,
    points: -points,
    type: 'redeem',
    description: `Points redeemed at checkout`,
  })

  return points * POINTS_TO_EURO
}

export async function getUserPoints(userId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('loyalty_transactions')
    .select('points')
    .eq('user_id', userId)

  return data?.reduce((s, t) => s + t.points, 0) ?? 0
}
