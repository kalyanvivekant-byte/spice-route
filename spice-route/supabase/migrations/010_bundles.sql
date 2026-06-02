-- ============================================================
-- Spice Route – Bundles / Combos (MVP)
-- ============================================================
-- A bundle is a normal product flagged is_bundle = true (its own SKU,
-- price and stock). Shown in the auto "Bundles" collection with a badge.
-- Safe to run more than once.

alter table public.products add column if not exists is_bundle boolean not null default false;

-- Make the seeded Bundles collection auto-populate from is_bundle products
-- and surface it on the homepage.
update public.collections
  set type = 'bundles', show_on_home = true
  where slug = 'bundles';

-- If the Bundles collection doesn't exist yet, create it.
insert into public.collections (title, slug, subtitle, type, sort_order, show_on_home)
values ('Bundles', 'bundles', 'Save more with combo packs', 'bundles', 4, true)
on conflict (slug) do nothing;
