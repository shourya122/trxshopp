CREATE OR REPLACE FUNCTION public.count_coupon_use_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  IF NEW.status = 'paid' AND COALESCE(OLD.status,'') <> 'paid' THEN
    c := COALESCE(OLD.raw_callback->>'coupon', NEW.raw_callback->>'coupon');
    IF c IS NOT NULL AND length(c) > 0 THEN
      UPDATE public.coupons SET usage_count = usage_count + 1 WHERE lower(code) = lower(c);
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.count_coupon_use_on_paid() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS orders_count_coupon_use ON public.orders;
CREATE TRIGGER orders_count_coupon_use BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.count_coupon_use_on_paid();
REVOKE INSERT, UPDATE, DELETE ON public.products, public.reviews, public.coupons, public.site_settings, public.suppliers, public.supplier_items, public.supplier_restocks, public.banned_emails FROM anon;