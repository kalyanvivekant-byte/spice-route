import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency } from '@/lib/vat'
import { Plus, Edit } from 'lucide-react'

export default async function AdminProductsPage() {
  const supabase = createAdminClient()
  const { data: products, count } = await supabase
    .from('products')
    .select(`
      id, name, slug, brand, is_active, is_featured, expiry_discount,
      category:categories(name),
      variants:product_variants(price_eur, sku),
      inventory(quantity, low_stock_threshold)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products ({count})</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1 bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products?.map((product: any) => {
              const variant = product.variants?.[0]
              const stock = product.inventory?.quantity ?? 0
              const isLow = stock <= (product.inventory?.low_stock_threshold ?? 10)
              return (
                <tr key={product.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-white line-clamp-1">{product.name}</p>
                      {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{product.category?.name ?? '–'}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{variant?.sku ?? '–'}</td>
                  <td className="p-4 font-medium">{variant ? formatCurrency(variant.price_eur) : '–'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                      {stock} {isLow && '⚠️'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {product.is_featured && (
                      <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Featured</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center gap-1 text-xs text-saffron-400 hover:text-saffron-300 transition"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
