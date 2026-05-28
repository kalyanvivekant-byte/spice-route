-- ============================================================
-- Spice Route – Full Schema Migration
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ─── ENUMS ───────────────────────────────────────────────────
create type user_role as enum ('customer', 'admin', 'driver');
create type order_status as enum (
  'pending_payment', 'received', 'picking', 'packed',
  'out_for_delivery', 'delivered', 'cancelled', 'refunded'
);
create type delivery_type as enum ('home_delivery', 'click_and_collect');
create type loyalty_type as enum ('earn', 'redeem', 'expire', 'referral');
create type discount_type as enum ('percentage', 'fixed');

-- ─── USERS (extends auth.users) ──────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  full_name    text,
  phone        text,
  avatar_url   text,
  role         user_role not null default 'customer',
  dietary_prefs text[] default '{}',
  newsletter   boolean default false,
  referral_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  referred_by  uuid references public.profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── ADDRESSES ───────────────────────────────────────────────
create table public.addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  label        text,
  first_name   text not null,
  last_name    text not null,
  street_line1 text not null,
  street_line2 text,
  city         text not null,
  postal_code  text not null,
  country_code char(2) not null default 'NL',
  phone        text,
  is_default   boolean default false,
  created_at   timestamptz default now()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  parent_id   uuid references public.categories(id) on delete set null,
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── SUPPLIERS ───────────────────────────────────────────────
create table public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_name  text,
  email         text,
  phone         text,
  address       text,
  lead_time_days int default 7,
  notes         text,
  created_at    timestamptz default now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text not null default '',
  category_id      uuid references public.categories(id) on delete set null,
  brand            text,
  country_of_origin text,
  weight_grams     int,
  dietary_tags     text[] default '{}',
  allergens        text[] default '{}',
  nutritional_info jsonb,
  ean_barcode      text unique,
  is_active        boolean default true,
  is_featured      boolean default false,
  expiry_discount  boolean default false,
  search_vector    tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' ||
                           coalesce(brand, '') || ' ' ||
                           coalesce(description, '') || ' ' ||
                           coalesce(country_of_origin, ''))
  ) stored,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index products_search_idx on public.products using gin(search_vector);
create index products_category_idx on public.products(category_id);
create index products_slug_idx on public.products(slug);
create index products_trgm_idx on public.products using gin(name gin_trgm_ops);

-- ─── PRODUCT IMAGES ──────────────────────────────────────────
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt_text   text,
  sort_order int default 0,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- ─── PRODUCT VARIANTS ────────────────────────────────────────
create table public.product_variants (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products(id) on delete cascade,
  name                 text not null,  -- e.g. "1kg", "500g", "2x500g"
  sku                  text not null unique,
  price_eur            numeric(10,2) not null,
  compare_at_price_eur numeric(10,2),
  weight_grams         int,
  is_active            boolean default true,
  created_at           timestamptz default now()
);

-- ─── INVENTORY ───────────────────────────────────────────────
create table public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  variant_id          uuid not null unique references public.product_variants(id) on delete cascade,
  quantity            int not null default 0,
  low_stock_threshold int not null default 10,
  supplier_id         uuid references public.suppliers(id) on delete set null,
  cost_price_eur      numeric(10,2),
  expiry_date         date,
  updated_at          timestamptz default now()
);

-- ─── DELIVERY ZONES ──────────────────────────────────────────
create table public.delivery_zones (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  country_code             char(2) not null,
  postal_codes             text[] not null default '{}',
  postal_prefix            text,   -- e.g. "1" matches all NL postcodes starting with 1
  min_order_eur            numeric(10,2) default 30,
  delivery_fee_eur         numeric(10,2) default 4.99,
  free_delivery_above_eur  numeric(10,2) default 50,
  express_fee_eur          numeric(10,2) default 5,
  is_active                boolean default true
);

-- ─── DELIVERY SLOTS ──────────────────────────────────────────
create table public.delivery_slots (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  slot_label text not null,           -- "Morning (8–10)", "Afternoon (12–14)"
  start_time time not null,
  end_time   time not null,
  zone_id    uuid references public.delivery_zones(id) on delete cascade,
  capacity   int not null default 20,
  booked     int not null default 0,
  is_express boolean default false,
  created_at timestamptz default now(),
  constraint unique_slot unique (date, start_time, zone_id)
);

-- ─── PROMO CODES ─────────────────────────────────────────────
create table public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  description    text,
  discount_type  discount_type not null,
  discount_value numeric(10,2) not null,
  min_order_eur  numeric(10,2) default 0,
  max_uses       int,
  uses_count     int default 0,
  valid_from     timestamptz default now(),
  valid_until    timestamptz,
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- ─── ORDERS ──────────────────────────────────────────────────
create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  order_number             text not null unique default 'SR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6)),
  user_id                  uuid references public.profiles(id) on delete set null,
  guest_email              text,
  status                   order_status not null default 'pending_payment',
  delivery_type            delivery_type not null default 'home_delivery',
  delivery_address         jsonb,
  delivery_slot_id         uuid references public.delivery_slots(id),
  zone_id                  uuid references public.delivery_zones(id),
  payment_method           text,
  stripe_payment_intent_id text unique,
  stripe_charge_id         text,
  subtotal_eur             numeric(10,2) not null default 0,
  delivery_fee_eur         numeric(10,2) not null default 0,
  discount_eur             numeric(10,2) not null default 0,
  vat_eur                  numeric(10,2) not null default 0,
  total_eur                numeric(10,2) not null default 0,
  promo_code               text,
  loyalty_points_used      int default 0,
  loyalty_discount_eur     numeric(10,2) default 0,
  notes                    text,
  driver_id                uuid references public.profiles(id),
  country_code             char(2) default 'NL',
  vat_rate                 numeric(5,4) default 0.09,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  variant_id     uuid references public.product_variants(id) on delete set null,
  product_id     uuid references public.products(id) on delete set null,
  product_name   text not null,
  variant_name   text not null,
  quantity       int not null,
  unit_price_eur numeric(10,2) not null,
  total_price_eur numeric(10,2) not null,
  vat_rate       numeric(5,4) default 0.09,
  image_url      text
);

-- ─── REVIEWS ─────────────────────────────────────────────────
create table public.reviews (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references public.products(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  order_id              uuid references public.orders(id),
  rating                int not null check (rating between 1 and 5),
  title                 text,
  body                  text,
  image_urls            text[] default '{}',
  is_verified_purchase  boolean default false,
  is_approved           boolean default false,
  created_at            timestamptz default now(),
  constraint one_review_per_user_product unique (user_id, product_id)
);

create index reviews_product_idx on public.reviews(product_id);

-- ─── Q&A ─────────────────────────────────────────────────────
create table public.product_qa (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid references public.profiles(id),
  question    text not null,
  answer      text,
  answered_by uuid references public.profiles(id),
  is_visible  boolean default true,
  created_at  timestamptz default now()
);

-- ─── WISHLIST ────────────────────────────────────────────────
create table public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_wishlist unique (user_id, product_id)
);

-- ─── LOYALTY POINTS ──────────────────────────────────────────
create table public.loyalty_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  order_id    uuid references public.orders(id),
  points      int not null,
  type        loyalty_type not null,
  description text,
  created_at  timestamptz default now()
);

create index loyalty_user_idx on public.loyalty_transactions(user_id);

-- ─── BACK-IN-STOCK SUBSCRIPTIONS ─────────────────────────────
create table public.back_in_stock_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  notified   boolean default false,
  created_at timestamptz default now(),
  constraint unique_sub unique (email, product_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ─── RECIPES ─────────────────────────────────────────────────
create table public.recipes (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  image_url       text,
  prep_time_mins  int,
  cook_time_mins  int,
  servings        int,
  difficulty      text,
  instructions    text,
  is_published    boolean default false,
  created_at      timestamptz default now()
);

create table public.recipe_products (
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (recipe_id, product_id)
);

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  keys         jsonb not null,
  created_at   timestamptz default now()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on public.products
  for each row execute function public.handle_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();
create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.handle_updated_at();

-- ─── NEW USER TRIGGER ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── LOW STOCK ALERT FUNCTION ────────────────────────────────
create or replace function public.check_low_stock()
returns trigger language plpgsql as $$
begin
  if new.quantity <= new.low_stock_threshold and old.quantity > old.low_stock_threshold then
    insert into public.notifications (type, title, body, data)
    values (
      'low_stock',
      'Low Stock Alert',
      'A product is running low on stock',
      jsonb_build_object('variant_id', new.variant_id, 'quantity', new.quantity)
    );
  end if;
  return new;
end;
$$;

create trigger inventory_low_stock after update on public.inventory
  for each row execute function public.check_low_stock();

-- ─── DELIVERY SLOT BOOKING ───────────────────────────────────
create or replace function public.book_delivery_slot(p_slot_id uuid)
returns void language plpgsql as $$
begin
  update public.delivery_slots
  set booked = booked + 1
  where id = p_slot_id and booked < capacity;
  if not found then
    raise exception 'Slot is fully booked';
  end if;
end;
$$;

-- ─── ORDER STATS VIEW ────────────────────────────────────────
create or replace view public.order_stats as
select
  date_trunc('day', created_at) as day,
  count(*) as order_count,
  sum(total_eur) as revenue,
  avg(total_eur) as avg_order_value
from public.orders
where status not in ('pending_payment', 'cancelled')
group by 1;

-- ─── PRODUCT SALES RANK VIEW ─────────────────────────────────
create or replace view public.product_sales_rank as
select
  oi.product_id,
  p.name,
  sum(oi.quantity) as total_sold,
  sum(oi.total_price_eur) as total_revenue
from public.order_items oi
join public.products p on p.id = oi.product_id
join public.orders o on o.id = oi.order_id
where o.status not in ('pending_payment', 'cancelled')
group by oi.product_id, p.name
order by total_sold desc;
