ALTER TABLE public.products ADD COLUMN IF NOT EXISTS editions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS edition_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS edition_price_cents integer;