import { Resend } from 'resend'
import type { Order } from '@/types'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key === 're_placeholder') return null
  return new Resend(key)
}
const FROM = `Spice Route <${process.env.RESEND_FROM_EMAIL ?? 'noreply@spiceroute.eu'}>`

export async function sendOrderConfirmation(order: Order, email: string) {
  const itemsHtml = order.items
    ?.map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${i.product_name} – ${i.variant_name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${i.quantity}x €${i.unit_price_eur.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  const resend = getResend(); if (!resend) return; await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Order Confirmed – #${order.order_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#f97316;padding:24px;text-align:center">
          <h1 style="color:white;margin:0">🌶️ Spice Route</h1>
        </div>
        <div style="padding:24px">
          <h2>Your order is confirmed!</h2>
          <p>Order number: <strong>#${order.order_number}</strong></p>
          <table style="width:100%;border-collapse:collapse">
            ${itemsHtml}
          </table>
          <div style="margin-top:16px;text-align:right">
            <p>Subtotal: €${order.subtotal_eur.toFixed(2)}</p>
            <p>Delivery: €${order.delivery_fee_eur.toFixed(2)}</p>
            <p>VAT: €${order.vat_eur.toFixed(2)}</p>
            <p><strong>Total: €${order.total_eur.toFixed(2)}</strong></p>
          </div>
          <p style="margin-top:24px">We'll send you an update when your order is out for delivery.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}"
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
            Track Order
          </a>
        </div>
        <div style="padding:16px;background:#f9f9f9;font-size:12px;color:#666;text-align:center">
          <p>Spice Route BV · KvK 12345678 · VAT NL123456789B01</p>
          <p>Questions? Reply to this email or contact support@spiceroute.eu</p>
        </div>
      </div>
    `,
  })
}

export async function sendOrderDispatched(order: Order, email: string, trackingUrl?: string) {
  const resend = getResend(); if (!resend) return; await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Your order #${order.order_number} is on its way!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#f97316;padding:24px;text-align:center">
          <h1 style="color:white;margin:0">🌶️ Spice Route</h1>
        </div>
        <div style="padding:24px">
          <h2>🚚 Your order is out for delivery!</h2>
          <p>Order #${order.order_number} is on its way to you.</p>
          ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Track Live</a>` : ''}
        </div>
      </div>
    `,
  })
}

export async function sendRefundConfirmation(order: Order, email: string, amount: number) {
  const resend = getResend(); if (!resend) return; await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Refund processed for order #${order.order_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="padding:24px">
          <h2>Refund Processed</h2>
          <p>We've issued a refund of <strong>€${amount.toFixed(2)}</strong> for order #${order.order_number}.</p>
          <p>This should appear on your statement within 5–10 business days.</p>
        </div>
      </div>
    `,
  })
}

export async function sendBackInStockAlert(
  productName: string,
  productUrl: string,
  email: string
) {
  const resend = getResend(); if (!resend) return; await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${productName} is back in stock!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="padding:24px">
          <h2>🎉 Back in stock: ${productName}</h2>
          <p>The item you've been waiting for is available again. Get it before it sells out!</p>
          <a href="${productUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">Shop Now</a>
        </div>
      </div>
    `,
  })
}
