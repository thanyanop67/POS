-- ============================================================
-- Revert RLS ให้กลับเป็น permissive (allow ทุก request)
-- เนื่องจากเราเอา Supabase Auth ออกแล้ว
-- Paste ใน SQL Editor แล้ว Run
-- ============================================================

DROP POLICY IF EXISTS "auth_all"   ON public.categories;
DROP POLICY IF EXISTS "auth_all"   ON public.products;
DROP POLICY IF EXISTS "auth_all"   ON public.bills;
DROP POLICY IF EXISTS "auth_all"   ON public.bill_items;
DROP POLICY IF EXISTS "auth_all"   ON public.restocks;
DROP POLICY IF EXISTS "auth_all"   ON public.settings;

DROP POLICY IF EXISTS "all_access" ON public.categories;
DROP POLICY IF EXISTS "all_access" ON public.products;
DROP POLICY IF EXISTS "all_access" ON public.bills;
DROP POLICY IF EXISTS "all_access" ON public.bill_items;
DROP POLICY IF EXISTS "all_access" ON public.restocks;
DROP POLICY IF EXISTS "all_access" ON public.settings;

CREATE POLICY "all_access" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.products   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.bills      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.restocks   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.settings   FOR ALL USING (true) WITH CHECK (true);
