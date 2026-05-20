// db.jsx — Supabase client + CRUD helpers
// Falls back to seed data when Supabase isn't configured/reachable.

(function () {
  const cfg = window.SUPABASE_CONFIG;
  const lib = window.supabase; // from @supabase/supabase-js UMD bundle
  window.sb = (cfg && lib && cfg.url && cfg.publishableKey)
    ? lib.createClient(cfg.url, cfg.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;
})();

// Convert DB row → app shape (camelCase, matching SEED_PRODUCTS)
const rowToProduct = (r) => ({
  id: r.id,
  barcode: r.barcode,
  name: r.name,
  category: r.category_id,
  price: Number(r.price),
  cost: Number(r.cost),
  stock: Number(r.stock),
  unit: r.unit,
  lowStockAt: Number(r.low_stock_at),
  isEgg: r.is_egg || undefined,
  eggSize: r.egg_size ?? undefined,
});

const productToRow = (p) => ({
  id: p.id,
  barcode: p.barcode,
  name: p.name,
  category_id: p.category,
  price: p.price,
  cost: p.cost,
  stock: p.stock,
  unit: p.unit,
  low_stock_at: p.lowStockAt,
  is_egg: !!p.isEgg,
  egg_size: p.eggSize ?? null,
});

const formatWhen = (iso) => {
  const d = new Date(iso);
  const monthsTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getDate()} ${monthsTH[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const rowToBill = (r) => ({
  id: r.id,
  when: formatWhen(r.occurred_at),
  items: r.items_count,
  total: Number(r.total),
  profit: Number(r.profit),
  method: r.payment_method,
});

const rowToRestock = (r) => ({
  id: r.id,
  when: formatWhen(r.occurred_at),
  productId: r.product_id,
  qty: Number(r.qty),
  unitCost: Number(r.unit_cost),
  by: r.by_name,
});

window.DB = {
  isReady: () => !!window.sb,

  async fetchAll() {
    if (!window.sb) return null;
    const [products, bills, restocks] = await Promise.all([
      window.sb.from('products').select('*').order('id'),
      window.sb.from('bills').select('*').order('occurred_at', { ascending: false }).limit(50),
      window.sb.from('restocks').select('*').order('occurred_at', { ascending: false }).limit(50),
    ]);
    if (products.error) throw products.error;
    if (bills.error) throw bills.error;
    if (restocks.error) throw restocks.error;
    return {
      products: products.data.map(rowToProduct),
      bills: bills.data.map(rowToBill),
      restocks: restocks.data.map(rowToRestock),
    };
  },

  async createBill(bill, lines) {
    if (!window.sb) return;
    const { error: e1 } = await window.sb.from('bills').insert({
      id: bill.id,
      occurred_at: new Date().toISOString(),
      total: bill.total,
      profit: bill.profit,
      payment_method: bill.method,
      items_count: bill.items,
      cashier: bill.cashier || null,
    });
    if (e1) throw e1;
    if (lines && lines.length) {
      const { error: e2 } = await window.sb.from('bill_items').insert(
        lines.map((l) => ({
          bill_id: bill.id,
          product_id: l.productId,
          qty: l.qty,
          unit_price: l.unitPrice,
          unit_cost: l.unitCost,
          line_total: l.lineTotal,
        }))
      );
      if (e2) throw e2;
    }
  },

  async createRestock(r) {
    if (!window.sb) return;
    const { error } = await window.sb.from('restocks').insert({
      id: r.id,
      occurred_at: new Date().toISOString(),
      product_id: r.productId,
      qty: r.qty,
      unit_cost: r.unitCost,
      by_name: r.by || null,
    });
    if (error) throw error;
  },

  async updateProductStock(id, stock) {
    if (!window.sb) return;
    const { error } = await window.sb.from('products')
      .update({ stock }).eq('id', id);
    if (error) throw error;
  },

  async updateProduct(p) {
    if (!window.sb) return;
    const { error } = await window.sb.from('products')
      .upsert(productToRow(p));
    if (error) throw error;
  },

  async deleteProduct(id) {
    if (!window.sb) return;
    const { error } = await window.sb.from('products').delete().eq('id', id);
    if (error) throw error;
  },
};

// Re-export converters for other modules
Object.assign(window, { rowToProduct, productToRow });
