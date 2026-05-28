-- Decrement inventory safely
create or replace function public.decrement_inventory(p_variant_id uuid, p_qty int)
returns void language plpgsql as $$
begin
  update public.inventory
  set quantity = greatest(0, quantity - p_qty)
  where variant_id = p_variant_id;
end;
$$;

-- Get product with full details for a slug (optimised single query)
create or replace function public.get_product_by_slug(p_slug text)
returns json language sql security definer as $$
  select row_to_json(p) from (
    select
      pr.*,
      c.name as category_name,
      c.slug as category_slug,
      coalesce(
        json_agg(distinct jsonb_build_object('id', pi.id, 'url', pi.url, 'is_primary', pi.is_primary, 'sort_order', pi.sort_order))
        filter (where pi.id is not null), '[]'
      ) as images,
      coalesce(
        json_agg(distinct jsonb_build_object('id', pv.id, 'name', pv.name, 'sku', pv.sku, 'price_eur', pv.price_eur, 'compare_at_price_eur', pv.compare_at_price_eur, 'quantity', inv.quantity))
        filter (where pv.id is not null), '[]'
      ) as variants
    from public.products pr
    left join public.categories c on c.id = pr.category_id
    left join public.product_images pi on pi.product_id = pr.id
    left join public.product_variants pv on pv.product_id = pr.id and pv.is_active = true
    left join public.inventory inv on inv.variant_id = pv.id
    where pr.slug = p_slug and pr.is_active = true
    group by pr.id, c.name, c.slug
  ) p
$$;

-- User's loyalty balance
create or replace function public.get_loyalty_balance(p_user_id uuid)
returns int language sql security definer as $$
  select coalesce(sum(points), 0)::int
  from public.loyalty_transactions
  where user_id = p_user_id
$$;

-- Validate delivery zone by postal code
create or replace function public.get_delivery_zone(p_postal_code text, p_country_code text)
returns uuid language sql as $$
  select id from public.delivery_zones
  where country_code = p_country_code
    and is_active = true
    and (
      p_postal_code = any(postal_codes)
      or (postal_prefix is not null and p_postal_code like postal_prefix || '%')
    )
  limit 1
$$;

-- Admin: anonymise user (GDPR right to erasure)
create or replace function public.anonymise_user(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles set
    full_name = 'Deleted User',
    phone = null,
    avatar_url = null,
    dietary_prefs = '{}',
    newsletter = false
  where id = p_user_id;

  update public.addresses set
    first_name = 'Deleted',
    last_name = 'User',
    street_line1 = 'REDACTED',
    street_line2 = null,
    phone = null
  where user_id = p_user_id;

  -- Keep orders for accounting but anonymise
  update public.orders set
    delivery_address = null,
    notes = null
  where user_id = p_user_id;

  delete from public.wishlists where user_id = p_user_id;
  delete from public.push_subscriptions where user_id = p_user_id;
  delete from public.back_in_stock_subscriptions where email = (
    select email from public.profiles where id = p_user_id
  );
end;
$$;
