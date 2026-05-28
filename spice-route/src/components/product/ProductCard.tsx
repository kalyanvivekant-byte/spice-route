'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/vat'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product & {
    min_price?: number
    primary_image?: string
    avg_rating?: number
    review_count?: number
    stock?: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const variant = product.variants?.[0]
  const price = product.min_price ?? variant?.price_eur ?? 0
  const image = product.primary_image ?? product.images?.[0]?.url
  const inStock = (product.stock ?? product.inventory?.quantity ?? 0) > 0
  const isLowStock = (product.stock ?? product.inventory?.quantity ?? 0) <= 5 && inStock
  const hasDiscount = variant?.compare_at_price_eur && variant.compare_at_price_eur > price

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!variant) return
    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      variantName: variant.name,
      price: variant.price_eur,
      quantity: 1,
      imageUrl: image ?? null,
      slug: product.slug,
      maxQuantity: product.inventory?.quantity ?? 10,
    })
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🌶️</div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <span className="bg-saffron-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {hasDiscount && (
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Sale
              </span>
            )}
            {product.expiry_discount && (
              <span className="bg-yellow-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Near Expiry – Save More
              </span>
            )}
            {isLowStock && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Low Stock
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
            onClick={(e) => {
              e.preventDefault()
              toast.success('Added to wishlist!')
            }}
          >
            <Heart className="h-4 w-4 text-gray-600" />
          </button>

          {/* Dietary tags */}
          {product.dietary_tags?.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {product.dietary_tags.slice(0, 2).map((tag) => (
                <span key={tag} className="bg-white/90 text-xs font-medium px-1.5 py-0.5 rounded text-green-700">
                  {tag === 'vegan' ? '🌱 V' : tag === 'halal' ? '☾ H' : tag === 'gluten_free' ? 'GF' : tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.brand && (
            <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">{product.name}</h3>

          {/* Rating */}
          {product.avg_rating && product.avg_rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{product.avg_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.review_count})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="font-bold text-saffron-600">{formatCurrency(price)}</span>
              {hasDiscount && variant?.compare_at_price_eur && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {formatCurrency(variant.compare_at_price_eur)}
                </span>
              )}
            </div>

            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {!inStock && (
            <p className="text-xs text-destructive mt-1">Out of stock</p>
          )}
        </div>
      </div>
    </Link>
  )
}
