// inventory.jsx — Stock list with search/filter, low-stock banner, edit
function InventoryScreen({ products, setProducts, pushToast, gotoRestock }) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all / low / out

  const lowItems = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt);
  const outItems = products.filter((p) => p.stock <= 0);

  const visible = products.filter((p) => {
    if (filter === 'low' && !(p.stock > 0 && p.stock <= p.lowStockAt)) return false;
    if (filter === 'out' && p.stock > 0) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.barcode.includes(s)) return false;
    }
    return true;
  });

  const totalSKU = products.length;
  const totalValue = products.reduce((s, p) => s + p.cost * p.stock, 0);

  return (
    <div className="dash">
      {/* KPI stats */}
      <div className="inv-stats">
        <div className="stat-card">
          <div className="ico"><ICO.inventory size={22}/></div>
          <div>
            <div className="stat-label">รายการสินค้าทั้งหมด</div>
            <div className="stat-val">{fmtInt(totalSKU)} SKU</div>
          </div>
        </div>
        <div className="stat-card ok">
          <div className="ico"><ICO.bag size={22}/></div>
          <div>
            <div className="stat-label">มูลค่าสต๊อก (ราคาทุน)</div>
            <div className="stat-val">฿{fmtTHB(Math.round(totalValue))}</div>
          </div>
        </div>
        <div className="stat-card warn">
          <div className="ico"><ICO.alert size={22}/></div>
          <div>
            <div className="stat-label">สต๊อกต่ำ</div>
            <div className="stat-val">{lowItems.length} รายการ</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="ico"><ICO.alert size={22}/></div>
          <div>
            <div className="stat-label">หมดสต๊อก</div>
            <div className="stat-val">{outItems.length} รายการ</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>คลังสินค้า</h3>
            <div className="panel-sub">รายการสินค้าและจำนวนคงเหลือทั้งหมด</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search">
              <span className="search-ico"><ICO.search size={18}/></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า / บาร์โค้ด"/>
            </div>
            <button className="btn btn-primary" onClick={gotoRestock}>
              <ICO.plus size={16}/> เติมของ
            </button>
          </div>
        </div>

        <div className="tabs">
          {[
            { id: 'all', label: `ทั้งหมด (${products.length})` },
            { id: 'low', label: `สต๊อกต่ำ (${lowItems.length})` },
            { id: 'out', label: `หมด (${outItems.length})` },
          ].map((t) => (
            <button key={t.id} className={`tab ${filter === t.id ? 'active' : ''}`}
              onClick={() => setFilter(t.id)}>{t.label}</button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>บาร์โค้ด</th>
                <th>หมวด</th>
                <th className="right">ราคาขาย</th>
                <th className="right">ราคาทุน</th>
                <th className="right">คงเหลือ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const cat = CATEGORIES.find((c) => c.id === p.category);
                const status = p.stock <= 0
                  ? { cls: 'danger', label: 'หมด', dot: true }
                  : p.stock <= p.lowStockAt
                    ? { cls: 'warn', label: 'สต๊อกต่ำ', dot: true }
                    : { cls: 'ok', label: 'พร้อมขาย', dot: true };
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                    </td>
                    <td><span className="sku-tag">{p.barcode}</span></td>
                    <td><span className="muted">{cat?.name}</span></td>
                    <td className="right">฿{fmtTHB(p.price)}</td>
                    <td className="right muted">฿{fmtTHB(p.cost)}</td>
                    <td className="right" style={{ fontWeight: 600 }}>
                      {p.stock} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{p.unit}</span>
                    </td>
                    <td>
                      <span className={`badge ${status.cls}`}>
                        <span className="dot"></span>{status.label}
                      </span>
                    </td>
                    <td className="right">
                      <button className="btn btn-ghost" onClick={() => gotoRestock(p.barcode)}>
                        <ICO.plus size={14}/> เติม
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

window.InventoryScreen = InventoryScreen;
