-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.suppliers enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_slots enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.product_qa enable row level security;
alter table public.wishlists enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.back_in_stock_subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_products enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ─── PROFILES ────────────────────────────────────────────────
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admin full access profiles" on public.profiles
  using (public.is_admin());

-- ─── ADDRESSES ───────────────────────────────────────────────
create policy "Users manage own addresses" on public.addresses
  using (auth.uid() = user_id);
create policy "Admin read addresses" on public.addresses
  for select using (public.is_admin());

-- ─── CATEGORIES (public read) ────────────────────────────────
create policy "Public read categories" on public.categories
  for select using (is_active = true);
create policy "Admin manage categories" on public.categories
  using (public.is_admin());

-- ─── PRODUCTS (public read) ──────────────────────────────────
create policy "Public read active products" on public.products
  for select using (is_active = true);
create policy "Admin manage products" on public.products
  using (public.is_admin());

-- ─── PRODUCT IMAGES ──────────────────────────────────────────
create policy "Public read product images" on public.product_images
  for select using (true);
create policy "Admin manage product images" on public.product_images
  using (public.is_admin());

-- ─── PRODUCT VARIANTS ────────────────────────────────────────
create policy "Public read active variants" on public.product_variants
  for select using (is_active = true);
create policy "Admin manage variants" on public.product_variants
  using (public.is_admin());

-- ─── INVENTORY ───────────────────────────────────────────────
create policy "Public read inventory (qty only)" on public.inventory
  for select using (true);
create policy "Admin manage inventory" on public.inventory
  using (public.is_admin());

-- ─── SUPPLIERS ───────────────────────────────────────────────
create policy "Admin manage suppliers" on public.suppliers
  using (public.is_admin());

-- ─── DELIVERY ZONES & SLOTS ──────────────────────────────────
create policy "Public read active zones" on public.delivery_zones
  for select using (is_active = true);
create policy "Admin manage zones" on public.delivery_zones
  using (public.is_admin());
create policy "Public read slots" on public.delivery_slots
  for select using (true);
create policy "Admin manage slots" on public.delivery_slots
  using (public.is_admin());

-- ─── PROMO CODES ─────────────────────────────────────────────
create policy "Admin manage promo codes" on public.promo_codes
  using (public.is_admin());
-- Allow authenticated users to validate codes (read only)
create policy "Auth users read active codes" on public.promo_codes
  for select using (auth.uid() is not null and is_active = true);

-- ─── ORDERS ──────────────────────────────────────────────────
create policy "Users read own orders" on public.orders
  for select using (auth.uid() = user_id);
create policy "Users insert orders" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "Admin full access orders" on public.orders
  using (public.is_admin());
create policy "Driver read assigned orders" on public.orders
  for select using (auth.uid() = driver_id);
create policy "Driver update order status" on public.orders
  for update using (auth.uid() = driver_id);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
create policy "Users read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );
create policy "Admin full access order items" on public.order_items
  using (public.is_admin());

-- ─── REVIEWS ─────────────────────────────────────────────────
create policy "Public read approved reviews" on public.reviews
  for select using (is_approved = true);
create policy "Users manage own reviews" on public.reviews
  using (auth.uid() = user_id);
create policy "Admin manage reviews" on public.reviews
  using (public.is_admin());

-- ─── Q&A ─────────────────────────────────────────────────────
create policy "Public read visible qa" on public.product_qa
  for select using (is_visible = true);
create policy "Auth users post questions" on public.product_qa
  for insert with check (auth.uid() is not null);
create policy "Admin manage qa" on public.product_qa
  using (public.is_admin());

-- ─── WISHLISTS ───────────────────────────────────────────────
create policy "Users manage own wishlist" on public.wishlists
  using (auth.uid() = user_id);

-- ─── LOYALTY ─────────────────────────────────────────────────
create policy "Users read own loyalty" on public.loyalty_transactions
  for select using (auth.uid() = user_id);
create policy "Admin manage loyalty" on public.loyalty_transactions
  using (public.is_admin());

-- ─── BACK IN STOCK ───────────────────────────────────────────
create policy "Users manage own subscriptions" on public.back_in_stock_subscriptions
  using (true); -- email-based, no auth required

-- ─── NOTIFICATIONS ───────────────────────────────────────────
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id or user_id is null);
create policy "Admin manage notifications" on public.notifications
  using (public.is_admin());

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────
create policy "Users manage own push subs" on public.push_subscriptions
  using (auth.uid() = user_id);

-- ─── RECIPES ─────────────────────────────────────────────────
create policy "Public read published recipes" on public.recipes
  for select using (is_published = true);
create policy "Admin manage recipes" on public.recipes
  using (public.is_admin());
create policy "Public read recipe products" on public.recipe_products
  for select using (true);
create policy "Admin manage recipe products" on public.recipe_products
  using (public.is_admin());
