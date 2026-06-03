-- ============================================================
-- Spice Route – Shipments (Sendcloud integration)
-- ============================================================
-- One shipment per fulfilled order (label + tracking). Safe to re-run.

create table if not exists public.shipments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  provider           text not null default 'sendcloud',
  sendcloud_parcel_id text,
  carrier            text,
  method_name        text,
  tracking_number    text,
  tracking_url       text,
  label_url          text,
  status             text default 'created',
  weight_grams       int,
  cost_eur           numeric(10,2),
  created_by         uuid references public.profiles(id),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists shipments_order_idx on public.shipments (order_id);
create index if not exists shipments_tracking_idx on public.shipments (tracking_number);

alter table public.shipments enable row level security;

do $$ begin
  create policy "Admin manage shipments" on public.shipments using (public.is_admin());
exception when duplicate_object then null; end $$;

-- Public can read a shipment by tracking number (for the storefront tracking page).
do $$ begin
  create policy "Public read shipments" on public.shipments for select using (true);
exception when duplicate_object then null; end $$;

drop trigger if exists shipments_updated_at on public.shipments;
create trigger shipments_updated_at before update on public.shipments
  for each row execute function public.handle_updated_at();
