export const metadata = { title: 'Contact Us · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p>Customer support is available Monday to Saturday, 9am–6pm CET.</p>
        <p>Email: <a className="text-saffron-600" href="mailto:support@spiceroute.example">support@spiceroute.example</a><br/>Phone: +31 20 123 4567</p>
        <p>Spice Route B.V., Keizersgracht 100, 1015 CW Amsterdam, Netherlands.</p>
      </div>
    </div>
  )
}
