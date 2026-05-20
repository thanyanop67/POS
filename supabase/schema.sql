-- ============================================================
-- ร้านนายตะวัน — POS + Inventory schema
-- Paste this entire file into Supabase SQL Editor and click Run.
-- It's idempotent — safe to run multiple times.
-- ============================================================

-- ---------- Tables ----------

CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  barcode text UNIQUE,
  name text NOT NULL,
  category_id text REFERENCES public.categories(id),
  price numeric(10,2) NOT NULL,
  cost numeric(10,2) NOT NULL,
  stock numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL,
  low_stock_at numeric(10,2) DEFAULT 0,
  is_egg boolean DEFAULT false,
  egg_size int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode  ON public.products(barcode);

CREATE TABLE IF NOT EXISTS public.bills (
  id text PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  total numeric(10,2) NOT NULL,
  profit numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  items_count int NOT NULL,
  cashier text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_occurred_at ON public.bills(occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.bill_items (
  id bigserial PRIMARY KEY,
  bill_id text NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id),
  qty numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  unit_cost numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON public.bill_items(bill_id);

CREATE TABLE IF NOT EXISTS public.restocks (
  id text PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  product_id text REFERENCES public.products(id),
  qty numeric(10,2) NOT NULL,
  unit_cost numeric(10,2) NOT NULL,
  by_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restocks_occurred_at ON public.restocks(occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ---------- Row Level Security ----------
-- Permissive policies for now (works for both anon and authenticated).
-- Tighten later when Auth is fully rolled out.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings   ENABLE ROW LEVEL SECURITY;

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

-- ---------- Seed: Categories ----------

INSERT INTO public.categories (id, name, sort_order) VALUES
  ('drink',   'เครื่องดื่ม',         1),
  ('snack',   'ขนม/ของกินเล่น',     2),
  ('instant', 'อาหารสำเร็จรูป',     3),
  ('rice',    'ข้าวสาร',            4),
  ('egg',     'ไข่ไก่',             5),
  ('pet',     'อาหารสัตว์เลี้ยง',    6),
  ('home',    'ของใช้ในบ้าน',       7),
  ('misc',    'เบ็ดเตล็ด',          8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- ---------- Seed: Products ----------

INSERT INTO public.products (id, barcode, name, category_id, price, cost, stock, unit, low_stock_at, is_egg, egg_size) VALUES
  -- เครื่องดื่ม
  ('p001', '8851959132019', 'น้ำดื่ม สิงห์ 600ml',     'drink',   8,    5,    142, 'ขวด',     24, false, NULL),
  ('p002', '8850999320014', 'โค้ก กระป๋อง 325ml',     'drink',   17,   11,   86,  'กระป๋อง', 24, false, NULL),
  ('p003', '8850123009010', 'เป๊ปซี่ ขวด 490ml',       'drink',   18,   12,   12,  'ขวด',     24, false, NULL),
  ('p004', '8852345001235', 'เบอร์ดี้ โรบัสต้า',        'drink',   12,   8,    64,  'กระป๋อง', 18, false, NULL),
  ('p005', '8851111234567', 'ชาเขียวโออิชิ น้ำผึ้ง',     'drink',   20,   13,   38,  'ขวด',     18, false, NULL),
  ('p006', '8850100200015', 'นมเปรี้ยวดัชชี่',          'drink',   10,   7,    56,  'ขวด',     18, false, NULL),
  -- ขนม
  ('p010', '8853333445566', 'เลย์ คลาสสิก 50g',        'snack',   22,   15,   48,  'ซอง',     12, false, NULL),
  ('p011', '8851000123451', 'ปาท่องโก๋ คุกกี้',          'snack',   10,   6,    72,  'ซอง',     18, false, NULL),
  ('p012', '8850999000123', 'ฮอลล์ มินต์',              'snack',   10,   6,    110, 'หลอด',    20, false, NULL),
  ('p013', '8859999132011', 'บิสกิตโอรีโอ',              'snack',   25,   17,   6,   'ซอง',     12, false, NULL),
  -- อาหารสำเร็จรูป
  ('p020', '8850987654321', 'มาม่า ต้มยำกุ้ง',          'instant', 7,    4.5,  220, 'ซอง',     40, false, NULL),
  ('p021', '8850987654322', 'มาม่า หมูสับ',             'instant', 7,    4.5,  184, 'ซอง',     40, false, NULL),
  ('p022', '8851234560011', 'โจ๊กคนอร์ หมู',            'instant', 18,   13,   28,  'ถ้วย',    12, false, NULL),
  ('p023', '8852300114455', 'ปลากระป๋อง โรซ่า',         'instant', 22,   16,   33,  'กระป๋อง', 14, false, NULL),
  -- ข้าวสาร
  ('p024', '8853000222119', 'ข้าวหอมมะลิ 5kg ตราฉัตร', 'rice',    245,  215,  12,  'ถุง',     4,  false, NULL),
  ('p025', '8853000222126', 'ข้าวหอมมะลิ 1kg ตราฉัตร', 'rice',    58,   46,   38,  'ถุง',     10, false, NULL),
  ('p026', '8853001222113', 'ข้าวเหนียว 1kg',          'rice',    52,   42,   24,  'ถุง',     10, false, NULL),
  -- ไข่ไก่
  ('e000', '8859990000000', 'ไข่ไก่ เบอร์ 0 (ฟองใหญ่)', 'egg',     6.5,  5.2,  184, 'ฟอง',     90,  true, 0),
  ('e001', '8859990000017', 'ไข่ไก่ เบอร์ 1',            'egg',     6.0,  4.8,  245, 'ฟอง',     120, true, 1),
  ('e002', '8859990000024', 'ไข่ไก่ เบอร์ 2',            'egg',     5.5,  4.3,  310, 'ฟอง',     180, true, 2),
  ('e003', '8859990000031', 'ไข่ไก่ เบอร์ 3',            'egg',     5.0,  3.9,  168, 'ฟอง',     120, true, 3),
  ('e004', '8859990000048', 'ไข่ไก่ เบอร์ 4 (ฟองเล็ก)', 'egg',     4.5,  3.5,  76,  'ฟอง',     90,  true, 4),
  -- อาหารสัตว์เลี้ยง
  ('p070', '8854001000019', 'อาหารหมา Pedigree 1.3kg', 'pet',     165,  135,  14,  'ถุง',     6,  false, NULL),
  ('p071', '8854002000017', 'อาหารแมว Whiskas 480g',   'pet',     95,   78,   22,  'ถุง',     8,  false, NULL),
  ('p072', '8854003000015', 'อาหารไก่ ซีพี 1kg',         'pet',     38,   30,   48,  'ถุง',     12, false, NULL),
  ('p073', '8854004000013', 'ขนมหมา BeniBoni',          'pet',     35,   24,   18,  'ซอง',     8,  false, NULL),
  -- ของใช้ในบ้าน
  ('p040', '8850300100015', 'ผงซักฟอกเปา 80g',          'home',    9,    6.5,  64,  'ซอง',     20, false, NULL),
  ('p041', '8850300200021', 'แชมพูซันซิล ซอง',          'home',    5,    3.2,  130, 'ซอง',     30, false, NULL),
  ('p042', '8851234000017', 'กระดาษทิชชู่ ซิลค์',         'home',    28,   20,   18,  'ห่อ',     10, false, NULL),
  ('p043', '8850500300013', 'แอลกอฮอล์เจล 60ml',        'home',    35,   25,   24,  'ขวด',     10, false, NULL),
  ('p044', '8852200100012', 'ถุงพลาสติกหูหิ้ว 100ใบ',    'home',    45,   32,   22,  'แพ็ค',    8,  false, NULL),
  -- เบ็ดเตล็ด
  ('p050', '8851111000019', 'ไฟแช็ก BIC',               'misc',    10,   6,    88,  'อัน',     20, false, NULL),
  ('p051', '8852222000017', 'ถ่าน AA Panasonic',         'misc',    35,   24,   26,  'แพ็ค',    10, false, NULL)
ON CONFLICT (id) DO UPDATE SET
  barcode = EXCLUDED.barcode,
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  unit = EXCLUDED.unit,
  low_stock_at = EXCLUDED.low_stock_at,
  is_egg = EXCLUDED.is_egg,
  egg_size = EXCLUDED.egg_size,
  updated_at = now();

-- Touch updated_at trigger for products
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_touch ON public.products;
CREATE TRIGGER trg_products_touch
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
