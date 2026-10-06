DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create items for own orders" ON public.order_items;
CREATE OR REPLACE FUNCTION public.protect_customer_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role'
     AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email THEN
    IF auth.role() <> 'service_role' AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.id := OLD.id; NEW.email := OLD.email;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS customers_protect_role ON public.customers;
CREATE TRIGGER customers_protect_role BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.protect_customer_role();