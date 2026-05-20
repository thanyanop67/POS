// inventory.jsx — Stock list with search/filter, low-stock banner, edit
function InventoryScreen({ products, setProducts, pushToast, gotoRestock }) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all / low / out
  const [editing, setEditing] = React.useState(null); // null | product | 'new'

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

  const saveProduct = async (p, isNew) => {
    setProducts((prev) =>
      isNew ? [...prev, p] : prev.map((x) => x.id === p.id ? p : x)
    );
    try {
      if (window.DB?.isReady()) await DB.updateProduct(p);
      pushToast({ kind: 'ok', text: isNew ? `เพิ่ม ${p.name} แล้ว` : `แก้ไข ${p.name} แล้ว` });
    } catch (e) {
      console.error(e);
      pushToast({ kind: 'warn', text: 'บันทึกไม่สำเร็จ (เก็บไว้ในเครื่อง)' });
    }
    setEditing(null);
  };

  const deleteProduct = async (p) => {
    if (!confirm(`ลบสินค้า "${p.name}" ออกจากระบบ?`)) return;
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    try {
      if (window.DB?.isReady()) await DB.deleteProduct(p.id);
      pushToast({ kind: 'ok', text: `ลบ ${p.name} แล้ว` });
    } catch (e) {
      console.error(e);
      pushToast({ kind: 'warn', text: 'ลบไม่สำเร็จ (เก็บไว้ในเครื่อง)' });
    }
    setEditing(null);
  };

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
            <button className="btn btn-ghost" onClick={() => setEditing('new')}>
              <ICO.plus size={16}/> เพิ่มสินค้า
            </button>
            <button className="btn btn-primary" onClick={() => gotoRestock()}>
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
                    <td className="right" style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost" onClick={() => setEditing(p)} title="แก้ไข">
                        <ICO.edit size={14}/>
                      </button>
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

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          onSave={saveProduct}
          onDelete={deleteProduct}
          onClose={() => setEditing(null)}/>
      )}
    </div>
  );
}

// === Add/edit product modal ===
function ProductEditor({ product, onSave, onDelete, onClose }) {
  const isNew = !product;
  const [name, setName] = React.useState(product?.name || '');
  const [barcode, setBarcode] = React.useState(product?.barcode || '');
  const [category, setCategory] = React.useState(product?.category || 'misc');
  const [price, setPrice] = React.useState(product?.price ?? '');
  const [cost, setCost] = React.useState(product?.cost ?? '');
  const [stock, setStock] = React.useState(product?.stock ?? 0);
  const [unit, setUnit] = React.useState(product?.unit || 'ชิ้น');
  const [lowStockAt, setLowStockAt] = React.useState(product?.lowStockAt ?? 5);

  const submit = (e) => {
    e.preventDefault();
    const p = {
      id: product?.id || ('p' + Date.now().toString(36)),
      name: name.trim(),
      barcode: barcode.trim(),
      category,
      price: Number(price),
      cost: Number(cost),
      stock: Number(stock),
      unit: unit.trim(),
      lowStockAt: Number(lowStockAt),
      isEgg: product?.isEgg,
      eggSize: product?.eggSize,
    };
    if (!p.name || !p.barcode || isNaN(p.price) || isNaN(p.cost)) return;
    onSave(p, isNew);
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--line)', fontSize: 14, fontFamily: 'inherit',
  };
  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 };
  const label = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 };

  const cats = CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h2>{isNew ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="ปิด">
            <ICO.x size={18}/>
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div style={{ marginBottom: 12 }}>
              <label style={label}>ชื่อสินค้า *</label>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required autoFocus/>
            </div>
            <div style={row}>
              <div>
                <label style={label}>บาร์โค้ด *</label>
                <input style={inputStyle} value={barcode} onChange={(e) => setBarcode(e.target.value)} required/>
              </div>
              <div>
                <label style={label}>หมวด</label>
                <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={row}>
              <div>
                <label style={label}>ราคาขาย (฿) *</label>
                <input type="number" step="0.01" min="0" style={inputStyle} value={price}
                  onChange={(e) => setPrice(e.target.value)} required/>
              </div>
              <div>
                <label style={label}>ราคาทุน (฿) *</label>
                <input type="number" step="0.01" min="0" style={inputStyle} value={cost}
                  onChange={(e) => setCost(e.target.value)} required/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>สต๊อก</label>
                <input type="number" step="1" min="0" style={inputStyle} value={stock}
                  onChange={(e) => setStock(e.target.value)}/>
              </div>
              <div>
                <label style={label}>หน่วย</label>
                <input style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ชิ้น/ขวด/ซอง..."/>
              </div>
              <div>
                <label style={label}>เตือนเมื่อต่ำกว่า</label>
                <input type="number" step="1" min="0" style={inputStyle} value={lowStockAt}
                  onChange={(e) => setLowStockAt(e.target.value)}/>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            {!isNew && (
              <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)', marginRight: 'auto' }}
                onClick={() => onDelete(product)}>
                <ICO.trash size={14}/> ลบสินค้า
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.InventoryScreen = InventoryScreen;
