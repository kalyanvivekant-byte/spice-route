-- ============================================================
-- Spice Route – Subcategories (for the mega-menu)
-- ============================================================
-- Adds child categories under the 11 existing top categories.
-- Parent is resolved by slug (category ids are UUIDs).
-- Safe to run more than once (conflict on slug is ignored).

insert into public.categories (name, slug, parent_id, sort_order)
select v.name, v.slug, p.id, v.sort_order
from (values
  ('Wheat / Chapati Flour',        'wheat-chapati-flour',     'flours-grains',    1),
  ('Multigrain & Specialty Flour', 'multigrain-flour',        'flours-grains',    2),
  ('Besan & Gram Flour',           'besan-gram-flour',        'flours-grains',    3),
  ('Rice Flour',                   'rice-flour',              'flours-grains',    4),
  ('Semolina & Rava',              'semolina-rava',           'flours-grains',    5),

  ('Whole Spices',                 'whole-spices',            'spices',           1),
  ('Ground Spices',                'ground-spices',           'spices',           2),
  ('Spice Blends (Masala)',        'spice-blends',            'spices',           3),
  ('Cooking Pastes',               'cooking-pastes',          'spices',           4),
  ('Salt & Asafoetida',            'salt-asafoetida',         'spices',           5),

  ('Toor & Arhar Dal',             'toor-arhar-dal',          'lentils-pulses',   1),
  ('Moong Dal',                    'moong-dal',               'lentils-pulses',   2),
  ('Chana & Chickpeas',            'chana-chickpeas',         'lentils-pulses',   3),
  ('Urad Dal',                     'urad-dal',                'lentils-pulses',   4),
  ('Rajma & Beans',                'rajma-beans',             'lentils-pulses',   5),

  ('Basmati Rice',                 'basmati-rice',            'rice',             1),
  ('Sona Masoori',                 'sona-masoori',            'rice',             2),
  ('Idli & Dosa Rice',             'idli-dosa-rice',          'rice',             3),
  ('Poha & Flattened Rice',        'poha-flattened-rice',     'rice',             4),

  ('Mango Pickle',                 'mango-pickle',            'pickles-chutneys', 1),
  ('Mixed & Lime Pickle',          'mixed-lime-pickle',       'pickles-chutneys', 2),
  ('Chutneys',                     'chutneys',                'pickles-chutneys', 3),
  ('Sauces & Pastes',              'sauces-pastes',           'pickles-chutneys', 4),

  ('Parathas & Naan',              'parathas-naan',           'frozen-foods',     1),
  ('Samosas & Snacks',             'frozen-samosas-snacks',   'frozen-foods',     2),
  ('Frozen Vegetables',            'frozen-vegetables',       'frozen-foods',     3),
  ('Paneer & Dairy',               'paneer-dairy',            'frozen-foods',     4),

  ('Tea',                          'tea',                     'beverages',        1),
  ('Coffee',                       'coffee',                  'beverages',        2),
  ('Drink Mixes',                  'drink-mixes',             'beverages',        3),
  ('Soft Drinks & Juices',         'soft-drinks-juices',      'beverages',        4),

  ('Namkeen',                      'namkeen',                 'snacks',           1),
  ('Biscuits & Cookies',           'biscuits-cookies',        'snacks',           2),
  ('Sweets',                       'sweets',                  'snacks',           3),
  ('Papad & Fryums',               'papad-fryums',            'snacks',           4),

  ('Agarbatti & Dhoop',            'agarbatti-dhoop',         'pooja-items',      1),
  ('Diyas & Lamps',                'diyas-lamps',             'pooja-items',      2),
  ('Puja Essentials',              'puja-essentials',         'pooja-items',      3),

  ('Hair Care',                    'hair-care',               'personal-care',    1),
  ('Skin & Body',                  'skin-body',               'personal-care',    2),
  ('Ayurveda & Wellness',          'ayurveda-wellness',       'personal-care',    3),
  ('Oral Care',                    'oral-care',               'personal-care',    4),

  ('Vegetables',                   'fresh-vegetables',        'fresh-produce',    1),
  ('Herbs & Chillies',             'herbs-chillies',          'fresh-produce',    2),
  ('Fruits',                       'fresh-fruits',            'fresh-produce',    3)
) as v(name, slug, parent_slug, sort_order)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;
