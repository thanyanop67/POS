-- ============================================================
-- ขั้นที่ 2: ปิด RLS ให้เฉพาะผู้ที่ login เท่านั้นถึงเข้าถึงได้
-- + เปิด Realtime สำหรับ products / bills / restocks
-- Paste ใน SQL Editor แล้ว Run
-- ============================================================

-- ---------- Drop permissive policies ----------
DROP POLICY IF EXISTS "all_access" ON public.categories;
DROP POLICY IF EXISTS "all_access" ON public.products;
DROP POLICY IF EXISTS "all_access" ON public.bills;
DROP POLICY IF EXISTS "all_access" ON public.bill_items;
DROP POLICY IF EXISTS "all_access" ON public.restocks;
DROP POLICY IF EXISTS "all_access" ON public.settings;

-- ---------- Create authenticated-only policies ----------
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

-- ---------- Enable Realtime ----------
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bill_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restocks;
