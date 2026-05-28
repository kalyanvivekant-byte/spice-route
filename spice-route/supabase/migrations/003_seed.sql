-- ============================================================
-- Seed Data – Categories + 50 Indian Grocery Products
-- ============================================================

-- ─── CATEGORIES ──────────────────────────────────────────────
insert into public.categories (id, name, slug, description, sort_order) values
  ('cat-flour',   'Flours & Grains',    'flours-grains',    'Atta, maida, besan and more',        1),
  ('cat-spices',  'Spices',             'spices',           'Whole and ground spices',             2),
  ('cat-lentils', 'Lentils & Pulses',   'lentils-pulses',   'Dal, rajma, chana and more',         3),
  ('cat-rice',    'Rice',               'rice',             'Basmati and other Indian rice',       4),
  ('cat-pickles', 'Pickles & Chutneys', 'pickles-chutneys', 'Achaar, chutney, murabba',           5),
  ('cat-frozen',  'Frozen Foods',       'frozen-foods',     'Ready meals, snacks, breads',         6),
  ('cat-bev',     'Beverages',          'beverages',        'Chai, lassi, juices',                 7),
  ('cat-snacks',  'Snacks',             'snacks',           'Namkeen, biscuits, sweets',           8),
  ('cat-pooja',   'Pooja Items',        'pooja-items',      'Agarbatti, diyas, puja essentials',   9),
  ('cat-care',    'Personal Care',      'personal-care',    'Ayurvedic and Indian beauty',        10),
  ('cat-fresh',   'Fresh Produce',      'fresh-produce',    'Fresh vegetables and herbs',         11);

-- ─── SUPPLIER ────────────────────────────────────────────────
insert into public.suppliers (id, name, contact_name, email, lead_time_days) values
  ('sup-01', 'Heera Foods BV', 'Raj Patel', 'raj@heerafoods.nl', 5),
  ('sup-02', 'TRS International', 'Anita Shah', 'anita@trs.eu', 7),
  ('sup-03', 'Patanjali Europe', 'Dev Kumar', 'dev@patanjalieurope.eu', 10);

-- ─── DELIVERY ZONES ──────────────────────────────────────────
insert into public.delivery_zones (id, name, country_code, postal_prefix, min_order_eur, delivery_fee_eur, free_delivery_above_eur, express_fee_eur) values
  ('zone-ams', 'Amsterdam & Region', 'NL', '1', 30, 3.99, 50, 5),
  ('zone-rtd', 'Rotterdam & Den Haag', 'NL', '2', 30, 3.99, 50, 5),
  ('zone-utd', 'Utrecht & Region', 'NL', '3', 30, 4.49, 50, 5),
  ('zone-nl-other', 'Netherlands Other', 'NL', '', 40, 4.99, 60, 7),
  ('zone-de-ber', 'Berlin', 'DE', '1', 45, 5.99, 70, 8),
  ('zone-de-other', 'Germany Other', 'DE', '', 50, 6.99, 80, 9),
  ('zone-fr-par', 'Paris & Île-de-France', 'FR', '75', 45, 5.99, 70, 8),
  ('zone-be-bru', 'Brussels & Antwerp', 'BE', '', 35, 4.99, 60, 6);

-- ─── PROMO CODES ─────────────────────────────────────────────
insert into public.promo_codes (code, description, discount_type, discount_value, min_order_eur, valid_until) values
  ('WELCOME10', 'Welcome 10% off first order', 'percentage', 10, 0, now() + interval '1 year'),
  ('DIWALI20', 'Diwali 20% off', 'percentage', 20, 30, now() + interval '30 days'),
  ('FREESHIP', 'Free shipping coupon', 'fixed', 5, 25, now() + interval '90 days'),
  ('HOLI15', 'Holi festival 15% off', 'percentage', 15, 20, now() + interval '60 days');

-- ─── 50 PRODUCTS ─────────────────────────────────────────────
-- Helper to create a product + default variant + inventory
-- Products are inserted directly for clarity

-- Flours & Grains (10 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-001', 'Heera Chapati Atta (Whole Wheat Flour)', 'heera-chapati-atta-5kg', 'Premium whole wheat flour (atta) for soft chapatis and rotis. Stone-ground for authentic flavour.', 'cat-flour', 'Heera', 'United Kingdom', 5000, array['vegan','vegetarian'], array['gluten','wheat'], true, true),
  ('prod-002', 'TRS Gram Flour (Besan)', 'trs-gram-flour-besan-2kg', 'Fine chickpea flour perfect for pakoras, dhokla, and traditional Indian sweets.', 'cat-flour', 'TRS', 'United Kingdom', 2000, array['vegan','vegetarian','gluten_free'], array['may contain traces of gluten'], true, false),
  ('prod-003', 'Patanjali Maida (Refined Flour)', 'patanjali-maida-5kg', 'Finely milled refined wheat flour for naan, paratha, and Indian pastries.', 'cat-flour', 'Patanjali', 'India', 5000, array['vegetarian'], array['gluten','wheat'], true, false),
  ('prod-004', 'Eastern Rava / Semolina (Sooji)', 'eastern-rava-semolina-1kg', 'Coarse semolina for upma, rava dosa, and halwa. Finely textured and easy to cook.', 'cat-flour', 'Eastern', 'India', 1000, array['vegan','vegetarian'], array['gluten','wheat'], true, false),
  ('prod-005', 'Heera Rice Flour (Chawal Ka Atta)', 'heera-rice-flour-1kg', 'Gluten-free rice flour for idli, dosa batter, and bhajiya coating.', 'cat-flour', 'Heera', 'United Kingdom', 1000, array['vegan','vegetarian','gluten_free'], array[]::text[], true, false),
  ('prod-006', 'TRS Poha (Flattened Rice) – Thick', 'trs-poha-thick-500g', 'Thick flattened rice for poha breakfast dish, chivda, and bhel.', 'cat-flour', 'TRS', 'India', 500, array['vegan','vegetarian','gluten_free'], array[]::text[], true, false),
  ('prod-007', 'Ashirvaad Multigrain Atta', 'ashirvaad-multigrain-atta-5kg', 'Blend of 6 grains – wheat, soya, oats, maize, psyllium, and chana for healthier rotis.', 'cat-flour', 'Ashirvaad', 'India', 5000, array['vegetarian'], array['gluten','wheat','soya','oats'], true, true),
  ('prod-008', 'Heera Bajra Flour (Pearl Millet)', 'heera-bajra-flour-1kg', 'Stone-ground pearl millet flour for bajra roti and thepla.', 'cat-flour', 'Heera', 'India', 1000, array['vegan','vegetarian','gluten_free'], array[]::text[], true, false),
  ('prod-009', 'TRS Jowar Flour (Sorghum)', 'trs-jowar-flour-1kg', 'Gluten-free sorghum flour for traditional jowar rotla.', 'cat-flour', 'TRS', 'India', 1000, array['vegan','vegetarian','gluten_free'], array[]::text[], true, false),
  ('prod-010', 'Heera Cornflour (Makki Ka Atta)', 'heera-cornflour-1kg', 'Maize flour for makki ki roti, sarson da saag pairing, and batter frying.', 'cat-flour', 'Heera', 'United Kingdom', 1000, array['vegan','vegetarian','gluten_free'], array[]::text[], true, false);

-- Spices (10 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-011', 'MDH Chana Masala', 'mdh-chana-masala-100g', 'Authentic spice blend for chana and chole. A household staple for generations.', 'cat-spices', 'MDH', 'India', 100, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-012', 'Everest Rajma Masala', 'everest-rajma-masala-100g', 'Premium spice blend crafted for rich and flavourful rajma curry.', 'cat-spices', 'Everest', 'India', 100, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-013', 'TRS Turmeric Powder (Haldi)', 'trs-turmeric-powder-400g', 'Bright yellow turmeric with a warm, earthy flavour. Essential in every Indian kitchen.', 'cat-spices', 'TRS', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-014', 'Heera Cumin Seeds (Jeera)', 'heera-cumin-seeds-400g', 'Whole cumin seeds for tempering dals, rice, and sabzis.', 'cat-spices', 'Heera', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-015', 'MDH Kitchen King Masala', 'mdh-kitchen-king-masala-100g', 'All-purpose blend of 14 spices – adds instant restaurant-style flavour.', 'cat-spices', 'MDH', 'India', 100, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-016', 'TRS Kashmiri Chilli Powder', 'trs-kashmiri-chilli-powder-400g', 'Mild Kashmiri chilli for vibrant red colour without excessive heat.', 'cat-spices', 'TRS', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-017', 'Heera Mustard Seeds (Rai)', 'heera-mustard-seeds-400g', 'Small black mustard seeds for tempering and pickling.', 'cat-spices', 'Heera', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array['mustard'], true, false),
  ('prod-018', 'MDH Garam Masala', 'mdh-garam-masala-100g', 'Classic garam masala with cardamom, cloves, and cinnamon for finishing curries.', 'cat-spices', 'MDH', 'India', 100, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-019', 'Heera Coriander Powder (Dhaniya)', 'heera-coriander-powder-400g', 'Ground coriander seed – a base spice for virtually all Indian curries.', 'cat-spices', 'Heera', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-020', 'TRS Fenugreek Seeds (Methi Dana)', 'trs-fenugreek-seeds-400g', 'Slightly bitter fenugreek seeds for dals, pickles, and spice tempering.', 'cat-spices', 'TRS', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false);

-- Lentils & Pulses (8 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-021', 'TRS Red Split Lentils (Masoor Dal)', 'trs-masoor-dal-2kg', 'Quick-cooking red lentils for dal tadka, soups, and khichdi.', 'cat-lentils', 'TRS', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-022', 'Heera Yellow Moong Dal (Split)', 'heera-yellow-moong-dal-2kg', 'Hulled split mung beans for light, easy-to-digest dal.', 'cat-lentils', 'Heera', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-023', 'TRS Chana Dal (Bengal Gram Split)', 'trs-chana-dal-2kg', 'Split bengal gram for dal, snacks, and besan production.', 'cat-lentils', 'TRS', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-024', 'Heera Toor Dal (Pigeon Peas)', 'heera-toor-dal-2kg', 'Arhar dal for authentic sambar and gujarati dal.', 'cat-lentils', 'Heera', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-025', 'TRS Whole Urad Dal (Black Gram)', 'trs-whole-urad-dal-2kg', 'Whole black gram for creamy dal makhani. Slow-cooked for rich texture.', 'cat-lentils', 'TRS', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-026', 'Heera Rajma (Red Kidney Beans)', 'heera-rajma-2kg', 'Dark red kidney beans for authentic Punjabi rajma chawal.', 'cat-lentils', 'Heera', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-027', 'TRS White Chickpeas (Kabuli Chana)', 'trs-kabuli-chana-2kg', 'Large white chickpeas for chole, hummus, and salads.', 'cat-lentils', 'TRS', 'India', 2000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-028', 'Heera Green Whole Moong (Sabut Moong)', 'heera-sabut-moong-1kg', 'Whole green mung beans for sprouts, curries, and moong khichdi.', 'cat-lentils', 'Heera', 'India', 1000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false);

-- Rice (5 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-029', 'Tilda Pure Basmati Rice', 'tilda-basmati-rice-5kg', 'Aged Himalayan basmati rice with long, slender grains. Aromatic and fluffy.', 'cat-rice', 'Tilda', 'India', 5000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-030', 'Heera Sona Masoori Rice', 'heera-sona-masoori-5kg', 'Medium-grain rice from Andhra Pradesh, ideal for everyday cooking and biryani.', 'cat-rice', 'Heera', 'India', 5000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-031', 'TRS Ponni Rice', 'trs-ponni-rice-5kg', 'South Indian ponni rice for idli and dosa batter and Kerala recipes.', 'cat-rice', 'TRS', 'India', 5000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-032', 'Dawat Brown Basmati Rice', 'dawat-brown-basmati-1kg', 'Wholegrain brown basmati – nutritious, high-fibre, and aromatic.', 'cat-rice', 'Dawat', 'India', 1000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-033', 'Heera Jeera Rice (Cumin Rice)', 'heera-jeera-rice-1kg', 'Pre-seasoned cumin rice mix. Ready in 10 minutes.', 'cat-rice', 'Heera', 'India', 1000, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false);

-- Pickles & Chutneys (5 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-034', 'Mothers Recipe Mango Pickle (Aam Ka Achar)', 'mothers-recipe-mango-pickle-500g', 'Spicy raw mango pickle in mustard oil. Traditional Punjabi recipe.', 'cat-pickles', 'Mothers Recipe', 'India', 500, array['vegan','vegetarian','gluten_free','halal'], array['mustard'], true, true),
  ('prod-035', 'Patak''s Lime Pickle', 'pataks-lime-pickle-283g', 'Tangy whole lime pickle with chilli – classic British-Indian condiment.', 'cat-pickles', 'Patak''s', 'United Kingdom', 283, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-036', 'Heera Garlic Chilli Chutney', 'heera-garlic-chilli-chutney-300g', 'Ready-to-serve garlic and chilli chutney for snacks and chaats.', 'cat-pickles', 'Heera', 'India', 300, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-037', 'Patak''s Brinjal (Aubergine) Pickle', 'pataks-brinjal-pickle-283g', 'Smoky aubergine pickle with traditional Indian spices.', 'cat-pickles', 'Patak''s', 'United Kingdom', 283, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-038', 'Mothers Recipe Mixed Pickle', 'mothers-recipe-mixed-pickle-500g', 'Assorted vegetable pickle – carrot, raw mango, and lime.', 'cat-pickles', 'Mothers Recipe', 'India', 500, array['vegan','vegetarian','gluten_free'], array['mustard'], true, false);

-- Beverages (5 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-039', 'Tata Tea Gold', 'tata-tea-gold-500g', 'Premium Assam and Darjeeling tea blend. Strong, aromatic, and perfect for masala chai.', 'cat-bev', 'Tata Tea', 'India', 500, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-040', 'Wagh Bakri Masala Chai', 'wagh-bakri-masala-chai-250g', 'Authentic spiced masala chai with cardamom, ginger, and pepper.', 'cat-bev', 'Wagh Bakri', 'India', 250, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-041', 'Rose Sharbat (Rooh Afza)', 'rooh-afza-rose-sharbat-800ml', 'Concentrated rose syrup for refreshing summer drinks and faloodas.', 'cat-bev', 'Rooh Afza', 'India', 800, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-042', 'Patanjali Aam Panna Mix', 'patanjali-aam-panna-mix-500g', 'Raw mango summer cooler mix with cumin and black salt.', 'cat-bev', 'Patanjali', 'India', 500, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-043', 'Amul Lassi (Mango)', 'amul-mango-lassi-200ml', 'Ready-to-drink mango yoghurt drink – sweet and refreshing.', 'cat-bev', 'Amul', 'India', 200, array['vegetarian','gluten_free','halal'], array['milk'], true, false);

-- Snacks (5 products)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-044', 'Haldiram Aloo Bhujia', 'haldiram-aloo-bhujia-400g', 'Crispy potato straw snack with spices. A beloved Indian teatime classic.', 'cat-snacks', 'Haldiram', 'India', 400, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, true),
  ('prod-045', 'Parle-G Biscuits', 'parle-g-biscuits-800g', 'Iconic Indian glucose biscuit, enjoyed for over 80 years. Perfect with chai.', 'cat-snacks', 'Parle', 'India', 800, array['vegetarian'], array['gluten','wheat','milk'], true, true),
  ('prod-046', 'Haldiram Khatta Meetha Mix', 'haldiram-khatta-meetha-400g', 'Sweet and sour trail mix with sev, peanuts, puffed rice, and spices.', 'cat-snacks', 'Haldiram', 'India', 400, array['vegan','vegetarian','halal'], array['gluten','peanuts'], true, false),
  ('prod-047', 'TRS Papadums (Plain)', 'trs-plain-papadums-200g', 'Thin crispy lentil wafers. Microwave, fry, or grill in seconds.', 'cat-snacks', 'TRS', 'India', 200, array['vegan','vegetarian','gluten_free','halal'], array[]::text[], true, false),
  ('prod-048', 'Bikano Namkeen Mixture', 'bikano-namkeen-mixture-400g', 'Classic Indian snack mix with cashews, raisins, and spiced sev.', 'cat-snacks', 'Bikano', 'India', 400, array['vegan','vegetarian'], array['gluten','peanuts','tree nuts'], true, false);

-- Pooja Items (1 product)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-049', 'Cycle Brand Agarbatti (Jasmine)', 'cycle-agarbatti-jasmine-120sticks', 'Premium jasmine incense sticks for puja and meditation. Burns for 40 minutes each.', 'cat-pooja', 'Cycle', 'India', 60, array[]::text[], array[]::text[], true, false);

-- Personal Care (1 product)
insert into public.products (id, name, slug, description, category_id, brand, country_of_origin, weight_grams, dietary_tags, allergens, is_active, is_featured) values
  ('prod-050', 'Patanjali Kesh Kanti Hair Cleanser', 'patanjali-kesh-kanti-200ml', 'Ayurvedic herbal shampoo with neem, aloe vera, and bhringraj. SLS-free.', 'cat-care', 'Patanjali', 'India', 200, array[]::text[], array[]::text[], true, false);

-- ─── PRODUCT VARIANTS ─────────────────────────────────────────
-- One variant per product for seed; production would have multiple

insert into public.product_variants (id, product_id, name, sku, price_eur, compare_at_price_eur) values
  ('var-001', 'prod-001', '5kg', 'SKU-001-5KG', 8.99, 11.99),
  ('var-002', 'prod-002', '2kg', 'SKU-002-2KG', 4.49, null),
  ('var-003', 'prod-003', '5kg', 'SKU-003-5KG', 7.49, null),
  ('var-004', 'prod-004', '1kg', 'SKU-004-1KG', 2.49, null),
  ('var-005', 'prod-005', '1kg', 'SKU-005-1KG', 2.79, null),
  ('var-006', 'prod-006', '500g', 'SKU-006-500G', 1.99, null),
  ('var-007', 'prod-007', '5kg', 'SKU-007-5KG', 9.99, 12.49),
  ('var-008', 'prod-008', '1kg', 'SKU-008-1KG', 2.29, null),
  ('var-009', 'prod-009', '1kg', 'SKU-009-1KG', 2.29, null),
  ('var-010', 'prod-010', '1kg', 'SKU-010-1KG', 2.19, null),
  ('var-011', 'prod-011', '100g', 'SKU-011-100G', 1.79, null),
  ('var-012', 'prod-012', '100g', 'SKU-012-100G', 1.79, null),
  ('var-013', 'prod-013', '400g', 'SKU-013-400G', 2.49, null),
  ('var-014', 'prod-014', '400g', 'SKU-014-400G', 2.19, null),
  ('var-015', 'prod-015', '100g', 'SKU-015-100G', 1.99, 2.49),
  ('var-016', 'prod-016', '400g', 'SKU-016-400G', 2.49, null),
  ('var-017', 'prod-017', '400g', 'SKU-017-400G', 1.99, null),
  ('var-018', 'prod-018', '100g', 'SKU-018-100G', 1.99, null),
  ('var-019', 'prod-019', '400g', 'SKU-019-400G', 2.19, null),
  ('var-020', 'prod-020', '400g', 'SKU-020-400G', 1.99, null),
  ('var-021', 'prod-021', '2kg', 'SKU-021-2KG', 4.29, null),
  ('var-022', 'prod-022', '2kg', 'SKU-022-2KG', 4.49, null),
  ('var-023', 'prod-023', '2kg', 'SKU-023-2KG', 4.29, null),
  ('var-024', 'prod-024', '2kg', 'SKU-024-2KG', 4.49, null),
  ('var-025', 'prod-025', '2kg', 'SKU-025-2KG', 4.79, null),
  ('var-026', 'prod-026', '2kg', 'SKU-026-2KG', 4.99, null),
  ('var-027', 'prod-027', '2kg', 'SKU-027-2KG', 4.49, null),
  ('var-028', 'prod-028', '1kg', 'SKU-028-1KG', 2.49, null),
  ('var-029', 'prod-029', '5kg', 'SKU-029-5KG', 14.99, 17.99),
  ('var-030', 'prod-030', '5kg', 'SKU-030-5KG', 9.99, null),
  ('var-031', 'prod-031', '5kg', 'SKU-031-5KG', 9.49, null),
  ('var-032', 'prod-032', '1kg', 'SKU-032-1KG', 4.99, null),
  ('var-033', 'prod-033', '1kg', 'SKU-033-1KG', 3.49, null),
  ('var-034', 'prod-034', '500g', 'SKU-034-500G', 3.99, null),
  ('var-035', 'prod-035', '283g', 'SKU-035-283G', 2.99, null),
  ('var-036', 'prod-036', '300g', 'SKU-036-300G', 2.79, null),
  ('var-037', 'prod-037', '283g', 'SKU-037-283G', 2.99, null),
  ('var-038', 'prod-038', '500g', 'SKU-038-500G', 3.79, null),
  ('var-039', 'prod-039', '500g', 'SKU-039-500G', 5.99, null),
  ('var-040', 'prod-040', '250g', 'SKU-040-250G', 4.49, null),
  ('var-041', 'prod-041', '800ml', 'SKU-041-800ML', 6.99, null),
  ('var-042', 'prod-042', '500g', 'SKU-042-500G', 3.49, null),
  ('var-043', 'prod-043', '200ml', 'SKU-043-200ML', 1.49, null),
  ('var-044', 'prod-044', '400g', 'SKU-044-400G', 3.99, null),
  ('var-045', 'prod-045', '800g', 'SKU-045-800G', 3.29, null),
  ('var-046', 'prod-046', '400g', 'SKU-046-400G', 3.79, null),
  ('var-047', 'prod-047', '200g', 'SKU-047-200G', 1.99, null),
  ('var-048', 'prod-048', '400g', 'SKU-048-400G', 3.99, null),
  ('var-049', 'prod-049', '120 sticks', 'SKU-049-120', 2.99, null),
  ('var-050', 'prod-050', '200ml', 'SKU-050-200ML', 3.49, null);

-- ─── INVENTORY ────────────────────────────────────────────────
insert into public.inventory (variant_id, quantity, low_stock_threshold, supplier_id, cost_price_eur)
select
  id as variant_id,
  (random() * 200 + 20)::int as quantity,
  10 as low_stock_threshold,
  'sup-01' as supplier_id,
  price_eur * 0.55 as cost_price_eur
from public.product_variants;
