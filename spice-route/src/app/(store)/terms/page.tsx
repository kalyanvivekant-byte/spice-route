export const metadata = { title: 'Terms & Conditions · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p>By using Spice Route you agree to these terms. All orders are subject to availability and acceptance.</p>
        <p>Prices include applicable VAT. We reserve the right to correct pricing errors. Risk passes to you on delivery.</p>
        <p>These terms are governed by the laws of the Netherlands.</p>
      </div>
    </div>
  )
}
