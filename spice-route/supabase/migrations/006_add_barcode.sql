-- Add a barcode (EAN/UPC) column to product variants so stock can be added by scanning.
-- Nullable + unique so each scanned barcode maps to exactly one variant.

alter table public.product_variants
  add column if not exists barcode text;

create unique index if not exists product_variants_barcode_key
  on public.product_variants (barcode)
  where barcode is not null;
