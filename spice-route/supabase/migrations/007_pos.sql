-- ============================================================
-- Spice Route – POS (Point of Sale) support
-- ============================================================
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query),
-- then click RUN. Safe to run more than once.

-- 1. New staff role for cashiers (separate from full admins).
--    Enum value additions can't run inside a transaction block, so this is
--    its own statement. "if not exists" makes re-runs safe.
alter type user_role add value if not exists 'cashier';

-- 2. Mark where a sale came from, so reporting can split web vs in-store.
alter table public.orders
  add column if not exists channel text not null default 'web';

-- 3. Cash-handling fields for in-store sales (so receipts can show change).
alter table public.orders
  add column if not exists cash_received_eur numeric(10,2);
alter table public.orders
  add column if not exists change_due_eur numeric(10,2);

-- 4. Helpful index for the POS "today's sales" view.
create index if not exists orders_channel_idx on public.orders (channel);

-- ── How to promote a staff member to cashier (optional) ──────
-- update public.profiles set role = 'cashier' where email = 'staff@example.com';
-- (Admins can already use the POS.)
