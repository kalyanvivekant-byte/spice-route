-- ============================================================
-- Spice Route – Shopify-style admin features
-- ============================================================
-- order timeline/notes, inventory audit log, order tags, customer notes.
-- Safe to run more than once.

-- ─── ORDER EVENTS (timeline + notes) ─────────────────────────
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  type       text not null default 'note',   -- note | status | refund | fulfilment | payment
  message    text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ─── INVENTORY ADJUSTMENTS (audit log) ───────────────────────
create table if not exists public.inventory_adjustments (
  id           uuid primary key default gen_random_uuid(),
  variant_id   uuid references public.product_variants(id) on delete set null,
  delta        int not null,                  -- +received / -sold / correction
  new_quantity int not null,
  reason       text,                          -- received | correction | sale | damage | count
  supplier_id  uuid references public.suppliers(id) on delete set null,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now()
);
create index if not exists inventory_adjustments_variant_idx on public.inventory_adjustments (variant_id, created_at desc);

-- ─── ORDER TAGS + CUSTOMER NOTES ─────────────────────────────
alter table public.orders   add column if not exists tags text[] not null default '{}';
alter table public.profiles add column if not exists admin_notes text;

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.order_events enable row level security;
alter table public.inventory_adjustments enable row level security;

do $$ begin
  create policy "Admin manage order_events" on public.order_events using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Admin manage inventory_adjustments" on public.inventory_adjustments using (public.is_admin());
exception when duplicate_object then null; end $$;
