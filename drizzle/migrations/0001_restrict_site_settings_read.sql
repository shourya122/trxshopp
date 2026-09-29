DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated can read site settings" ON public.site_settings;
CREATE POLICY "Public can read whitelisted site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('usd_inr_rate'));
CREATE POLICY "Admins can read all site settings" ON public.site_settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));