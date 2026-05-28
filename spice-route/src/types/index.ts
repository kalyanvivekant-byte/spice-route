export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'customer' | 'admin' | 'driver'

export type OrderStatus =
  | 'pending_payment'
  | 'received'
  | 'picking'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type DeliveryType = 'home_delivery' | 'click_and_collect'

export type PaymentMethod =
  | 'card'
  | 'ideal'
  | 'sepa_debit'
  | 'bancontact'
  | 'apple_pay'
  | 'google_pay'

export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten_free' | 'halal' | 'organic' | 'jain'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
  children?: Category[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category_id: string
  category?: Category
  brand: string | null
  country_of_origin: string | null
  weight_grams: number | null
  dietary_tags: DietaryTag[]
  allergens: string[]
  nutritional_info: NutritionalInfo | null
  ean_barcode: string | null
  is_active: boolean
  is_featured: boolean
  expiry_discount: boolean
  created_at: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  reviews?: Review[]
  inventory?: Inventory
}

export interface NutritionalInfo {
  energy_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fibre_g: number
  salt_g: number
  per_100g: boolean
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string
  price_eur: number
  compare_at_price_eur: number | null
  weight_grams: number | null
  is_active: boolean
  inventory?: Inventory
}

export interface Inventory {
  id: string
  variant_id: string
  quantity: number
  low_stock_threshold: number
  supplier_id: string | null
  cost_price_eur: number | null
  expiry_date: string | null
}

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  lead_time_days: number
  notes: string | null
}

export interface CartItem {
  variantId: string
  productId: string
  name: string
  variantName: string
  price: number
  quantity: number
  imageUrl: string | null
  slug: string
  maxQuantity: number
}

export interface Address {
  id: string
  user_id: string
  label: string | null
  first_name: string
  last_name: string
  street_line1: string
  street_line2: string | null
  city: string
  postal_code: string
  country_code: string
  phone: string | null
  is_default: boolean
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  guest_email: string | null
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address: Address | null
  delivery_slot_id: string | null
  delivery_slot?: DeliverySlot
  payment_method: PaymentMethod | null
  stripe_payment_intent_id: string | null
  subtotal_eur: number
  delivery_fee_eur: number
  discount_eur: number
  vat_eur: number
  total_eur: number
  promo_code: string | null
  notes: string | null
  driver_id: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  product_id: string
  product_name: string
  variant_name: string
  quantity: number
  unit_price_eur: number
  total_price_eur: number
  vat_rate: number
  image_url: string | null
}

export interface DeliverySlot {
  id: string
  date: string
  slot_label: string
  start_time: string
  end_time: string
  zone_id: string
  capacity: number
  booked: number
  is_express: boolean
}

export interface DeliveryZone {
  id: string
  name: string
  country_code: string
  postal_codes: string[]
  min_order_eur: number
  delivery_fee_eur: number
  free_delivery_above_eur: number
  express_fee_eur: number
  is_active: boolean
}

export interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_eur: number
  max_uses: number | null
  uses_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  order_id: string
  rating: number
  title: string | null
  body: string | null
  image_urls: string[]
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
  user?: { full_name: string; avatar_url: string | null }
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  order_id: string | null
  points: number
  type: 'earn' | 'redeem' | 'expire' | 'referral'
  description: string
  created_at: string
}

export interface VATRate {
  country: string
  country_code: string
  food_rate: number
  standard_rate: number
}

export const VAT_RATES: VATRate[] = [
  { country: 'Netherlands', country_code: 'NL', food_rate: 0.09, standard_rate: 0.21 },
  { country: 'Germany', country_code: 'DE', food_rate: 0.07, standard_rate: 0.19 },
  { country: 'France', country_code: 'FR', food_rate: 0.055, standard_rate: 0.2 },
  { country: 'Belgium', country_code: 'BE', food_rate: 0.06, standard_rate: 0.21 },
  { country: 'United Kingdom', country_code: 'GB', food_rate: 0.0, standard_rate: 0.2 },
  { country: 'Spain', country_code: 'ES', food_rate: 0.04, standard_rate: 0.21 },
  { country: 'Italy', country_code: 'IT', food_rate: 0.04, standard_rate: 0.22 },
]

export const CATEGORY_ICONS: Record<string, string> = {
  'flours-grains': '🌾',
  'spices': '🌶️',
  'lentils-pulses': '🫘',
  'rice': '🍚',
  'pickles-chutneys': '🫙',
  'frozen-foods': '🧊',
  'beverages': '🫖',
  'snacks': '🥜',
  'pooja-items': '🪔',
  'personal-care': '🧴',
  'fresh-produce': '🥬',
}
