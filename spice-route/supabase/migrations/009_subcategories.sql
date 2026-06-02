-- ============================================================
-- Spice Route – Subcategories (for the mega-menu)
-- ============================================================
-- Adds child categories under the 11 existing top categories.
-- parent_id points at the original category ids from seed 003.
-- Safe to run more than once (conflict on slug is ignored).

insert into public.categories (name, slug, parent_id, sort_order) values
  -- Flours & Grains
  ('Wheat / Chapati Flour',        'wheat-chapati-flour',     'cat-flour', 1),
  ('Multigrain & Specialty Flour', 'multigrain-flour',        'cat-flour', 2),
  ('Besan & Gram Flour',           'besan-gram-flour',        'cat-flour', 3),
  ('Rice Flour',                   'rice-flour',              'cat-flour', 4),
  ('Semolina & Rava',              'semolina-rava',           'cat-flour', 5),

  -- Spices
  ('Whole Spices',                 'whole-spices',            'cat-spices', 1),
  ('Ground Spices',                'ground-spices',           'cat-spices', 2),
  ('Spice Blends (Masala)',        'spice-blends',            'cat-spices', 3),
  ('Cooking Pastes',               'cooking-pastes',          'cat-spices', 4),
  ('Salt & Asafoetida',            'salt-asafoetida',         'cat-spices', 5),

  -- Lentils & Pulses
  ('Toor & Arhar Dal',             'toor-arhar-dal',          'cat-lentils', 1),
  ('Moong Dal',                    'moong-dal',               'cat-lentils', 2),
  ('Chana & Chickpeas',            'chana-chickpeas',         'cat-lentils', 3),
  ('Urad Dal',                     'urad-dal',                'cat-lentils', 4),
  ('Rajma & Beans',                'rajma-beans',             'cat-lentils', 5),

  -- Rice
  ('Basmati Rice',                 'basmati-rice',            'cat-rice', 1),
  ('Sona Masoori',                 'sona-masoori',            'cat-rice', 2),
  ('Idli & Dosa Rice',             'idli-dosa-rice',          'cat-rice', 3),
  ('Poha & Flattened Rice',        'poha-flattened-rice',     'cat-rice', 4),

  -- Pickles & Chutneys
  ('Mango Pickle',                 'mango-pickle',            'cat-pickles', 1),
  ('Mixed & Lime Pickle',          'mixed-lime-pickle',       'cat-pickles', 2),
  ('Chutneys',                     'chutneys',                'cat-pickles', 3),
  ('Sauces & Pastes',              'sauces-pastes',           'cat-pickles', 4),

  -- Frozen Foods
  ('Parathas & Naan',              'parathas-naan',           'cat-frozen', 1),
  ('Samosas & Snacks',             'frozen-samosas-snacks',   'cat-frozen', 2),
  ('Frozen Vegetables',            'frozen-vegetables',       'cat-frozen', 3),
  ('Paneer & Dairy',               'paneer-dairy',            'cat-frozen', 4),

  -- Beverages
  ('Tea',                          'tea',                     'cat-bev', 1),
  ('Coffee',                       'coffee',                  'cat-bev', 2),
  ('Drink Mixes',                  'drink-mixes',             'cat-bev', 3),
  ('Soft Drinks & Juices',         'soft-drinks-juices',      'cat-bev', 4),

  -- Snacks
  ('Namkeen',                      'namkeen',                 'cat-snacks', 1),
  ('Biscuits & Cookies',           'biscuits-cookies',        'cat-snacks', 2),
  ('Sweets',                       'sweets',                  'cat-snacks', 3),
  ('Papad & Fryums',               'papad-fryums',            'cat-snacks', 4),

  -- Pooja Items
  ('Agarbatti & Dhoop',            'agarbatti-dhoop',         'cat-pooja', 1),
  ('Diyas & Lamps',                'diyas-lamps',             'cat-pooja', 2),
  ('Puja Essentials',              'puja-essentials',         'cat-pooja', 3),

  -- Personal Care
  ('Hair Care',                    'hair-care',               'cat-care', 1),
  ('Skin & Body',                  'skin-body',               'cat-care', 2),
  ('Ayurveda & Wellness',          'ayurveda-wellness',       'cat-care', 3),
  ('Oral Care',                    'oral-care',               'cat-care', 4),

  -- Fresh Produce
  ('Vegetables',                   'fresh-vegetables',        'cat-fresh', 1),
  ('Herbs & Chillies',             'herbs-chillies',          'cat-fresh', 2),
  ('Fruits',                       'fresh-fruits',            'cat-fresh', 3)
on conflict (slug) do nothing;
