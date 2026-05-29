export const metadata = { title: 'Frequently Asked Questions · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p><strong>Which areas do you deliver to?</strong><br/>The Netherlands, Belgium, Germany, and France.</p>
        <p><strong>What is the minimum order?</strong><br/>€30 for delivery; free delivery over €50.</p>
        <p><strong>How do loyalty points work?</strong><br/>Earn 1 point per €1 spent; 100 points = €1 off.</p>
        <p><strong>Are your products authentic?</strong><br/>Yes — we source directly from trusted brands and importers.</p>
      </div>
    </div>
  )
}
