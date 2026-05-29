'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Search, ScanLine, Plus, Minus, Trash2, X, ShoppingCart, Banknote,
  CreditCard, Wallet, Printer, ArrowLeft, CheckCircle2,
} from 'lucide-react'
import { BarcodeScanner } from '@/components/admin/BarcodeScanner'
import { formatCurrency, getVATRate } from '@/lib/vat'

export type PosItem = {
  variantId: string
  variantName: string
  productName: string
  brand: string | null
  categoryId: string | null
  sku: string
  barcode: string | null
  price: number
  stock: number
  image: string | null
}

export type PosCategory = { id: string; name: string }

type CartLine = { variantId: string; name: string; price: number; qty: number; image: string | null; stock: number }
type PayMethod = 'cash' | 'card' | 'terminal'
type Receipt = {
  orderNumber: string
  lines: CartLine[]
  total: number
  vat: number
  method: string
  cashReceived: number | null
  changeDue: number | null
}

const VAT_RATE = getVATRate('NL') // in-store country

export function Register({ items: initialItems, categories }: { items: PosItem[]; categories: PosCategory[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [scanning, setScanning] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (catFilter !== 'all' && it.categoryId !== catFilter) return false
      if (!q) return true
      return (
        it.productName.toLowerCase().includes(q) ||
        it.variantName.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q) ||
        (it.brand ?? '').toLowerCase().includes(q) ||
        (it.barcode ?? '').includes(q)
      )
    })
  }, [items, search, catFilter])

  const totals = useMemo(() => {
    const total = cart.reduce((s, l) => s + l.price * l.qty, 0)
    const vat = total - total / (1 + VAT_RATE)
    const count = cart.reduce((s, l) => s + l.qty, 0)
    return { total: round(total), vat: round(vat), count }
  }, [cart])

  function addToCart(it: PosItem, fromScan = false) {
    setCart((prev) => {
      const existing = prev.find((l) => l.variantId === it.variantId)
      const inCart = existing?.qty ?? 0
      if (inCart + 1 > it.stock) {
        toast.error(`Only ${it.stock} in stock for ${it.productName}`)
        return prev
      }
      if (existing) {
        return prev.map((l) => (l.variantId === it.variantId ? { ...l, qty: l.qty + 1 } : l))
      }
      return [
        ...prev,
        { variantId: it.variantId, name: `${it.productName} · ${it.variantName}`, price: it.price, qty: 1, image: it.image, stock: it.stock },
      ]
    })
    if (fromScan) toast.success(`Added ${it.productName}`)
  }

  function setQty(variantId: string, qty: number) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.variantId !== variantId) return [l]
        if (qty <= 0) return []
        if (qty > l.stock) { toast.error(`Only ${l.stock} in stock`); return [l] }
        return [{ ...l, qty }]
      })
    )
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId))
  }

  async function handleScan(code: string) {
    setScanning(false)
    // Try local catalog first (instant), fall back to server lookup (covers barcodes not in the loaded set).
    const local = items.find((it) => it.barcode === code || it.sku === code)
    if (local) { addToCart(local, true); return }
    try {
      const res = await fetch(`/api/pos/lookup?code=${encodeURIComponent(code)}`)
      if (res.ok) {
        const { item } = await res.json()
        addToCart(
          { ...item, variantName: item.variantName, productName: item.productName, brand: null, categoryId: null, barcode: code },
          true
        )
      } else {
        toast.error(`No product for barcode ${code}`)
      }
    } catch {
      toast.error('Lookup failed')
    }
  }

  async function completeSale(method: PayMethod, cashReceived?: number) {
    const payload = {
      items: cart.map((l) => ({ variantId: l.variantId, quantity: l.qty })),
      payment: { method, cashReceived },
      countryCode: 'NL',
    }
    const res = await fetch('/api/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Sale failed'); return }

    // Reflect sold stock locally so the catalog stays accurate.
    setItems((prev) =>
      prev.map((it) => {
        const line = cart.find((l) => l.variantId === it.variantId)
        return line ? { ...it, stock: Math.max(0, it.stock - line.qty) } : it
      })
    )
    setReceipt({
      orderNumber: data.orderNumber,
      lines: cart,
      total: data.total,
      vat: data.vat,
      method: data.paymentMethod,
      cashReceived: data.cashReceived,
      changeDue: data.changeDue,
    })
    setCart([])
    setPayOpen(false)
  }

  // ── Receipt screen ───────────────────────────────────────
  if (receipt) {
    return <ReceiptView receipt={receipt} onNew={() => { setReceipt(null); searchRef.current?.focus() }} />
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* ── Catalog ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-saffron-100 bg-white">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
            <span className="text-xl">🌶️</span>
            <span className="hidden sm:inline text-sm">Spice Route POS</span>
          </Link>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, brand…"
              className="w-full bg-white border border-saffron-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-saffron-500"
            />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-2 bg-gradient-spice text-white text-sm font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition shrink-0"
          >
            <ScanLine className="h-4 w-4" /> <span className="hidden sm:inline">Scan</span>
          </button>
        </header>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-saffron-100 bg-[#fffaf3]">
          <Chip active={catFilter === 'all'} onClick={() => setCatFilter('all')}>All</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.name}</Chip>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <p className="text-sm text-gray-400 mt-8 text-center">No products match.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {visible.map((it) => {
                const out = it.stock <= 0
                return (
                  <button
                    key={it.variantId}
                    disabled={out}
                    onClick={() => addToCart(it)}
                    className={`text-left rounded-xl border bg-white p-3 shadow-sm transition ${
                      out ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-saffron-100 hover:border-saffron-300 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div className="h-16 w-16 rounded-lg bg-saffron-50 overflow-hidden mb-2 flex items-center justify-center text-xl">
                      {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : '🛒'}
                    </div>
                    <div className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{it.productName}</div>
                    <div className="text-[11px] text-gray-500">{it.variantName}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-saffron-700">{formatCurrency(it.price)}</span>
                      <span className={`text-[10px] font-medium ${out ? 'text-red-500' : it.stock <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {out ? 'Out' : `${it.stock} left`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart ── */}
      <aside className="w-full lg:w-96 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-saffron-100 flex flex-col max-h-[45vh] lg:max-h-none lg:h-screen">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-saffron-100">
          <ShoppingCart className="h-4 w-4 text-saffron-600" />
          <span className="font-semibold text-sm">Current sale</span>
          {totals.count > 0 && (
            <span className="ml-auto text-xs text-gray-400">{totals.count} item{totals.count !== 1 && 's'}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">Scan or tap products to start a sale.</p>
          ) : (
            cart.map((l) => (
              <div key={l.variantId} className="flex items-center gap-2 rounded-lg border border-saffron-100 p-2">
                <div className="h-10 w-10 rounded bg-saffron-50 overflow-hidden flex items-center justify-center text-sm shrink-0">
                  {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : '🛒'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900 truncate">{l.name}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(l.price)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(l.variantId, l.qty - 1)} className="h-6 w-6 rounded bg-saffron-50 text-saffron-700 flex items-center justify-center hover:bg-saffron-100"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                  <button onClick={() => setQty(l.variantId, l.qty + 1)} className="h-6 w-6 rounded bg-saffron-50 text-saffron-700 flex items-center justify-center hover:bg-saffron-100"><Plus className="h-3 w-3" /></button>
                </div>
                <div className="w-16 text-right text-sm font-semibold">{formatCurrency(l.price * l.qty)}</div>
                <button onClick={() => removeLine(l.variantId)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-saffron-100 p-4 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Incl. VAT ({Math.round(VAT_RATE * 100)}%)</span>
            <span>{formatCurrency(totals.vat)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
          <div className="flex gap-2 pt-1">
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100">Clear</button>
            )}
            <button
              disabled={cart.length === 0}
              onClick={() => setPayOpen(true)}
              className="flex-1 bg-gradient-spice text-white font-semibold py-2.5 rounded-lg disabled:opacity-40 hover:opacity-90 transition"
            >
              Charge {formatCurrency(totals.total)}
            </button>
          </div>
        </div>
      </aside>

      {scanning && <BarcodeScanner onDetected={handleScan} onClose={() => setScanning(false)} />}
      {payOpen && (
        <PaymentModal total={totals.total} onClose={() => setPayOpen(false)} onConfirm={completeSale} />
      )}
    </div>
  )
}

// ── Payment modal ──────────────────────────────────────────
function PaymentModal({
  total, onClose, onConfirm,
}: { total: number; onClose: () => void; onConfirm: (m: PayMethod, cash?: number) => Promise<void> }) {
  const [method, setMethod] = useState<PayMethod>('cash')
  const [cash, setCash] = useState('')
  const [busy, setBusy] = useState(false)
  const cashNum = parseFloat(cash || '0')
  const change = round(cashNum - total)
  const quick = quickCash(total)

  async function confirm() {
    if (busy) return
    if (method === 'cash' && cashNum < total) { toast.error('Enter cash ≥ total'); return }
    setBusy(true)
    await onConfirm(method, method === 'cash' ? cashNum : undefined)
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Take payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="text-center mb-4">
          <div className="text-xs text-gray-500">Amount due</div>
          <div className="text-3xl font-extrabold text-saffron-700">{formatCurrency(total)}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <MethodBtn active={method === 'cash'} onClick={() => setMethod('cash')} icon={<Banknote className="h-5 w-5" />} label="Cash" />
          <MethodBtn active={method === 'terminal'} onClick={() => setMethod('terminal')} icon={<CreditCard className="h-5 w-5" />} label="Card reader" />
          <MethodBtn active={method === 'card'} onClick={() => setMethod('card')} icon={<Wallet className="h-5 w-5" />} label="Card (manual)" />
        </div>

        {method === 'cash' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Cash received</label>
              <input
                autoFocus type="number" inputMode="decimal" value={cash}
                onChange={(e) => setCash(e.target.value)} placeholder="0.00"
                className="w-full mt-1 bg-white border border-saffron-200 rounded-lg px-3 py-2.5 text-lg font-semibold focus:outline-none focus:border-saffron-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => (
                <button key={q} onClick={() => setCash(String(q))} className="px-3 py-1.5 rounded-lg border border-saffron-200 text-sm hover:bg-saffron-50">
                  {formatCurrency(q)}
                </button>
              ))}
            </div>
            {cashNum >= total && (
              <div className="flex justify-between bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm font-semibold">
                <span>Change due</span><span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 bg-saffron-50 rounded-lg px-3 py-2.5">
            {method === 'terminal'
              ? 'Charge the card on your card reader, then confirm to record the sale.'
              : 'Take payment on a separate card terminal, then confirm to record it as paid.'}
          </p>
        )}

        <button
          onClick={confirm} disabled={busy}
          className="w-full mt-5 bg-gradient-spice text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Complete sale'}
        </button>
      </div>
    </div>
  )
}

// ── Receipt ────────────────────────────────────────────────
function ReceiptView({ receipt, onNew }: { receipt: Receipt; onNew: () => void }) {
  const label =
    receipt.method === 'cash' ? 'Cash' : receipt.method === 'card_terminal' ? 'Card (reader)' : 'Card'
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-saffron-100 p-6 print:shadow-none print:border-0">
        <div className="flex flex-col items-center text-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
          <h2 className="font-bold text-lg">Sale complete</h2>
          <p className="text-xs text-gray-400">{receipt.orderNumber}</p>
        </div>
        <div className="border-t border-dashed border-gray-200 py-3 space-y-1.5">
          {receipt.lines.map((l) => (
            <div key={l.variantId} className="flex justify-between text-sm">
              <span className="truncate mr-2">{l.qty}× {l.name}</span>
              <span className="shrink-0">{formatCurrency(l.price * l.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-gray-200 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>VAT incl.</span><span>{formatCurrency(receipt.vat)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Paid by</span><span>{label}</span></div>
          {receipt.cashReceived != null && (
            <>
              <div className="flex justify-between text-gray-500"><span>Cash</span><span>{formatCurrency(receipt.cashReceived)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Change</span><span>{formatCurrency(receipt.changeDue ?? 0)}</span></div>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Thank you · Spice Route 🌶️</p>
      </div>
      <div className="flex gap-2 mt-5 print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-saffron-200 text-sm hover:bg-saffron-50">
          <Printer className="h-4 w-4" /> Print
        </button>
        <button onClick={onNew} className="flex items-center gap-2 bg-gradient-spice text-white font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition">
          <ArrowLeft className="h-4 w-4" /> New sale
        </button>
      </div>
    </div>
  )
}

// ── small bits ──────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
        active ? 'bg-gradient-spice text-white font-semibold' : 'bg-white border border-saffron-200 text-gray-600 hover:bg-saffron-50'
      }`}
    >
      {children}
    </button>
  )
}

function MethodBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition ${
        active ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-gray-200 text-gray-500 hover:border-saffron-300'
      }`}
    >
      {icon}{label}
    </button>
  )
}

function round(n: number) { return Math.round(n * 100) / 100 }

// Suggest tidy cash amounts ≥ total.
function quickCash(total: number): number[] {
  const exact = round(Math.ceil(total))
  const set = new Set<number>([exact])
  for (const note of [5, 10, 20, 50, 100]) {
    const up = Math.ceil(total / note) * note
    if (up >= total) set.add(up)
  }
  return Array.from(set).sort((a, b) => a - b).slice(0, 4)
}
