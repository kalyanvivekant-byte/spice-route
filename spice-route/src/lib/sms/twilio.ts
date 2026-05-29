import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !sid.startsWith('AC') || !token) return null
  return twilio(sid, token)
}

const FROM = process.env.TWILIO_PHONE_NUMBER!

export async function sendSMS(to: string, message: string) {
  const client = getClient()
  if (!client) {
    console.warn('SMS: Twilio not configured, skipping')
    return
  }
  if (!to.startsWith('+')) {
    console.warn('SMS: phone number must be in E.164 format')
    return
  }
  try {
    await client.messages.create({ body: message, from: FROM, to })
  } catch (err) {
    console.error('SMS send failed', err)
  }
}

export async function notifyOrderStatus(
  phone: string,
  orderNumber: string,
  status: string
) {
  const messages: Record<string, string> = {
    received: `Spice Route: Order #${orderNumber} received ✓ We'll start picking it shortly.`,
    picking: `Spice Route: Order #${orderNumber} is being picked and packed 📦`,
    packed: `Spice Route: Order #${orderNumber} is packed and ready for dispatch!`,
    out_for_delivery: `Spice Route: Order #${orderNumber} is out for delivery 🚚 Check your email for tracking.`,
    delivered: `Spice Route: Order #${orderNumber} delivered! Enjoy 🌶️ Rate us: ${process.env.NEXT_PUBLIC_APP_URL}/review`,
  }
  const msg = messages[status]
  if (msg) await sendSMS(phone, msg)
}
