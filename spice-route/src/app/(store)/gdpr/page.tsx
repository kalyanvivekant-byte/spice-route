export const metadata = { title: 'GDPR / Data Rights · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">GDPR / Data Rights</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p>Under the GDPR you have the right to access, rectify, port, restrict, and erase your personal data, and to object to processing.</p>
        <p>To exercise any of these rights, email <a className="text-saffron-600" href="mailto:privacy@spiceroute.example">privacy@spiceroute.example</a> and we will respond within 30 days.</p>
        <p>Our Data Protection Officer can be reached at the same address.</p>
      </div>
    </div>
  )
}
