// data.jsx — mock product catalog + helpers (ร้านนายตะวัน)

// === Store info ===
const STORE = {
  name: 'ร้านนายตะวัน',
  shortName: 'นายตะวัน',
  address: '105/15 ราษฎร์อุทิศ 1 ซอย 1',
  address2: 'ต.บ่อยาง อ.เมืองสงขลา สงขลา 90000',
  phone: '087-968-7630',
  ownerName: 'คุณตะวัน (หนุ่ย)',
  ownerInitial: 'ตว',
  openTime: '04:00',
  closeTime: '20:00',
  logo: 'assets/logo.png',
  storefront: 'assets/storefront.png',
};

// Categories — ของชำ/สัตว์เลี้ยง ตามโลโก้ร้าน
const CATEGORIES = [
  { id: 'all',     name: 'ทั้งหมด' },
  { id: 'drink',   name: 'เครื่องดื่ม' },
  { id: 'snack',   name: 'ขนม/ของกินเล่น' },
  { id: 'instant', name: 'อาหารสำเร็จรูป' },
  { id: 'rice',    name: 'ข้าวสาร' },
  { id: 'egg',     name: 'ไข่ไก่' },
  { id: 'pet',     name: 'อาหารสัตว์เลี้ยง' },
  { id: 'home',    name: 'ของใช้ในบ้าน' },
  { id: 'misc',    name: 'เบ็ดเตล็ด' },
];

// === Products ===
// Eggs are stocked individually (unit = 'ฟอง'). 1 แผง = 30 ฟอง for ordering.
const SEED_PRODUCTS = [
  // เครื่องดื่ม
  { id: 'p001', barcode: '8851959132019', name: 'น้ำดื่ม สิงห์ 600ml', category: 'drink', price: 8, cost: 5,  stock: 142, unit: 'ขวด', lowStockAt: 24 },
  { id: 'p002', barcode: '8850999320014', name: 'โค้ก กระป๋อง 325ml', category: 'drink', price: 17, cost: 11, stock: 86, unit: 'กระป๋อง', lowStockAt: 24 },
  { id: 'p003', barcode: '8850123009010', name: 'เป๊ปซี่ ขวด 490ml', category: 'drink', price: 18, cost: 12, stock: 12, unit: 'ขวด', lowStockAt: 24 },
  { id: 'p004', barcode: '8852345001235', name: 'เบอร์ดี้ โรบัสต้า', category: 'drink', price: 12, cost: 8,  stock: 64, unit: 'กระป๋อง', lowStockAt: 18 },
  { id: 'p005', barcode: '8851111234567', name: 'ชาเขียวโออิชิ น้ำผึ้ง', category: 'drink', price: 20, cost: 13, stock: 38, unit: 'ขวด', lowStockAt: 18 },
  { id: 'p006', barcode: '8850100200015', name: 'นมเปรี้ยวดัชชี่', category: 'drink', price: 10, cost: 7,  stock: 56, unit: 'ขวด', lowStockAt: 18 },

  // ขนม
  { id: 'p010', barcode: '8853333445566', name: 'เลย์ คลาสสิก 50g', category: 'snack', price: 22, cost: 15, stock: 48, unit: 'ซอง', lowStockAt: 12 },
  { id: 'p011', barcode: '8851000123451', name: 'ปาท่องโก๋ คุกกี้', category: 'snack', price: 10, cost: 6,  stock: 72, unit: 'ซอง', lowStockAt: 18 },
  { id: 'p012', barcode: '8850999000123', name: 'ฮอลล์ มินต์', category: 'snack', price: 10, cost: 6,  stock: 110, unit: 'หลอด', lowStockAt: 20 },
  { id: 'p013', barcode: '8859999132011', name: 'บิสกิตโอรีโอ', category: 'snack', price: 25, cost: 17, stock: 6,  unit: 'ซอง', lowStockAt: 12 },

  // อาหารสำเร็จรูป
  { id: 'p020', barcode: '8850987654321', name: 'มาม่า ต้มยำกุ้ง', category: 'instant', price: 7,  cost: 4.5, stock: 220, unit: 'ซอง', lowStockAt: 40 },
  { id: 'p021', barcode: '8850987654322', name: 'มาม่า หมูสับ', category: 'instant', price: 7,  cost: 4.5, stock: 184, unit: 'ซอง', lowStockAt: 40 },
  { id: 'p022', barcode: '8851234560011', name: 'โจ๊กคนอร์ หมู', category: 'instant', price: 18, cost: 13, stock: 28, unit: 'ถ้วย', lowStockAt: 12 },
  { id: 'p023', barcode: '8852300114455', name: 'ปลากระป๋อง โรซ่า', category: 'instant', price: 22, cost: 16, stock: 33, unit: 'กระป๋อง', lowStockAt: 14 },

  // ข้าวสาร
  { id: 'p024', barcode: '8853000222119', name: 'ข้าวหอมมะลิ 5kg ตราฉัตร', category: 'rice', price: 245, cost: 215, stock: 12, unit: 'ถุง', lowStockAt: 4 },
  { id: 'p025', barcode: '8853000222126', name: 'ข้าวหอมมะลิ 1kg ตราฉัตร', category: 'rice', price: 58, cost: 46, stock: 38, unit: 'ถุง', lowStockAt: 10 },
  { id: 'p026', barcode: '8853001222113', name: 'ข้าวเหนียว 1kg', category: 'rice', price: 52, cost: 42, stock: 24, unit: 'ถุง', lowStockAt: 10 },

  // === ไข่ไก่ — stored as ฟอง (eggs), sold per ฟอง ===
  { id: 'e000', barcode: '8859990000000', name: 'ไข่ไก่ เบอร์ 0 (ฟองใหญ่)', category: 'egg', price: 6.5, cost: 5.2, stock: 184, unit: 'ฟอง', lowStockAt: 90,  isEgg: true, eggSize: 0 },
  { id: 'e001', barcode: '8859990000017', name: 'ไข่ไก่ เบอร์ 1',           category: 'egg', price: 6.0, cost: 4.8, stock: 245, unit: 'ฟอง', lowStockAt: 120, isEgg: true, eggSize: 1 },
  { id: 'e002', barcode: '8859990000024', name: 'ไข่ไก่ เบอร์ 2',           category: 'egg', price: 5.5, cost: 4.3, stock: 310, unit: 'ฟอง', lowStockAt: 180, isEgg: true, eggSize: 2 },
  { id: 'e003', barcode: '8859990000031', name: 'ไข่ไก่ เบอร์ 3',           category: 'egg', price: 5.0, cost: 3.9, stock: 168, unit: 'ฟอง', lowStockAt: 120, isEgg: true, eggSize: 3 },
  { id: 'e004', barcode: '8859990000048', name: 'ไข่ไก่ เบอร์ 4 (ฟองเล็ก)', category: 'egg', price: 4.5, cost: 3.5, stock: 76,  unit: 'ฟอง', lowStockAt: 90,  isEgg: true, eggSize: 4 },

  // อาหารสัตว์เลี้ยง
  { id: 'p070', barcode: '8854001000019', name: 'อาหารหมา Pedigree 1.3kg', category: 'pet', price: 165, cost: 135, stock: 14, unit: 'ถุง', lowStockAt: 6 },
  { id: 'p071', barcode: '8854002000017', name: 'อาหารแมว Whiskas 480g', category: 'pet', price: 95, cost: 78, stock: 22, unit: 'ถุง', lowStockAt: 8 },
  { id: 'p072', barcode: '8854003000015', name: 'อาหารไก่ ซีพี 1kg', category: 'pet', price: 38, cost: 30, stock: 48, unit: 'ถุง', lowStockAt: 12 },
  { id: 'p073', barcode: '8854004000013', name: 'ขนมหมา BeniBoni', category: 'pet', price: 35, cost: 24, stock: 18, unit: 'ซอง', lowStockAt: 8 },

  // ของใช้ในบ้าน
  { id: 'p040', barcode: '8850300100015', name: 'ผงซักฟอกเปา 80g', category: 'home', price: 9,  cost: 6.5,  stock: 64, unit: 'ซอง', lowStockAt: 20 },
  { id: 'p041', barcode: '8850300200021', name: 'แชมพูซันซิล ซอง', category: 'home', price: 5,  cost: 3.2,  stock: 130, unit: 'ซอง', lowStockAt: 30 },
  { id: 'p042', barcode: '8851234000017', name: 'กระดาษทิชชู่ ซิลค์', category: 'home', price: 28, cost: 20,   stock: 18, unit: 'ห่อ', lowStockAt: 10 },
  { id: 'p043', barcode: '8850500300013', name: 'แอลกอฮอล์เจล 60ml', category: 'home', price: 35, cost: 25,   stock: 24, unit: 'ขวด', lowStockAt: 10 },
  { id: 'p044', barcode: '8852200100012', name: 'ถุงพลาสติกหูหิ้ว 100ใบ', category: 'home', price: 45, cost: 32, stock: 22, unit: 'แพ็ค', lowStockAt: 8 },

  // เบ็ดเตล็ด
  { id: 'p050', barcode: '8851111000019', name: 'ไฟแช็ก BIC', category: 'misc', price: 10, cost: 6, stock: 88, unit: 'อัน', lowStockAt: 20 },
  { id: 'p051', barcode: '8852222000017', name: 'ถ่าน AA Panasonic', category: 'misc', price: 35, cost: 24, stock: 26, unit: 'แพ็ค', lowStockAt: 10 },
];

// === Egg sales history — 7 days back, in ฟอง per day ===
// Sunday→Saturday flat array length 7 (index 0 = 6 days ago, index 6 = yesterday)
// Reflects typical mini-mart pattern with weekend spikes.
const EGG_SALES_HISTORY = {
  0: [22, 18, 24, 28, 21, 35, 30],  // เบอร์ 0 — ฟองใหญ่
  1: [38, 32, 42, 45, 36, 58, 50],  // เบอร์ 1
  2: [68, 62, 74, 80, 65, 95, 88],  // เบอร์ 2 — popular
  3: [44, 38, 48, 52, 42, 62, 55],  // เบอร์ 3
  4: [24, 20, 28, 32, 22, 38, 32],  // เบอร์ 4 — ฟองเล็ก
};

// Today's individual eggs sold so far (mock — partial day for "today's sales" feel)
const EGG_SALES_TODAY = { 0: 12, 1: 20, 2: 36, 3: 24, 4: 14 };

// 7-day total daily sales (whole store, in THB) — for daily chart
// index 0 = 7 days ago, index 6 = yesterday
const DAILY_SALES_7D = [4280, 3960, 4540, 5120, 4380, 6240, 5680];
const DAILY_PROFIT_7D = [1180, 1090, 1260, 1420, 1210, 1730, 1580];
const DAILY_BILLS_7D = [34, 31, 36, 41, 35, 49, 45];

// Day labels: dynamic — compute relative dates from "today" (which is 20 พ.ค.)
const dayLabels7d = () => {
  const today = new Date(2026, 4, 20); // 20 พ.ค. 2026
  const out = [];
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const daysTH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  for (let i = 7; i >= 1; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    out.push({ key: 'd-' + i, dayName: daysTH[d.getDay()], date: `${d.getDate()} ${monthsTH[d.getMonth()]}` });
  }
  return out;
};

// Helpers
const fmtTHB = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return '–';
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
const fmtTHBSign = (n) => '฿' + fmtTHB(n);
const fmtInt = (n) => (n ?? 0).toLocaleString('th-TH');
const eggsToPanels = (eggs) => {
  // returns { panels, remainder }
  return { panels: Math.floor(eggs / 30), remainder: eggs % 30 };
};
const ceilPanels = (eggs) => Math.ceil(eggs / 30);

// Recent restock log
const SEED_RESTOCKS = [
  { id: 'r001', when: '19 พ.ค. 06:14', productId: 'e002', qty: 300, unitCost: 4.25, by: 'คุณตะวัน' },
  { id: 'r002', when: '19 พ.ค. 06:00', productId: 'p020', qty: 60, unitCost: 4.4, by: 'คุณตะวัน' },
  { id: 'r003', when: '18 พ.ค. 06:30', productId: 'p024', qty: 12, unitCost: 212, by: 'คุณตะวัน' },
  { id: 'r004', when: '18 พ.ค. 05:48', productId: 'e001', qty: 240, unitCost: 4.7, by: 'คุณตะวัน' },
  { id: 'r005', when: '17 พ.ค. 17:30', productId: 'p001', qty: 48, unitCost: 4.8, by: 'คุณตะวัน' },
];

// Recent bills (today)
const SEED_BILLS = [
  { id: 'B-2026-0142', when: '20 พ.ค. 11:23', items: 4, total: 138, profit: 38, method: 'เงินสด' },
  { id: 'B-2026-0141', when: '20 พ.ค. 11:05', items: 2, total: 47,  profit: 15, method: 'พร้อมเพย์' },
  { id: 'B-2026-0140', when: '20 พ.ค. 10:42', items: 8, total: 312, profit: 86, method: 'เงินสด' },
  { id: 'B-2026-0139', when: '20 พ.ค. 10:18', items: 3, total: 78,  profit: 22, method: 'เงินสด' },
  { id: 'B-2026-0138', when: '20 พ.ค. 09:51', items: 6, total: 224, profit: 64, method: 'พร้อมเพย์' },
  { id: 'B-2026-0137', when: '20 พ.ค. 08:33', items: 5, total: 168, profit: 47, method: 'เงินสด' },
  { id: 'B-2026-0136', when: '20 พ.ค. 07:11', items: 2, total: 35,  profit: 11, method: 'เงินสด' },
  { id: 'B-2026-0135', when: '20 พ.ค. 06:54', items: 4, total: 126, profit: 36, method: 'เงินสด' },
];

const TODAY_BASELINE = { sales: 1128, profit: 319, bills: 8 };

Object.assign(window, {
  STORE, CATEGORIES, SEED_PRODUCTS, SEED_RESTOCKS, SEED_BILLS, TODAY_BASELINE,
  EGG_SALES_HISTORY, EGG_SALES_TODAY,
  DAILY_SALES_7D, DAILY_PROFIT_7D, DAILY_BILLS_7D, dayLabels7d,
  fmtTHB, fmtTHBSign, fmtInt, eggsToPanels, ceilPanels,
});
