export const metadata = { title: 'Delivery Information · Spice Route' }

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Delivery Information</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground leading-relaxed">
        <p>We deliver across the Netherlands, Belgium, Germany, and France. Orders placed before 2pm are eligible for next-day delivery in most postcodes.</p>
        <p>Standard delivery is €4.99 and free on orders over €50. Express same-day slots are available in selected zones for €5.</p>
        <p>You can choose your preferred delivery slot at checkout. Track your order live from the My Orders page once it is out for delivery.</p>
      </div>
    </div>
  )
}
