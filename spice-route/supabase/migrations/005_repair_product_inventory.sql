-- 005_repair_product_inventory.sql
-- One-off repair so products + stock show on the storefront.
-- Run in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Safe to run more than once.

-- 1. Make every product active so it appears in storefront queries.
--    (Remove this if you intentionally keep some products hidden.)
update public.products
set is_active = true
where is_active is distinct from true;

-- 2. Give any product with NO variant a default variant.
--    Price defaults to €0.00 — update prices afterwards in Admin → Products.
insert into public.product_variants (product_id, name, sku, price_eur, is_active)
select p.id,
       'Default',
       'AUTO-' || left(replace(p.id::text, '-', ''), 12),
       0,
       true
from public.products p
where not exists (
  select 1 from public.product_variants v where v.product_id = p.id
);

-- 3. Activate any inactive variants (storefront only shows active variants).
update public.product_variants
set is_active = true
where is_active is distinct from true;

-- 4. Give any variant with NO inventory row a stock row (qty 0).
--    Update real quantities afterwards in Admin → Inventory.
insert into public.inventory (variant_id, quantity, low_stock_threshold)
select v.id, 0, 10
from public.product_variants v
where not exists (
  select 1 from public.inventory i where i.variant_id = v.id
);

-- 5. Quick check — every product should now have variants and stock rows.
select p.name,
       p.is_active,
       count(distinct v.id)  as variants,
       coalesce(sum(i.quantity), 0) as total_stock
from public.products p
left join public.product_variants v on v.product_id = p.id
left join public.inventory i on i.variant_id = v.id
group by p.id, p.name, p.is_active
order by p.name;
