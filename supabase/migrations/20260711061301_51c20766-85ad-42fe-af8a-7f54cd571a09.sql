-- Add a short, human-readable, unique order reference number.
-- The UUID id remains the primary key; this is a friendlier lookup key.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text;

-- Backfill existing rows with a unique short code.
DO $$
DECLARE
  r record;
  candidate text;
BEGIN
  FOR r IN SELECT id FROM public.orders WHERE order_number IS NULL LOOP
    LOOP
      candidate := 'TRX-' || upper(substring(md5(random()::text || clock_timestamp()::text || r.id::text) from 1 for 8));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate);
    END LOOP;
    UPDATE public.orders SET order_number = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- Enforce non-null + uniqueness going forward.
ALTER TABLE public.orders
  ALTER COLUMN order_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key
  ON public.orders(order_number);

-- Auto-generate on insert with retry loop to avoid collisions.
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  tries int := 0;
BEGIN
  IF NEW.order_number IS NOT NULL AND length(NEW.order_number) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := 'TRX-' || upper(substring(md5(random()::text || clock_timestamp()::text || COALESCE(NEW.id::text, '')) from 1 for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = candidate);
    tries := tries + 1;
    IF tries > 8 THEN
      candidate := 'TRX-' || upper(substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text) from 1 for 10));
      EXIT;
    END IF;
  END LOOP;
  NEW.order_number := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_order_number ON public.orders;
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();