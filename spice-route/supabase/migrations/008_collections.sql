-- ============================================================
-- Spice Route – Collections + Banners (merchandising)
-- ============================================================
-- Run in Supabase SQL editor. Safe to run more than once.

-- ─── COLLECTIONS ─────────────────────────────────────────────
-- type drives how products are resolved:
--   'manual'       → explicit list in collection_products
--   'new_arrivals' → newest active products
--   'on_sale'      → products with a compare-at price > price
--   'bestsellers'  → most units sold (falls back to featured)
--   'featured'     → is_featured products
create table if not exists public.collections (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  subtitle     text,
  type         text not null default 'manual',
  sort_order   int  not null default 0,
  is_active    boolean not null default true,
  show_on_home boolean not null default false,
  created_at   timestamptz default now()
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  sort_order    int  not null default 0,
  primary key (collection_id, product_id)
);

-- ─── BANNERS (homepage carousel) ─────────────────────────────
create table if not exists public.banners (
  id               uuid primary key default gen_random_uuid(),
  title            text,
  image_url        text not null,
  mobile_image_url text,
  link_url         text,
  sort_order       int not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.banners enable row level security;

do $$ begin
  create policy "Public read active collections" on public.collections
    for select using (is_active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Admin manage collections" on public.collections
    using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read collection_products" on public.collection_products
    for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Admin manage collection_products" on public.collection_products
    using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read active banners" on public.banners
    for select using (is_active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Admin manage banners" on public.banners
    using (public.is_admin());
exception when duplicate_object then null; end $$;

-- ─── SEED default dynamic collections ────────────────────────
insert into public.collections (title, slug, subtitle, type, sort_order, show_on_home)
values
  ('Bestsellers',  'bestsellers',  'Our most-loved products',        'bestsellers',  1, true),
  ('New Arrivals', 'new-arrivals', 'Fresh on the shelves',           'new_arrivals', 2, true),
  ('On Sale',      'on-sale',      'Discounts while stocks last',    'on_sale',      3, true),
  ('Bundles',      'bundles',      'Save more with combo packs',     'manual',       4, false)
on conflict (slug) do nothing;
