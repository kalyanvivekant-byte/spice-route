'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/vat'
import {
  Check, Trash2, ImageIcon, Search, Minus, Plus, ArrowUpDown,
  Download, Upload, X, Package, AlertTriangle, XCircle, CalendarClock, PackagePlus,
} from 'lucide-react'
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

interface Category { id: string; name: string }

type SortKey = 'name' | 'stock' | 'price' | 'deal' | 'cost' | 'margin' | 'expiry'

const DAY = 86400000

function regularOf(variant: any): number | null {
  const cmp = variant?.compare_at_price_eur
  const live = variant?.price_eur
  return cmp != null && cmp > 0 ? cmp : live ?? null
}
function dealPctOf(variant: any): number {
  const cmp = variant?.compare_at_price_eur
  const live = variant?.price_eur
  return cmp != null && cmp > 0 && live != null ? Math.round((1 - live / cmp) * 100) : 0
}
function daysToExpiry(date: string | null): number | null {
  if (!date) return null
  return Math.floor((new Date(date).getTime() - Date.now()) / DAY)
}

export function InventoryManager({ items, categories }: { items: Item[]; categories: Category[] }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [supabase])

  // Audit log helper
  async function logAdj(variantId: string | undefined, delta: number, newQty: number, reason: string, supplierId?: string | null) {
    if (!variantId || delta === 0) return
    await supabase.from('inventory_adjustments').insert({
      variant_id: variantId, delta, new_quantity: newQty, reason, supplier_id: supplierId ?? null, created_by: userId,
    })
  }

  const [rows, setRows] = useState(() =>
    items.map((i) => {
      const reg = regularOf(i.variant)
      const pct = dealPctOf(i.variant)
      const imgs = i.variant?.product?.images ?? []
      const primary = imgs.find((im: any) => im.is_primary) ?? imgs[0]
      return {
        ...i,
        _qty: String(i.quantity),
        _threshold: String(i.low_stock_threshold),
        _price: reg != null ? String(reg) : '',
        _deal: pct > 0 ? String(pct) : '',
        _cost: i.cost_price_eur != null ? String(i.cost_price_eur) : '',
        _img: primary?.url ?? '',
        _editingImg: false,
        _savingImg: false,
        _deleting: false,
        _saving: false,
      }
    })
  )

  // ---- filters / sort / selection ----
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in' | 'low' | 'out' | 'expiry' | 'deals'>('all')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeal, setBulkDeal] = useState('')

  const suppliers = useMemo(() => {
    const m = new Map<string, string>()
    rows.forEach((r) => { if (r.supplier?.name) m.set(r.supplier.name, r.supplier.name) })
    return Array.from(m.keys()).sort()
  }, [rows])

  function statusOf(r: any): 'out' | 'low' | 'ok' {
    if (r.quantity <= 0) return 'out'
    if (r.quantity <= (r.low_stock_threshold ?? 10)) return 'low'
    return 'ok'
  }

  // ---- dashboard stats (over all rows) ----
  const stats = useMemo(() => {
    let units = 0, costVal = 0, retailVal = 0, low = 0, out = 0, expiry = 0
    rows.forEach((r) => {
      const live = r.variant?.price_eur ?? 0
      const cost = r.cost_price_eur ?? 0
      units += r.quantity
      costVal += cost * r.quantity
      retailVal += live * r.quantity
      const s = statusOf(r)
      if (s === 'out') out++
      else if (s === 'low') low++
      const d = daysToExpiry(r.expiry_date)
      if (d != null && d <= 30) expiry++
    })
    return { skus: rows.length, units, costVal, retailVal, profit: retailVal - costVal, low, out, expiry }
  }, [rows])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows.filter((r) => {
      if (q) {
        const hay = `${r.variant?.product?.name ?? ''} ${r.variant?.name ?? ''} ${r.variant?.sku ?? ''} ${r.variant?.product?.brand ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (catFilter && r.variant?.product?.category?.id !== catFilter) return false
      if (supplierFilter && r.supplier?.name !== supplierFilter) return false
      const s = statusOf(r)
      if (statusFilter === 'in' && s !== 'ok') return false
      if (statusFilter === 'low' && s !== 'low') return false
      if (statusFilter === 'out' && s !== 'out') return false
      if (statusFilter === 'deals' && dealPctOf(r.variant) <= 0) return false
      if (statusFilter === 'expiry') {
        const d = daysToExpiry(r.expiry_date)
        if (d == null || d > 30) return false
      }
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const va = sortVal(a, sortKey), vb = sortVal(b, sortKey)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
    return list
  }, [rows, search, catFilter, supplierFilter, statusFilter, sortKey, sortDir])

  function sortVal(r: any, key: SortKey): number | string {
    switch (key) {
      case 'name': return (r.variant?.product?.name ?? '').toLowerCase()
      case 'stock': return r.quantity
      case 'price': return r.variant?.price_eur ?? 0
      case 'deal': return dealPctOf(r.variant)
      case 'cost': return r.cost_price_eur ?? 0
      case 'margin': {
        const live = r.variant?.price_eur ?? 0, cost = r.cost_price_eur ?? 0
        return live > 0 ? (live - cost) / live : -1
      }
      case 'expiry': return daysToExpiry(r.expiry_date) ?? 999999
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function update(id: string, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function storedRegular(r: any) {
    const reg = regularOf(r.variant)
    return reg != null ? String(reg) : ''
  }
  function storedDeal(r: any) {
    const pct = dealPctOf(r.variant)
    return pct > 0 ? String(pct) : ''
  }
  function isDirty(r: any) {
    return (
      r._qty !== String(r.quantity) ||
      r._threshold !== String(r.low_stock_threshold) ||
      r._price !== storedRegular(r) ||
      r._deal !== storedDeal(r) ||
      r._cost !== (r.cost_price_eur != null ? String(r.cost_price_eur) : '')
    )
  }

  // ---- quick stock adjust (auto-save) ----
  async function adjustQty(id: string, delta: number) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const prev = parseInt(row._qty, 10) || 0
    const next = Math.max(0, prev + delta)
    update(id, { _qty: String(next), quantity: next })
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    await logAdj(row.variant?.id, next - prev, next, 'correction')
  }

  // Receive stock against the row's supplier
  async function receive(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const input = window.prompt(`Receive how many units of ${row.variant?.product?.name ?? 'this item'}?`, '0')
    if (input === null) return
    const qty = parseInt(input, 10)
    if (!qty || qty <= 0) return toast.error('Enter a positive quantity')
    const prev = parseInt(row._qty, 10) || 0
    const next = prev + qty
    update(id, { _qty: String(next), quantity: next })
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: next, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    await logAdj(row.variant?.id, qty, next, 'received', row.supplier?.id ?? null)
    toast.success(`Received ${qty} · stock now ${next}`)
  }

  // ---- full row save (price/deal/cost/threshold/qty) ----
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
    if (error) { toast.error(error.message); update(id, { _saving: false }); return }

    if (regular != null && row.variant?.id) {
      const { error: pErr } = await supabase
        .from('product_variants')
        .update({ price_eur: priceEur, compare_at_price_eur: compareAt })
        .eq('id', row.variant.id)
      if (pErr) { toast.error(`Stock saved, but price failed: ${pErr.message}`); update(id, { _saving: false }); return }
    }

    const qtyDelta = quantity - (row.quantity ?? quantity)
    if (qtyDelta !== 0) await logAdj(row.variant?.id, qtyDelta, quantity, 'correction')

    update(id, {
      quantity, low_stock_threshold: threshold, cost_price_eur: cost,
      variant: { ...row.variant, price_eur: priceEur ?? row.variant?.price_eur, compare_at_price_eur: compareAt },
      _saving: false,
    })
    toast.success(dealPct > 0 ? `Saved · ${dealPct}% deal live` : 'Saved')
  }

  async function saveImage(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const pid = row.variant?.product?.id
    if (!pid) return toast.error('No product linked to this row')
    const url = (row._img || '').trim()
    update(id, { _savingImg: true })
    const { error: delErr } = await supabase.from('product_images').delete().eq('product_id', pid).eq('is_primary', true)
    if (delErr) { toast.error(delErr.message); update(id, { _savingImg: false }); return }
    if (url) {
      const { error: insErr } = await supabase.from('product_images').insert({ product_id: pid, url, is_primary: true })
      if (insErr) { toast.error(insErr.message); update(id, { _savingImg: false }); return }
    }
    update(id, { _savingImg: false, _editingImg: false })
    toast.success(url ? 'Photo updated' : 'Photo removed')
  }

  async function deleteOne(id: string, skipConfirm = false) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const pid = row.variant?.product?.id
    const name = row.variant?.product?.name ?? 'this product'
    if (!pid) return toast.error('No product linked to this row')
    if (!skipConfirm && !confirm(`Delete "${name}" completely? This removes the product, all its variants, stock, and images. This cannot be undone.`)) return

    update(id, { _deleting: true })
    const { data: variants } = await supabase.from('product_variants').select('id').eq('product_id', pid)
    const variantIds = (variants ?? []).map((v: any) => v.id)
    if (variantIds.length) await supabase.from('inventory').delete().in('variant_id', variantIds)
    await supabase.from('product_images').delete().eq('product_id', pid)
    await supabase.from('product_variants').delete().eq('product_id', pid)
    const { error } = await supabase.from('products').delete().eq('id', pid)
    if (error) { toast.error(error.message); update(id, { _deleting: false }); return }
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (!skipConfirm) toast.success(`${name} deleted`)
  }

  // ---- selection ----
  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleSelectAll() {
    const allVisible = visible.map((r) => r.id)
    setSelected((prev) => {
      const everySelected = allVisible.every((id) => prev.has(id))
      return everySelected ? new Set() : new Set(allVisible)
    })
  }

  // ---- bulk actions ----
  async function bulkApplyDeal(clear: boolean) {
    const pct = clear ? 0 : Number(bulkDeal)
    if (!clear && (Number.isNaN(pct) || pct <= 0 || pct > 90)) return toast.error('Enter a deal 1–90%')
    const ids = Array.from(selected)
    let done = 0
    for (const id of ids) {
      const row = rows.find((r) => r.id === id)
      if (!row?.variant?.id) continue
      const regular = regularOf(row.variant)
      if (regular == null) continue
      const priceEur = clear ? regular : Math.round(regular * (1 - pct / 100) * 100) / 100
      const compareAt = clear ? null : regular
      const { error } = await supabase
        .from('product_variants')
        .update({ price_eur: priceEur, compare_at_price_eur: compareAt })
        .eq('id', row.variant.id)
      if (!error) {
        update(id, {
          _price: String(regular),
          _deal: clear ? '' : String(pct),
          variant: { ...row.variant, price_eur: priceEur, compare_at_price_eur: compareAt },
        })
        done++
      }
    }
    toast.success(clear ? `Cleared deals on ${done} item(s)` : `${pct}% deal on ${done} item(s)`)
    setBulkDeal('')
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (!confirm(`Delete ${ids.length} product(s) completely? This cannot be undone.`)) return
    for (const id of ids) await deleteOne(id, true)
    setSelected(new Set())
    toast.success('Selected products deleted')
    router.refresh()
  }

  // ---- CSV export / import ----
  function exportCsv() {
    const header = ['SKU', 'Product', 'Variant', 'Brand', 'Supplier', 'Stock', 'Threshold', 'Price', 'RegularPrice', 'Deal%', 'Cost', 'Margin%', 'Expiry', 'Status']
    const lines = visible.map((r) => {
      const live = r.variant?.price_eur ?? 0
      const reg = regularOf(r.variant) ?? ''
      const cost = r.cost_price_eur ?? ''
      const margin = live > 0 && cost !== '' ? Math.round((1 - (cost as number) / live) * 100) : ''
      const cells = [
        r.variant?.sku ?? '', r.variant?.product?.name ?? '', r.variant?.name ?? '',
        r.variant?.product?.brand ?? '', r.supplier?.name ?? '', r.quantity, r.low_stock_threshold,
        live, reg, dealPctOf(r.variant), cost, margin, r.expiry_date ?? '', statusOf(r),
      ]
      return cells.map((c) => {
        const s = String(c)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${visible.length} row(s)`)
  }

  function parseCsv(text: string): string[][] {
    const out: string[][] = []
    let row: string[] = [], cur = '', inQ = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
        else cur += ch
      } else {
        if (ch === '"') inQ = true
        else if (ch === ',') { row.push(cur); cur = '' }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++
          row.push(cur); cur = ''
          if (row.some((c) => c !== '')) out.push(row)
          row = []
        } else cur += ch
      }
    }
    if (cur !== '' || row.length) { row.push(cur); if (row.some((c) => c !== '')) out.push(row) }
    return out
  }

  async function importCsv(file: File) {
    const text = await file.text()
    const grid = parseCsv(text)
    if (grid.length < 2) return toast.error('CSV looks empty')
    const header = grid[0].map((h) => h.trim().toLowerCase())
    const idx = (name: string) => header.indexOf(name)
    const skuI = idx('sku')
    if (skuI === -1) return toast.error('CSV must have a "SKU" column')
    const stockI = idx('stock'), thrI = idx('threshold'), priceI = idx('price') >= 0 ? idx('price') : idx('regularprice'), costI = idx('cost')

    const bySku = new Map<string, any>()
    rows.forEach((r) => { if (r.variant?.sku) bySku.set(String(r.variant.sku).toLowerCase(), r) })

    let updated = 0, skipped = 0
    for (let i = 1; i < grid.length; i++) {
      const cells = grid[i]
      const sku = (cells[skuI] ?? '').trim().toLowerCase()
      const row = bySku.get(sku)
      if (!row) { skipped++; continue }
      const invPatch: any = { updated_at: new Date().toISOString() }
      const statePatch: any = {}
      if (stockI >= 0 && cells[stockI]?.trim() !== '') { const v = parseInt(cells[stockI], 10); if (!Number.isNaN(v)) { invPatch.quantity = v; statePatch.quantity = v; statePatch._qty = String(v) } }
      if (thrI >= 0 && cells[thrI]?.trim() !== '') { const v = parseInt(cells[thrI], 10); if (!Number.isNaN(v)) { invPatch.low_stock_threshold = v; statePatch.low_stock_threshold = v; statePatch._threshold = String(v) } }
      if (costI >= 0 && cells[costI]?.trim() !== '') { const v = Number(cells[costI]); if (!Number.isNaN(v)) { invPatch.cost_price_eur = v; statePatch.cost_price_eur = v; statePatch._cost = String(v) } }
      const { error } = await supabase.from('inventory').update(invPatch).eq('id', row.id)
      if (error) { skipped++; continue }
      if (priceI >= 0 && cells[priceI]?.trim() !== '' && row.variant?.id) {
        const v = Number(cells[priceI])
        if (!Number.isNaN(v)) {
          await supabase.from('product_variants').update({ price_eur: v, compare_at_price_eur: null }).eq('id', row.variant.id)
          statePatch.variant = { ...row.variant, price_eur: v, compare_at_price_eur: null }
          statePatch._price = String(v); statePatch._deal = ''
        }
      }
      update(row.id, statePatch)
      updated++
    }
    toast.success(`Imported: ${updated} updated, ${skipped} skipped`)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ---- styling helpers ----
  const inputCls = 'w-20 bg-white border border-saffron-200 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-saffron-500'
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h1 className="text-3xl font-extrabold font-display">Inventory</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm bg-white border border-saffron-200 hover:border-saffron-400 text-gray-700 px-3 py-2 rounded-lg transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm bg-white border border-saffron-200 hover:border-saffron-400 text-gray-700 px-3 py-2 rounded-lg transition">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f) }} />
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="SKUs" value={String(stats.skus)} sub={`${stats.units} units`} icon={<Package className="h-4 w-4" />} tone="saffron" />
        <button onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')} className="text-left">
          <StatCard label="Low stock" value={String(stats.low)} sub="at/below threshold" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" active={statusFilter === 'low'} />
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')} className="text-left">
          <StatCard label="Out of stock" value={String(stats.out)} sub="needs reorder" icon={<XCircle className="h-4 w-4" />} tone="red" active={statusFilter === 'out'} />
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'expiry' ? 'all' : 'expiry')} className="text-left">
          <StatCard label="Near expiry" value={String(stats.expiry)} sub="≤ 30 days" icon={<CalendarClock className="h-4 w-4" />} tone="purple" active={statusFilter === 'expiry'} />
        </button>
        <StatCard label="Stock value" value={formatCurrency(stats.costVal)} sub="at cost" tone="slate" />
        <StatCard label="Retail value" value={formatCurrency(stats.retailVal)} sub={`+${formatCurrency(stats.profit)} margin`} tone="green" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU or brand…"
            className="w-full bg-white border border-saffron-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-saffron-500"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-white border border-saffron-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-saffron-500">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-white border border-saffron-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-saffron-500">
          <option value="all">All status</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="expiry">Near expiry</option>
          <option value="deals">On deal</option>
        </select>
        {suppliers.length > 0 && (
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="bg-white border border-saffron-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-saffron-500">
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <span className="text-sm text-gray-500 ml-auto">{visible.length} of {rows.length}</span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-saffron-800">{selected.size} selected</span>
          <div className="flex items-center gap-1">
            <input type="number" min={1} max={90} value={bulkDeal} onChange={(e) => setBulkDeal(e.target.value)} placeholder="%"
              className="w-16 bg-white border border-saffron-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-saffron-500" />
            <button onClick={() => bulkApplyDeal(false)} className="text-xs bg-gradient-spice text-white px-3 py-1.5 rounded-lg">Apply deal</button>
            <button onClick={() => bulkApplyDeal(true)} className="text-xs bg-white border border-saffron-200 text-gray-700 px-3 py-1.5 rounded-lg hover:border-saffron-400">Clear deal</button>
          </div>
          <button onClick={bulkDelete} className="flex items-center gap-1 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-800 ml-auto flex items-center gap-1">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-saffron-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-saffron-100 text-gray-500 text-xs bg-saffron-50/50">
              <th className="p-3 w-8">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="accent-saffron-500" />
              </th>
              <th className="text-left p-3">Photo</th>
              <SortTh label="Product" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="text-left p-3">SKU</th>
              <SortTh label="Stock" k="stock" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="text-left p-3">Threshold</th>
              <SortTh label="Price €" k="price" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortTh label="Deal %" k="deal" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortTh label="Cost €" k="cost" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortTh label="Margin" k="margin" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <SortTh label="Expiry" k="expiry" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-saffron-50">
            {visible.map((r) => {
              const status = statusOf(r)
              const dirty = isDirty(r)
              const live = r.variant?.price_eur ?? 0
              const cost = r.cost_price_eur
              const margin = live > 0 && cost != null ? Math.round((1 - cost / live) * 100) : null
              const dte = daysToExpiry(r.expiry_date)
              return (
                <tr key={r.id} className={`hover:bg-saffron-50/40 transition align-top ${selected.has(r.id) ? 'bg-saffron-50/60' : ''}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-saffron-500" />
                  </td>
                  <td className="p-3">
                    {r._editingImg ? (
                      <div className="flex flex-col gap-1 w-44">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r._img ? <img src={r._img} alt="" className="h-12 w-12 rounded object-cover border border-saffron-200" /> : null}
                        <input value={r._img} placeholder="Paste image URL" onChange={(e) => update(r.id, { _img: e.target.value })}
                          className="bg-white border border-saffron-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-saffron-500" />
                        <div className="flex gap-1">
                          <button onClick={() => saveImage(r.id)} disabled={r._savingImg} className="text-[11px] bg-gradient-spice text-white px-2 py-1 rounded disabled:opacity-40">{r._savingImg ? 'Saving…' : 'Save'}</button>
                          <button onClick={() => update(r.id, { _editingImg: false })} className="text-[11px] text-gray-400 hover:text-gray-700 px-2 py-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => update(r.id, { _editingImg: true })} title="Add or change photo"
                        className="h-12 w-12 rounded-lg border border-saffron-200 hover:border-saffron-400 overflow-hidden flex items-center justify-center bg-saffron-50 transition">
                        {r._img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r._img} alt="" className="h-full w-full object-cover" />
                        ) : <ImageIcon className="h-4 w-4 text-gray-400" />}
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-gray-900 font-medium">{r.variant?.product?.name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1.5">
                      {r.variant?.name}
                      {!r.variant?.product?.is_active && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">inactive</span>}
                      <StatusDot status={status} />
                    </div>
                  </td>
                  <td className="p-3 text-gray-400 font-mono text-xs">{r.variant?.sku ?? '–'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustQty(r.id, -1)} className="h-7 w-7 rounded-md border border-saffron-200 hover:bg-saffron-100 flex items-center justify-center text-gray-600"><Minus className="h-3 w-3" /></button>
                      <input type="number" min={0} value={r._qty} onChange={(e) => update(r.id, { _qty: e.target.value })}
                        className={`w-14 bg-white border border-saffron-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-saffron-500 ${status !== 'ok' ? 'text-red-500 font-semibold' : 'text-gray-900'}`} />
                      <button onClick={() => adjustQty(r.id, 1)} className="h-7 w-7 rounded-md border border-saffron-200 hover:bg-saffron-100 flex items-center justify-center text-gray-600"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => receive(r.id)} title="Receive stock" className="h-7 px-2 rounded-md border border-saffron-200 hover:bg-saffron-100 flex items-center justify-center text-gray-600"><PackagePlus className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                  <td className="p-3"><input type="number" min={0} value={r._threshold} onChange={(e) => update(r.id, { _threshold: e.target.value })} className={inputCls} /></td>
                  <td className="p-3"><input type="number" min={0} step="0.01" value={r._price} placeholder="–" onChange={(e) => update(r.id, { _price: e.target.value })} className={inputCls} /></td>
                  <td className="p-3"><input type="number" min={0} max={90} step="1" value={r._deal} placeholder="0" onChange={(e) => update(r.id, { _deal: e.target.value })}
                    className={`${inputCls} ${r._deal && Number(r._deal) > 0 ? 'border-green-500 text-green-600' : ''}`} /></td>
                  <td className="p-3"><input type="number" min={0} step="0.01" value={r._cost} placeholder="–" onChange={(e) => update(r.id, { _cost: e.target.value })} className={inputCls} /></td>
                  <td className="p-3 text-xs">
                    {margin != null ? <span className={margin < 0 ? 'text-red-500' : margin < 20 ? 'text-amber-600' : 'text-green-600'}>{margin}%</span> : <span className="text-gray-300">–</span>}
                  </td>
                  <td className="p-3 text-xs">
                    {r.expiry_date ? (
                      <span className={dte != null && dte <= 30 ? 'text-purple-600 font-medium' : 'text-gray-500'}>{r.expiry_date}</span>
                    ) : <span className="text-gray-300">–</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => save(r.id)} disabled={!dirty || r._saving}
                        className="flex items-center gap-1 text-xs bg-gradient-spice text-white px-3 py-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition">
                        <Check className="h-3 w-3" />{r._saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => deleteOne(r.id)} disabled={r._deleting} title="Delete product"
                        className="flex items-center justify-center text-xs text-red-500 hover:text-white hover:bg-red-500 disabled:opacity-30 px-2 py-1.5 rounded-lg transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-6 text-gray-400 text-sm">{rows.length === 0 ? 'No inventory records yet.' : 'No items match your filters.'}</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, tone, active }: { label: string; value: string; sub?: string; icon?: React.ReactNode; tone: string; active?: boolean }) {
  const tones: Record<string, string> = {
    saffron: 'text-saffron-600 bg-saffron-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
    slate: 'text-slate-600 bg-slate-50',
  }
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${active ? 'border-saffron-400 ring-1 ring-saffron-300' : 'border-saffron-100'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {icon && <span className={`h-7 w-7 rounded-full flex items-center justify-center ${tones[tone]}`}>{icon}</span>}
      </div>
      <div className="mt-1.5 text-2xl font-bold font-display text-gray-900">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusDot({ status }: { status: 'out' | 'low' | 'ok' }) {
  const map = { out: 'bg-red-500', low: 'bg-amber-500', ok: 'bg-green-500' }
  const label = { out: 'Out', low: 'Low', ok: 'OK' }
  return <span className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${map[status]}`} />{label[status]}</span>
}

function SortTh({ label, k, sortKey, sortDir, onClick }: { label: string; k: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onClick: (k: SortKey) => void }) {
  const active = sortKey === k
  return (
    <th className="text-left p-3">
      <button onClick={() => onClick(k)} className={`flex items-center gap-1 hover:text-saffron-600 transition ${active ? 'text-saffron-600' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-30'}`} />
        {active && <span className="text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  )
}
