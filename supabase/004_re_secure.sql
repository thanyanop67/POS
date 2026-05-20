-- ============================================================
-- Re-tighten RLS to require authentication
-- (kicks in when we go back to Supabase Auth)
-- Paste into SQL Editor and Run.
-- ============================================================

DROP POLICY IF EXISTS "all_access" ON public.categories;
DROP POLICY IF EXISTS "all_access" ON public.products;
DROP POLICY IF EXISTS "all_access" ON public.bills;
DROP POLICY IF EXISTS "all_access" ON public.bill_items;
DROP POLICY IF EXISTS "all_access" ON public.restocks;
DROP POLICY IF EXISTS "all_access" ON public.settings;

DROP POLICY IF EXISTS "auth_all" ON public.categories;
DROP POLICY IF EXISTS "auth_all" ON public.products;
DROP POLICY IF EXISTS "auth_all" ON public.bills;
DROP POLICY IF EXISTS "auth_all" ON public.bill_items;
DROP POLICY IF EXISTS "auth_all" ON public.restocks;
DROP POLICY IF EXISTS "auth_all" ON public.settings;

CREATE POLICY "auth_all" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.products   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.bills      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.bill_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.restocks   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.settings   FOR ALL TO authenticated USING (true) WITH CHECK (true);
