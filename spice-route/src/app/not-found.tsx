import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">🌶️</div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="bg-saffron-500 hover:bg-saffron-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Back to home
        </Link>
        <Link
          href="/products"
          className="border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition"
        >
          Browse products
        </Link>
      </div>
    </div>
  )
}
