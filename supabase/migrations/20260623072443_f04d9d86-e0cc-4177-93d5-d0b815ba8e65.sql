
CREATE TABLE public.crypto_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id TEXT UNIQUE,
  pay_link TEXT,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount_inr NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT ALL ON public.crypto_orders TO service_role;
ALTER TABLE public.crypto_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_crypto_orders_track_id ON public.crypto_orders(track_id);
