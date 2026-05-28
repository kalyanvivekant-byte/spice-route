'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Heart, ShoppingCart, ChevronRight, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/vat'
import { ProductCard } from '@/components/product/ProductCard'
import toast from 'react-hot-toast'

export function ProductDetailClient({ product, related }: { product: any; related: any[] }) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0])
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'nutrition' | 'reviews' | 'qa'>('description')

  const images = product.images ?? []
  const currentImage = images[selectedImageIdx]
  const stock = selectedVariant?.inventory?.quantity ?? 0
  const inStock = stock > 0
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : 0

  function handleAddToCart() {
    if (!selectedVariant || !inStock) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      variantName: selectedVariant.name,
      price: selectedVariant.price_eur,
      quantity: qty,
      imageUrl: currentImage?.url ?? null,
      slug: product.slug,
      maxQuantity: stock,
    })
    toast.success('Added to cart!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {product.category && (
          <>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
            {currentImage ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt_text ?? product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🌶️</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition ${
                    i === selectedImageIdx ? 'border-saffron-500' : 'border-transparent'
                  }`}
                >
                  <Image src={img.url} alt={img.alt_text ?? ''} width={64} height={64} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {product.brand && (
            <p className="text-sm text-muted-foreground font-medium">{product.brand}</p>
          )}
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          {product.reviews?.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.reviews.length} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-saffron-600">
              {formatCurrency(selectedVariant?.price_eur ?? 0)}
            </span>
            {selectedVariant?.compare_at_price_eur && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCurrency(selectedVariant.compare_at_price_eur)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-destructive'}`}>
            {inStock ? (stock <= 5 ? `⚠️ Only ${stock} left` : `✓ In Stock`) : '✗ Out of Stock'}
          </div>

          {/* Variant picker */}
          {product.variants?.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-2">Size / Weight</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                      selectedVariant?.id === v.id
                        ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                        : 'border-border hover:border-saffron-300'
                    }`}
                  >
                    {v.name}
                    <span className="ml-1 text-muted-foreground">€{v.price_eur}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 hover:bg-muted transition"
              >–</button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="px-3 py-2 hover:bg-muted transition"
              >+</button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            <Button size="lg" variant="outline" className="px-3">
              <Heart className="h-5 w-5" />
            </Button>
          </div>

          {/* Dietary tags */}
          {product.dietary_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.dietary_tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium">
                  {tag === 'vegan' ? '🌱 Vegan' : tag === 'vegetarian' ? '🥗 Vegetarian' : tag === 'gluten_free' ? '🚫 Gluten-Free' : tag === 'halal' ? '☾ Halal' : tag === 'organic' ? '🌿 Organic' : tag}
                </span>
              ))}
            </div>
          )}

          {/* Allergens – EU FIC 1169/2011 */}
          {product.allergens?.length > 0 && (
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-amber-900">Allergen information: </span>
                <span className="text-amber-800">{product.allergens.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Meta */}
          <dl className="grid grid-cols-2 gap-2 text-sm border rounded-lg p-4">
            {product.country_of_origin && (
              <>
                <dt className="text-muted-foreground">Country of Origin</dt>
                <dd className="font-medium">{product.country_of_origin}</dd>
              </>
            )}
            {product.weight_grams && (
              <>
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="font-medium">{product.weight_grams >= 1000 ? `${product.weight_grams/1000}kg` : `${product.weight_grams}g`}</dd>
              </>
            )}
            {product.ean_barcode && (
              <>
                <dt className="text-muted-foreground">EAN</dt>
                <dd className="font-medium">{product.ean_barcode}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex border-b mb-6 gap-6">
          {(['description', 'nutrition', 'reviews', 'qa'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab ? 'border-saffron-500 text-saffron-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'qa' ? 'Q&A' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && product.reviews?.length > 0 && (
                <span className="ml-1 text-xs">({product.reviews.length})</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div>
            {product.nutritional_info ? (
              <table className="w-full max-w-sm text-sm border">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 border-b">Nutrient</th>
                    <th className="text-right p-2 border-b">Per 100g</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(product.nutritional_info)
                    .filter(([k]) => k !== 'per_100g')
                    .map(([key, val]) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="p-2 capitalize">{key.replace(/_/g, ' ')}</td>
                        <td className="p-2 text-right font-medium">{String(val)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground">Nutritional information not available.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {product.reviews?.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              product.reviews
                ?.filter((r: any) => r.is_approved)
                .map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="font-medium text-sm">{review.user?.full_name ?? 'Anonymous'}</span>
                      {review.is_verified_purchase && (
                        <span className="text-xs text-green-600 font-medium">✓ Verified Purchase</span>
                      )}
                    </div>
                    {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                    <p className="text-sm text-muted-foreground">{review.body}</p>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'qa' && (
          <p className="text-muted-foreground">No questions yet. Have a question? Contact us!</p>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
