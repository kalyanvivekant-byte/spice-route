# 🌶️ Spice Route – Indian Grocery E-Commerce (Europe)

Production-ready Next.js 14 e-commerce platform for Indian groceries, built for the European market.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Database | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Payments | Stripe (card, iDEAL, SEPA, Bancontact, Apple/Google Pay) |
| Email | Resend |
| SMS | Twilio |
| Maps | Google Maps API |
| Analytics | PostHog |
| Deployment | Vercel + Supabase Cloud |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project (free tier works)
- A Stripe account (test mode)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/spice-route
cd spice-route
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. Required minimum for local dev:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3. Set Up Supabase

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# This runs all 4 migration files in order:
# 001_schema.sql  – all tables, indexes, triggers
# 002_rls.sql     – Row Level Security policies
# 003_seed.sql    – 50 seed products + categories
# 004_functions.sql – helper functions
```

### 4. Configure Supabase Auth

In your Supabase dashboard:

1. **Authentication → Providers**: Enable Email and Google OAuth
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/api/auth/callback`
3. **Storage**: Create a bucket named `product-images` with public read access

### 5. Configure Stripe Webhook (Local)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Copy the webhook signing secret into .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) (requires admin role)

---

## Making Yourself Admin

After creating an account, run in Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your@email.com';
```

---

## Project Structure

```
spice-route/
├── src/
│   ├── app/
│   │   ├── (store)/          # Public storefront
│   │   │   ├── page.tsx      # Homepage
│   │   │   ├── products/[slug]/
│   │   │   ├── categories/[slug]/
│   │   │   └── search/
│   │   ├── (auth)/           # Login, register
│   │   ├── (account)/        # Orders, profile, loyalty
│   │   ├── admin/            # Admin panel (protected)
│   │   ├── checkout/         # Checkout flow
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── layout/           # Navbar, Footer, HeroBanner
│   │   ├── product/          # ProductCard, ProductListingClient
│   │   ├── cart/             # CartDrawer
│   │   ├── checkout/         # DeliveryStep, PaymentStep, OrderSummary
│   │   ├── admin/            # Admin-specific components
│   │   └── shared/           # CookieConsentBanner, ReactQueryProvider
│   ├── hooks/
│   │   ├── useCart.ts        # Zustand cart store (persisted)
│   │   └── useAuth.ts        # Supabase auth hook
│   ├── lib/
│   │   ├── supabase/         # client.ts, server.ts, middleware.ts
│   │   ├── stripe/           # Stripe client + payment method utils
│   │   ├── email/            # Resend email templates
│   │   ├── sms/              # Twilio SMS
│   │   ├── vat.ts            # EU VAT calculation
│   │   ├── search.ts         # Transliteration + search expansion
│   │   └── loyalty.ts        # Points earn/redeem
│   ├── types/index.ts        # All TypeScript types
│   ├── utils/cn.ts           # Tailwind class merger
│   └── i18n/messages/        # en, nl, de, fr translations
├── supabase/migrations/
│   ├── 001_schema.sql        # Full schema
│   ├── 002_rls.sql           # RLS policies
│   ├── 003_seed.sql          # 50 products + categories
│   └── 004_functions.sql     # Helper functions
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-org/spice-route
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Add all environment variables from `.env.example`
5. Deploy

### 3. Configure Stripe Production Webhook

```bash
# In Stripe Dashboard → Webhooks → Add endpoint
Endpoint URL: https://your-domain.vercel.app/api/webhook/stripe

Events to listen for:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
```

### 4. Update Supabase for Production

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/api/auth/callback`

---

## Key Features

### Storefront
- Homepage with animated hero carousel + festival banners (auto-detects Diwali, Holi, Eid, etc.)
- 11-category grid with emoji icons
- Product detail pages with variant picker, allergen info (EU FIC 1169/2011), nutritional table
- Transliteration search: "atta" = "aata" = "wheat flour" (30+ term mappings)
- ISR (Incremental Static Regeneration) on product/category pages

### Cart & Checkout
- Persistent cart via Zustand + localStorage
- EU VAT calculation per country (NL 9%, DE 7%, FR 5.5%, BE 6%)
- Stripe Payment Element with iDEAL, SEPA, Bancontact, Apple/Google Pay
- Promo code system with min-order enforcement
- Delivery slot picker (morning/afternoon/evening + express)
- Order confirmation page with itemised VAT breakdown

### Admin Panel (`/admin`)
- Live order pipeline: Received → Picking → Packed → Out for Delivery → Delivered
- One-click status transitions with automatic email + SMS notifications
- Product CRUD with stock alerts
- Revenue/analytics dashboard with Recharts
- Low-stock alert system (DB trigger)
- Stripe refund flow via API

### User Accounts
- Supabase Auth (email + Google OAuth)
- Order history with status tracking
- Loyalty points (1pt/€1, redeem at checkout)
- Refer-a-friend (unique code, €5 credit)
- GDPR: right-to-erasure function (`anonymise_user`)

### EU Compliance
- GDPR cookie consent banner (necessary / analytics / marketing)
- VAT registration number in footer
- 14-day return policy notice at checkout
- Mandatory allergen display (EU FIC 1169/2011)
- Right-to-erasure DB function

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_FROM_EMAIL` | Sender email address |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps (address autocomplete) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `NEXT_PUBLIC_APP_URL` | Your full app URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key |

---

## Adding New Products

Via Admin Panel (`/admin/products/new`) or via Supabase Studio SQL:

```sql
-- Add product
insert into products (name, slug, description, category_id, brand, dietary_tags, allergens)
values ('My Product', 'my-product', 'Description', 'cat-spices', 'My Brand', array['vegan'], array[]::text[]);

-- Add variant
insert into product_variants (product_id, name, sku, price_eur)
values ('product-uuid', '500g', 'MY-SKU-001', 3.99);

-- Set inventory
insert into inventory (variant_id, quantity, low_stock_threshold)
values ('variant-uuid', 100, 10);
```

---

## Bulk CSV Import

Upload a CSV at `/admin/inventory` with columns:
`name, slug, description, category_slug, brand, sku, price_eur, quantity, dietary_tags, allergens`

---

## License

MIT – free to use for commercial and personal projects.

---

Built with ❤️ for the Indian diaspora in Europe.
