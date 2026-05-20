// pos.jsx — POS (point of sale) screen
// - Barcode scanner input (HID mode + webcam mode toggle)
// - Product grid with categories
// - Cart with qty +/-, line totals, grand total
// - Checkout modal w/ cash/PromptPay/card + change calc
// - On confirm: deducts stock, emits bill, opens printable receipt
// Receives shared state via props from App.

function POSScreen({
  products, setProducts,
  cart, setCart,
  pushToast, pushBill, openReceipt,
  layout, scanMode, setScanMode,
}) {
  const [cat, setCat] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [barcode, setBarcode] = React.useState('');
  const [payOpen, setPayOpen] = React.useState(false);
  const [flashId, setFlashId] = React.useState(null);
  const scanRef = React.useRef(null);

  // Auto-focus scanner input so barcode reader keystrokes land there.
  React.useEffect(() => {
    const focus = () => scanRef.current?.focus();
    focus();
    const onClick = (e) => {
      // Refocus scanner unless user clicked into another input/button
      const tag = (e.target.tagName || '').toLowerCase();
      const role = e.target.getAttribute && e.target.getAttribute('role');
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || role === 'radio') return;
      setTimeout(focus, 0);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Add product to cart by id (deduplicates -> qty +1)
  const addToCart = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (p.stock <= 0) {
      pushToast({ kind: 'danger', text: `${p.name} หมดสต๊อก` });
      return;
    }
    setCart((prev) => {
      const ex = prev.find((c) => c.id === id);
      if (ex) {
        if (ex.qty + 1 > p.stock) {
          pushToast({ kind: 'warn', text: `สต๊อกคงเหลือ ${p.stock} ${p.unit}` });
          return prev;
        }
        return prev.map((c) => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id, qty: 1 }];
    });
    setFlashId(id);
    setTimeout(() => setFlashId(null), 800);
  };

  const onScanSubmit = (e) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    const found = products.find((p) => p.barcode === code || p.id === code);
    if (!found) {
      pushToast({ kind: 'danger', text: `ไม่พบบาร์โค้ด: ${code}` });
    } else {
      addToCart(found.id);
    }
    setBarcode('');
  };

  const removeFromCart = (id) => setCart((p) => p.filter((c) => c.id !== id));
  const updateQty = (id, qty) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const next = Math.max(0, Math.min(p.stock, qty));
    if (next === 0) return removeFromCart(id);
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, qty: next } : c));
  };

  const visible = products.filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.barcode.includes(s)) return false;
    }
    return true;
  });

  const cartDetails = cart.map((c) => {
    const p = products.find((x) => x.id === c.id);
    return { ...c, ...p, line: p ? p.price * c.qty : 0, lineCost: p ? p.cost * c.qty : 0 };
  });
  const subtotal = cartDetails.reduce((s, l) => s + l.line, 0);
  const totalCost = cartDetails.reduce((s, l) => s + l.lineCost, 0);
  const itemCount = cartDetails.reduce((s, l) => s + l.qty, 0);
  const tax = 0; // ราคาขายรวม VAT อยู่แล้ว
  const grand = subtotal + tax;
  const profit = grand - totalCost;

  // Finalize order — deduct stock + log bill
  const checkout = (payment) => {
    // deduct stock
    setProducts((prev) => prev.map((p) => {
      const inCart = cart.find((c) => c.id === p.id);
      return inCart ? { ...p, stock: p.stock - inCart.qty } : p;
    }));
    const billId = 'B-2025-' + String(143 + Math.floor(Math.random() * 30)).padStart(4, '0');
    const billRec = {
      id: billId,
      when: new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      items: itemCount,
      total: grand,
      profit,
      method: payment.method,
      lines: cartDetails.map((l) => ({ id: l.id, name: l.name, qty: l.qty, price: l.price, line: l.line, unit: l.unit })),
      received: payment.received,
      change: payment.change,
    };
    pushBill(billRec);
    setCart([]);
    setPayOpen(false);
    pushToast({ kind: 'ok', text: `บันทึกบิล ${billId} และตัดสต๊อกเรียบร้อย` });
    // open receipt
    openReceipt(billRec);
  };

  return (
    <>
      <div className={`pos layout-${layout}`}>
        {/* PRODUCT PANEL */}
        <div className="panel pos-products">
          {scanMode === 'webcam' ? <WebcamScanner onCode={(c) => {
            const found = products.find((p) => p.barcode === c);
            if (found) addToCart(found.id);
            else pushToast({ kind: 'danger', text: `สแกนไม่พบ: ${c}` });
          }} /> : (
            <form className="scan-field" onSubmit={onScanSubmit}>
              <span className="scan-ico"><ICO.scan size={28}/></span>
              <input
                ref={scanRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ยิงบาร์โค้ดที่นี่ หรือพิมพ์รหัสแล้วกด Enter"
                autoComplete="off"
              />
              <button type="button" className="btn btn-ghost btn-icon" title="สลับโหมดสแกน"
                onClick={() => setScanMode(scanMode === 'webcam' ? 'hid' : 'webcam')}>
                <ICO.qrCam size={20}/>
              </button>
            </form>
          )}
          {scanMode === 'hid' && (
            <div className="scan-hint">
              💡 เครื่องยิงบาร์โค้ดจะส่งตัวเลขเข้าช่องนี้แล้วกด Enter อัตโนมัติ —
              หรือกดปุ่มมุมขวาเพื่อเปิดกล้อง
            </div>
          )}

          <div className="cat-bar">
            {CATEGORIES.map((c) => (
              <button key={c.id}
                className={`cat-chip ${cat === c.id ? 'active' : ''}`}
                onClick={() => setCat(c.id)}>
                {c.name}
              </button>
            ))}
            <div style={{ flex: 1 }}/>
            <div className="search" style={{ marginLeft: 'auto' }}>
              <span className="search-ico"><ICO.search size={18}/></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า / บาร์โค้ด"
                style={{ height: 36, width: 240 }}/>
            </div>
          </div>

          <div className="prod-grid">
            {visible.map((p) => (
              <button key={p.id}
                className={`prod-card ${p.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(p.id)}>
                <div className="prod-thumb">
                  <span className="ph-tag">รูปสินค้า</span>
                </div>
                <div className="prod-name" title={p.name}>{p.name}</div>
                <div className="prod-meta">
                  <span className="prod-price">฿{fmtTHB(p.price)}</span>
                  <span className={`prod-stock ${p.stock <= 0 ? 'out' : p.stock <= p.lowStockAt ? 'low' : ''}`}>
                    {p.stock <= 0 ? 'หมด' : `เหลือ ${p.stock} ${p.unit}`}
                  </span>
                </div>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <h3>ไม่พบสินค้าตรงตามเงื่อนไข</h3>
                <p>ลองเปลี่ยนหมวด หรือยิงบาร์โค้ดอีกครั้ง</p>
              </div>
            )}
          </div>
        </div>

        {/* CART PANEL */}
        <div className="panel pos-cart">
          <div className="panel-h">
            <div>
              <h3>บิลปัจจุบัน</h3>
              <div className="panel-sub">{itemCount === 0 ? 'ยังไม่มีรายการ' : `${itemCount} ชิ้น · ${cart.length} รายการ`}</div>
            </div>
            {cart.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setCart([])}>
                <ICO.trash size={16}/> ล้างบิล
              </button>
            )}
          </div>
          <div className="panel-body" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="cart-list">
              {cartDetails.length === 0 ? (
                <div className="cart-empty">
                  <div className="ico"><ICO.bag size={28}/></div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: 15 }}>ยังไม่มีสินค้าในบิล</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>ยิงบาร์โค้ดหรือแตะที่สินค้าทางซ้าย</div>
                  </div>
                </div>
              ) : cartDetails.map((l) => (
                <div key={l.id} className={`cart-row ${flashId === l.id ? 'flash' : ''}`}>
                  <div>
                    <div className="cart-name">{l.name}</div>
                    <div className="cart-sku">#{l.barcode}</div>
                  </div>
                  <div className="cart-row-actions">
                    <button className="qty-btn qty-minus" onClick={() => updateQty(l.id, l.qty - 1)}><ICO.minus size={16}/></button>
                    <input className="qty-input" type="text" inputMode="numeric"
                      value={l.qty} onChange={(e) => {
                        const v = Number(e.target.value.replace(/[^0-9]/g, ''));
                        if (!isNaN(v)) updateQty(l.id, v);
                      }}/>
                    <button className="qty-btn qty-plus" onClick={() => updateQty(l.id, l.qty + 1)}><ICO.plus size={16}/></button>
                    <button className="cart-remove" onClick={() => removeFromCart(l.id)}><ICO.trash size={16}/></button>
                  </div>
                  <div className="cart-line-price">
                    <span className="cart-line-unit">{l.qty} × ฿{fmtTHB(l.price)}</span>
                    ฿{fmtTHB(l.line)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-totals">
              <div className="totals-row">
                <span>จำนวนสินค้า</span><span>{itemCount} ชิ้น</span>
              </div>
              <div className="totals-row">
                <span>ยอดรวมก่อนภาษี</span><span>฿{fmtTHB(subtotal)}</span>
              </div>
              <div className="totals-row">
                <span>VAT (รวมในราคาสินค้า)</span><span>฿0</span>
              </div>
              <div className="totals-row grand">
                <span>รวมทั้งสิ้น</span><span className="amt">฿{fmtTHB(grand)}</span>
              </div>
            </div>

            <div className="cart-actions">
              <button className="btn btn-lg" disabled={!cart.length}
                onClick={() => pushToast({ kind: 'ok', text: 'พักบิลไว้ — เรียกคืนได้จากเมนูบนซ้าย' })}>
                พักบิล
              </button>
              <button className="btn btn-lg btn-primary" disabled={!cart.length}
                onClick={() => setPayOpen(true)}>
                <ICO.check size={18}/> ชำระเงิน ฿{fmtTHB(grand)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {payOpen && (
        <PaymentModal
          total={grand}
          onClose={() => setPayOpen(false)}
          onConfirm={checkout}
        />
      )}
    </>
  );
}

// === Payment Modal ===
function PaymentModal({ total, onClose, onConfirm }) {
  const [method, setMethod] = React.useState('cash');
  const [received, setReceived] = React.useState('');
  const recv = Number(received) || 0;
  const change = Math.max(0, recv - total);
  const canConfirm = method !== 'cash' || recv >= total;

  // Quick cash buttons — round-up presets
  const presets = React.useMemo(() => {
    const ceil = (n, step) => Math.ceil(n / step) * step;
    const set = new Set([total, ceil(total, 20), ceil(total, 50), ceil(total, 100), ceil(total, 500), ceil(total, 1000)]);
    return Array.from(set).filter((x) => x >= total).sort((a, b) => a - b).slice(0, 8);
  }, [total]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h2>ชำระเงิน</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>ยอดที่ต้องชำระ ฿{fmtTHB(total)}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><ICO.x size={18}/></button>
        </div>
        <div className="modal-body">
          <div className="pay-grid">
            <button className={`pay-tile ${method === 'cash' ? 'active' : ''}`} onClick={() => setMethod('cash')}>
              <span className="ico"><ICO.cash size={32}/></span>เงินสด
            </button>
            <button className={`pay-tile ${method === 'qr' ? 'active' : ''}`} onClick={() => setMethod('qr')}>
              <span className="ico"><ICO.qr size={32}/></span>พร้อมเพย์ / QR
            </button>
            <button className={`pay-tile ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}>
              <span className="ico"><ICO.bank size={32}/></span>บัตรเครดิต/เดบิต
            </button>
          </div>

          {method === 'cash' && (
            <>
              <div className="field">
                <label>รับเงินมา</label>
                <input type="text" inputMode="numeric" placeholder="0"
                  value={received}
                  onChange={(e) => setReceived(e.target.value.replace(/[^0-9.]/g, ''))}
                  autoFocus
                  style={{ fontSize: 24, fontWeight: 700, textAlign: 'right' }}
                />
                <div className="cash-buttons">
                  {presets.map((p) => (
                    <button key={p} className="cash-btn" onClick={() => setReceived(String(p))}>
                      ฿{fmtTHB(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="change-display">
                <div className="label">เงินทอน</div>
                <div className="amt">฿{fmtTHB(change)}</div>
              </div>
            </>
          )}

          {method === 'qr' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 200, height: 200, margin: '0 auto', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 18 }}>
                <FakeQR size={164}/>
              </div>
              <div style={{ marginTop: 12, color: 'var(--ink-2)' }}>ให้ลูกค้าสแกน QR เพื่อโอน ฿{fmtTHB(total)}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-3)' }}>กดยืนยันเมื่อได้รับการแจ้งเตือนจากธนาคาร</div>
            </div>
          )}

          {method === 'card' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>โปรดเสียบ/แตะบัตรที่เครื่อง EDC</div>
              <div style={{ marginTop: 6, color: 'var(--ink-3)' }}>ยอด ฿{fmtTHB(total)}</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary btn-lg" disabled={!canConfirm}
            onClick={() => onConfirm({
              method: { cash: 'เงินสด', qr: 'พร้อมเพย์', card: 'บัตร' }[method],
              received: method === 'cash' ? recv : total,
              change: method === 'cash' ? change : 0,
            })}>
            <ICO.check size={18}/> ยืนยันและพิมพ์ใบเสร็จ
          </button>
        </div>
      </div>
    </div>
  );
}

// SVG placeholder QR — pseudo-random grid
function FakeQR({ size = 160 }) {
  const N = 25;
  // Deterministic-ish grid so it looks "QR-shaped"
  const cells = React.useMemo(() => {
    const rng = (i) => ((i * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: N * N }, (_, i) => rng(i) > 0.5);
  }, []);
  const cs = size / N;
  // Corner finder patterns
  const FinderPattern = ({ x, y }) => (
    <>
      <rect x={x} y={y} width={cs * 7} height={cs * 7} fill="#000"/>
      <rect x={x + cs} y={y + cs} width={cs * 5} height={cs * 5} fill="#fff"/>
      <rect x={x + cs * 2} y={y + cs * 2} width={cs * 3} height={cs * 3} fill="#000"/>
    </>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#fff"/>
      {cells.map((on, i) => {
        const r = Math.floor(i / N), c = i % N;
        // skip finder squares
        const inFinder = (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
        if (inFinder || !on) return null;
        return <rect key={i} x={c * cs} y={r * cs} width={cs} height={cs} fill="#000"/>;
      })}
      <FinderPattern x={0} y={0}/>
      <FinderPattern x={(N - 7) * cs} y={0}/>
      <FinderPattern x={0} y={(N - 7) * cs}/>
    </svg>
  );
}

// === Webcam scanner (simulated) ===
function WebcamScanner({ onCode }) {
  const [manual, setManual] = React.useState('');
  return (
    <div>
      <div className="webcam-sim">
        <div className="grid"></div>
        <div className="reticle">
          <div className="laser"></div>
        </div>
        <div className="hint">โหมดกล้อง · จัดบาร์โค้ดให้อยู่ในกรอบ</div>
      </div>
      <form className="scan-field" onSubmit={(e) => { e.preventDefault(); if (manual) { onCode(manual.trim()); setManual(''); }}}>
        <span className="scan-ico"><ICO.qrCam size={28}/></span>
        <input value={manual} onChange={(e) => setManual(e.target.value)}
          placeholder="หรือพิมพ์บาร์โค้ดเอง" autoComplete="off"/>
      </form>
    </div>
  );
}

Object.assign(window, { POSScreen, FakeQR });
