export const metadata = { title: 'Returns & Refunds · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Returns & Refunds</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p>We want you to love every order. If something isn't right, you can return eligible items within 14 days of delivery.</p>
        <p>Fresh and perishable groceries cannot be returned for hygiene reasons, but if any item arrives damaged, spoiled, or incorrect, contact us within 48 hours for a full refund or replacement.</p>
        <p>To start a return, email <a className="text-saffron-600" href="mailto:support@spiceroute.example">support@spiceroute.example</a> with your order number. Refunds are issued to your original payment method within 5–10 business days.</p>
      </div>
    </div>
  )
}
