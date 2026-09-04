DROP POLICY IF EXISTS "Users view orders by verified email" ON public.orders;
CREATE POLICY "Users view orders by verified email" ON public.orders
FOR SELECT TO authenticated
USING (
  customer_email IS NOT NULL
  AND lower(customer_email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
  AND COALESCE(((auth.jwt() ->> 'email_verified'))::boolean, false) = true
);