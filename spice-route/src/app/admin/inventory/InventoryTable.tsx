'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Item {
  id: string
  quantity: number
  low_stock_threshold: number
  cost_price_eur: number | null
  expiry_date: string | null
  variant: any
  supplier: any
}

export function InventoryTable({ items }: { items: Item[] }) {
  const supabase = createClient()
  const [rows, setRows] = useState(() =>
    items.map((i) => {
      // The "regular" price is compare_at when on sale, otherwise the live price.
      const cmp = i.variant?.compare_at_price_eur
      const live = i.variant?.price_eur
      const regular = cmp != null && cmp > 0 ? cmp : live
      const pct =
        cmp != null && cmp > 0 && live != null
          ? Math.round((1 - live / cmp) * 100)
          : 0
      return {
        ...i,
        _qty: String(i.quantity),
        _threshold: String(i.low_stock_threshold),
        _price: regular != null ? String(regular) : '',
        _deal: pct > 0 ? String(pct) : '',
        _cost: i.cost_price_eur != null ? String(i.cost_price_eur) : '',
        _saving: false,
      }
    })
  )

  // Derive the live (discounted) values currently stored for a row, for dirty-checking.
  function storedRegular(r: any) {
    const cmp = r.variant?.compare_at_price_eur
    const live = r.variant?.price_eur
    const reg = cmp != null && cmp > 0 ? cmp : live
    return reg != null ? String(reg) : ''
  }
  function storedDeal(r: any) {
    const cmp = r.variant?.compare_at_price_eur
    const live = r.variant?.price_eur
    const pct = cmp != null && cmp > 0 && live != null ? Math.round((1 - live / cmp) * 100) : 0
    return pct > 0 ? String(pct) : ''
  }

  function update(id: string, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function save(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const quantity = parseInt(row._qty, 10)
    const threshold = parseInt(row._threshold, 10)
    if (Number.isNaN(quantity) || quantity < 0) return toast.error('Enter a valid quantity')
    if (Number.isNaN(threshold) || threshold < 0) return toast.error('Enter a valid threshold')

    const regular = row._price === '' ? null : Number(row._price)
    if (regular != null && (Number.isNaN(regular) || regular < 0)) return toast.error('Enter a valid price')
    const cost = row._cost === '' ? null : Number(row._cost)
    if (cost != null && (Number.isNaN(cost) || cost < 0)) return toast.error('Enter a valid cost')

    const dealPct = row._deal === '' ? 0 : Number(row._deal)
    if (Number.isNaN(dealPct) || dealPct < 0 || dealPct > 90) return toast.error('Discount must be 0–90%')

    // Compute the live (charged) price and the struck-through compare price.
    let priceEur: number | null = regular
    let compareAt: number | null = null
    if (regular != null && dealPct > 0) {
      compareAt = regular
      priceEur = Math.round(regular * (1 - dealPct / 100) * 100) / 100
    }

    update(id, { _saving: true })

    const { error } = await supabase
      .from('inventory')
      .update({ quantity, low_stock_threshold: threshold, cost_price_eur: cost, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error(error.message)
      update(id, { _saving: false })
      return
    }

    // Selling price + discount live on the product variant
    if (regular != null && row.variant?.id) {
      const { error: pErr } = await supabase
        .from('product_variants')
        .update({ price_eur: priceEur, compare_at_price_eur: compareAt })
        .eq('id', row.variant.id)
      if (pErr) {
        toast.error(`Stock saved, but price failed: ${pErr.message}`)
        update(id, { _saving: false })
        return
      }
    }

    update(id, {
      quantity,
      low_stock_threshold: threshold,
      cost_price_eur: cost,
      variant: {
        ...row.variant,
        price_eur: priceEur ?? row.variant?.price_eur,
        compare_at_price_eur: compareAt,
      },
      _saving: false,
    })
    toast.success(dealPct > 0 ? `Saved · ${dealPct}% deal live` : 'Saved')
  }

  const lowCount = rows.filter((r) => r.quantity <= (r.low_stock_threshold ?? 10)).length
  const inputCls =
    'w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-saffron-500'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <span className="text-sm text-yellow-400">{lowCount} item(s) low on stock</span>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs">
              <th className="text-left p-4">Product</th>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Supplier</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Threshold</th>
              <th className="text-left p-4">Price €</th>
              <th className="text-left p-4">Deal %</th>
              <th className="text-left p-4">Cost €</th>
              <th className="text-left p-4">Expiry</th>
              <th className="text-left p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.map((r) => {
              const low = r.quantity <= (r.low_stock_threshold ?? 10)
              const dirty =
                r._qty !== String(r.quantity) ||
                r._threshold !== String(r.low_stock_threshold) ||
                r._price !== storedRegular(r) ||
                r._deal !== storedDeal(r) ||
                r._cost !== (r.cost_price_eur != null ? String(r.cost_price_eur) : '')
              return (
                <tr key={r.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-white">
                    {r.variant?.product?.name}
                    <span className="text-gray-500 text-xs"> · {r.variant?.name}</span>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{r.variant?.sku ?? '–'}</td>
                  <td className="p-4 text-gray-400 text-xs">{r.supplier?.name ?? '–'}</td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={0}
                      value={r._qty}
                      onChange={(e) => update(r.id, { _qty: e.target.value })}
                      className={`${inputCls} ${low ? 'text-red-400' : ''}`}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={0}
                      value={r._threshold}
                      onChange={(e) => update(r.id, { _threshold: e.target.value })}
                      className={inputCls}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={r._price}
                      placeholder="–"
                      onChange={(e) => update(r.id, { _price: e.target.value })}
                      className={inputCls}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      step="1"
                      value={r._deal}
                      placeholder="0"
                      onChange={(e) => update(r.id, { _deal: e.target.value })}
                      className={`${inputCls} ${r._deal && Number(r._deal) > 0 ? 'border-green-600 text-green-400' : ''}`}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={r._cost}
                      placeholder="–"
                      onChange={(e) => update(r.id, { _cost: e.target.value })}
                      className={inputCls}
                    />
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{r.expiry_date ?? '–'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => save(r.id)}
                      disabled={!dirty || r._saving}
                      className="flex items-center gap-1 text-xs bg-saffron-500 hover:bg-saffron-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded transition"
                    >
                      <Check className="h-3 w-3" />
                      {r._saving ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-gray-500 text-sm">No inventory records yet.</p>
        )}
      </div>
    </div>
  )
}
