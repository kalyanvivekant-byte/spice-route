// Sendcloud API v2 adapter — https://sendcloud.dev
// Auth: HTTP Basic with Public key (username) + Secret key (password).
// Set SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY in the environment.

const BASE = 'https://panel.sendcloud.sc/api/v2'

export function sendcloudConfigured() {
  return !!(process.env.SENDCLOUD_PUBLIC_KEY && process.env.SENDCLOUD_SECRET_KEY)
}

function authHeader() {
  const token = Buffer.from(
    `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
  ).toString('base64')
  return `Basic ${token}`
}

async function scFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = json?.error?.message ?? json?.error ?? text ?? `Sendcloud ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return json
}

export type ShippingMethod = {
  id: number
  name: string
  carrier: string
  minWeight: number
  maxWeight: number
  price: number | null
}

// Shipping options for a destination + weight (used for rates at checkout).
export async function getShippingMethods(params: {
  toCountry: string
  weightGrams?: number
}): Promise<ShippingMethod[]> {
  const qs = new URLSearchParams({ to_country: params.toCountry })
  const data = await scFetch(`/shipping_methods?${qs.toString()}`)
  const methods: any[] = data?.shipping_methods ?? []
  const weightKg = params.weightGrams ? params.weightGrams / 1000 : null

  return methods
    .map((m) => {
      const minW = parseFloat(m.min_weight ?? '0')
      const maxW = parseFloat(m.max_weight ?? '1000')
      const countryPrice = (m.countries ?? []).find((c: any) => c.iso_2 === params.toCountry)
      return {
        id: m.id,
        name: m.name,
        carrier: m.carrier,
        minWeight: minW,
        maxWeight: maxW,
        price: countryPrice?.price != null ? Number(countryPrice.price) : null,
      }
    })
    .filter((m) => (weightKg == null ? true : weightKg >= m.minWeight && weightKg <= m.maxWeight))
}

export type CreatedParcel = {
  parcelId: string
  carrier: string | null
  methodName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  labelUrl: string | null
  status: string | null
}

// Create a parcel and request a label in one call.
export async function createParcelWithLabel(input: {
  name: string
  address: string
  houseNumber?: string
  city: string
  postalCode: string
  countryCode: string
  email?: string
  telephone?: string
  orderNumber: string
  weightGrams: number
  shippingMethodId: number
}): Promise<CreatedParcel> {
  const body = {
    parcel: {
      name: input.name,
      address: input.address,
      house_number: input.houseNumber ?? '',
      city: input.city,
      postal_code: input.postalCode,
      country: input.countryCode,
      email: input.email ?? '',
      telephone: input.telephone ?? '',
      order_number: input.orderNumber,
      weight: (input.weightGrams / 1000).toFixed(3),
      request_label: true,
      shipment: { id: input.shippingMethodId },
    },
  }
  const data = await scFetch('/parcels', { method: 'POST', body: JSON.stringify(body) })
  const p = data?.parcel ?? {}
  const labelUrl: string | null =
    p?.label?.label_printer ?? p?.label?.normal_printer?.[0] ?? null
  return {
    parcelId: String(p.id ?? ''),
    carrier: p?.carrier?.code ?? null,
    methodName: p?.shipment?.name ?? null,
    trackingNumber: p.tracking_number ?? null,
    trackingUrl: p.tracking_url ?? null,
    labelUrl,
    status: p?.status?.message ?? 'created',
  }
}

// Latest tracking status for a parcel.
export async function getParcelStatus(parcelId: string) {
  const data = await scFetch(`/parcels/${parcelId}`)
  const p = data?.parcel ?? {}
  return {
    status: p?.status?.message ?? null,
    trackingNumber: p.tracking_number ?? null,
    trackingUrl: p.tracking_url ?? null,
  }
}
