REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon;
REVOKE INSERT, DELETE ON public.orders FROM anon, authenticated;
REVOKE UPDATE ON public.orders FROM anon;