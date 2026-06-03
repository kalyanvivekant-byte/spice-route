// Sendcloud API v3 adapter — https://sendcloud.dev
// Auth: HTTP Basic with Public key (username) + Secret key (password).
// Env: SENDCLOUD_PUBLIC_KEY, SENDCLOUD_SECRET_KEY
//      Sender address (required to create labels), either:
//        SENDCLOUD_SENDER_ADDRESS_ID   (preferred — id from your Sendcloud sender addresses)
//      or the individual fields:
//        SENDCLOUD_FROM_NAME, SENDCLOUD_FROM_ADDRESS, SENDCLOUD_FROM_HOUSE_NUMBER,
//        SENDCLOUD_FROM_CITY, SENDCLOUD_FROM_POSTAL_CODE, SENDCLOUD_FROM_COUNTRY (default NL)

const BASE = 'https://panel.sendcloud.sc/api/v3'

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
    const msg =
      json?.error?.message ?? json?.errors?.[0]?.detail ?? json?.detail ?? json?.message ?? text ?? `Sendcloud ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return json
}

function fromCountry() {
  return (process.env.SENDCLOUD_FROM_COUNTRY ?? 'NL').toUpperCase()
}

function fromAddress() {
  return {
    name: process.env.SENDCLOUD_FROM_NAME ?? 'Spice Route',
    address_line_1: process.env.SENDCLOUD_FROM_ADDRESS ?? '',
    house_number: process.env.SENDCLOUD_FROM_HOUSE_NUMBER ?? '',
    city: process.env.SENDCLOUD_FROM_CITY ?? '',
    postal_code: process.env.SENDCLOUD_FROM_POSTAL_CODE ?? '',
    country_code: fromCountry(),
  }
}

export type ShippingMethod = {
  id: string        // shipping_option_code in v3
  name: string
  carrier: string
  price: number | null
}

// Shipping options (v3) for a destination + weight — used for rates.
export async function getShippingMethods(params: {
  toCountry: string
  weightGrams?: number
}): Promise<ShippingMethod[]> {
  const body: any = {
    from_address: { country_code: fromCountry() },
    to_address: { country_code: params.toCountry },
    calculate_quotes: true,
  }
  if (params.weightGrams) {
    body.parcels = [{ weight: { value: (params.weightGrams / 1000).toFixed(3), unit: 'kg' } }]
  }
  const data = await scFetch('/shipping-options', { method: 'POST', body: JSON.stringify(body) })
  const options: any[] = data?.data ?? data ?? []

  return options.map((o) => {
    const q = Array.isArray(o.quotes) ? o.quotes[0] : o.quotes
    const price =
      q?.price?.total?.value ?? q?.price?.value ?? q?.total?.value ?? null
    return {
      id: o.code,
      name: o.product?.name ?? o.name ?? o.code,
      carrier: typeof o.carrier === 'string' ? o.carrier : (o.carrier?.name ?? o.carrier?.code ?? ''),
      price: price != null ? Number(price) : null,
    }
  })
}

export type CreatedParcel = {
  parcelId: string
  carrier: string | null
  methodName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  labelBase64: string | null
  status: string | null
}

// Create + announce a shipment synchronously (v3) and get the label back.
export async function createShipment(input: {
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
  shippingOptionCode: string
}): Promise<CreatedParcel> {
  const senderId = process.env.SENDCLOUD_SENDER_ADDRESS_ID
  const body: any = {
    to_address: {
      name: input.name,
      address_line_1: input.address,
      house_number: input.houseNumber || '',
      postal_code: input.postalCode,
      city: input.city,
      country_code: input.countryCode,
      email: input.email || '',
      phone_number: input.telephone || '',
    },
    ship_with: { type: 'shipping_option_code', properties: { shipping_option_code: input.shippingOptionCode } },
    parcels: [{ weight: { value: (input.weightGrams / 1000).toFixed(3), unit: 'kg' } }],
  }
  if (senderId) body.sender_address_id = Number(senderId)
  else body.from_address = fromAddress()

  const res = await scFetch('/shipments/announce', { method: 'POST', body: JSON.stringify(body) })
  const data = res?.data ?? res ?? {}
  if (data?.errors?.length) {
    const e = data.errors[0]
    throw new Error(e?.detail ?? e?.title ?? 'Carrier announcement failed')
  }
  const parcel = data?.parcels?.[0] ?? {}
  return {
    parcelId: String(parcel.id ?? ''),
    carrier: data?.carrier?.name ?? data?.carrier?.code ?? null,
    methodName: data?.ship_with?.properties?.shipping_option_code ?? input.shippingOptionCode,
    trackingNumber: parcel.tracking_number ?? null,
    trackingUrl: parcel.tracking_url ?? null,
    labelBase64: data?.label_file ?? null,
    status: parcel?.status?.message ?? parcel?.status?.code ?? 'created',
  }
}

// Fetch the label PDF for a parcel (v3).
export async function getLabelPdf(parcelId: string): Promise<Buffer> {
  const res = await fetch(`${BASE}/parcels/${parcelId}/documents/label?dpi=150`, {
    headers: { Authorization: authHeader(), Accept: 'application/pdf' },
  })
  if (!res.ok) throw new Error(`Could not fetch label (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

// Latest tracking status for a parcel (v3).
export async function getParcelStatus(parcelId: string) {
  const res = await scFetch(`/parcels/${parcelId}`)
  const p = res?.data ?? res ?? {}
  return {
    status: p?.status?.message ?? p?.status?.code ?? null,
    trackingNumber: p.tracking_number ?? null,
    trackingUrl: p.tracking_url ?? null,
  }
}
