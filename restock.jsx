// restock.jsx — Restock flow
// Web panel:  finder (scan QR/barcode), product detail, qty + cost form, save
// Mobile mockup: iPhone frame with camera viewfinder + same form
// Both write into the shared products list (updates stock + last-cost)

function RestockScreen({ products, setProducts, restocks, setRestocks, pushToast, initialBarcode }) {
  const [code, setCode] = React.useState(initialBarcode || '');
  const [found, setFound] = React.useState(initialBarcode ? products.find((p) => p.barcode === initialBarcode) : null);
  const [qty, setQty] = React.useState('');
  const [unitCost, setUnitCost] = React.useState('');
  const codeRef = React.useRef(null);

  React.useEffect(() => { codeRef.current?.focus(); }, []);

  // If initialBarcode was passed and product changes (deduped), refresh
  React.useEffect(() => {
    if (initialBarcode) {
      const p = products.find((x) => x.barcode === initialBarcode);
      if (p) {
        setFound(p);
        setCode(p.barcode);
        setUnitCost(String(p.cost));
      }
    }
  }, [initialBarcode]);

  const lookup = (raw) => {
    const c = (raw || '').trim();
    if (!c) return;
    const p = products.find((x) => x.barcode === c || x.id === c);
    if (p) {
      setFound(p);
      setUnitCost(String(p.cost));
      pushToast({ kind: 'ok', text: `พบสินค้า: ${p.name}` });
    } else {
      setFound(null);
      pushToast({ kind: 'danger', text: `ไม่พบบาร์โค้ด/QR: ${c}` });
    }
  };

  const onScanSubmit = (e) => { e.preventDefault(); lookup(code); };

  const qtyN = Number(qty) || 0;
  const costN = Number(unitCost) || 0;
  const totalCost = qtyN * costN;
  const canSave = found && qtyN > 0 && costN > 0;

  const save = () => {
    if (!canSave) return;
    setProducts((prev) => prev.map((p) =>
      p.id === found.id ? { ...p, stock: p.stock + qtyN, cost: costN } : p
    ));
    const newRec = {
      id: 'r' + Date.now().toString(36),
      when: new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      productId: found.id,
      qty: qtyN,
      unitCost: costN,
      by: 'คุณวรรณา',
    };
    setRestocks((prev) => [newRec, ...prev]);
    pushToast({ kind: 'ok', text: `เติม ${found.name} +${qtyN} ${found.unit}` });
    // reset
    setQty('');
    setCode('');
    setFound(null);
    setUnitCost('');
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  return (
    <div className="restock">
      {/* WEB COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>เติมสินค้า (Restock)</h3>
              <div className="panel-sub">สแกน QR/บาร์โค้ดเพื่อค้นหาสินค้า แล้วระบุจำนวนและราคาทุนใหม่</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge info"><ICO.user size={12}/> คุณวรรณา · ผู้ดูแล</span>
            </div>
          </div>

          <div className="restock-finder">
            <form className="scan-big" onSubmit={onScanSubmit}>
              <div className="scan-vis">
                <ICO.scan size={44} sw={1.4}/>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>ยิงบาร์โค้ด หรือพิมพ์รหัส แล้วกด Enter</div>
                <input ref={codeRef} value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น 8850987654321"/>
              </div>
              <button type="submit" className="btn btn-primary btn-lg">ค้นหา</button>
            </form>
          </div>

          {found && (
            <>
              <div className="restock-prod">
                <div className="thumb"><span className="ph-tag">รูปสินค้า</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 19, fontWeight: 600 }}>{found.name}</div>
                  <div style={{ marginTop: 6, color: 'var(--ink-3)', fontSize: 13 }} className="row">
                    <span className="sku-tag">{found.barcode}</span>
                    <span>·</span>
                    <span>{CATEGORIES.find((c) => c.id === found.category)?.name}</span>
                  </div>
                  <div className="row" style={{ marginTop: 12, gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>คงเหลือ</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: found.stock <= found.lowStockAt ? 'var(--warn)' : 'var(--ink)' }}>
                        {found.stock} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)' }}>{found.unit}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>ราคาทุนล่าสุด</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>฿{fmtTHB(found.cost)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>ราคาขาย</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-dark)' }}>฿{fmtTHB(found.price)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>จุดเตือนสต๊อก</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{found.lowStockAt}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="restock-form">
                <div className="field">
                  <label>จำนวนที่เติม</label>
                  <input type="text" inputMode="numeric" placeholder="0"
                    value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}/>
                  <span className="hint">หน่วย: {found.unit}</span>
                </div>
                <div className="field">
                  <label>ราคาทุนต่อหน่วย (บาท)</label>
                  <input type="text" inputMode="decimal" placeholder="0.00"
                    value={unitCost} onChange={(e) => setUnitCost(e.target.value.replace(/[^0-9.]/g, ''))}/>
                  <span className="hint">ระบบจะอัปเดตเป็นราคาทุนล่าสุด</span>
                </div>

                <div className="restock-summary">
                  <div className="item">
                    <div className="l">มูลค่าที่เติม</div>
                    <div className="v">฿{fmtTHB(totalCost)}</div>
                  </div>
                  <div className="item">
                    <div className="l">คงเหลือใหม่</div>
                    <div className="v">{(found.stock + qtyN).toLocaleString()} {found.unit}</div>
                  </div>
                  <div className="item">
                    <div className="l">กำไรต่อชิ้น (ประมาณ)</div>
                    <div className="v" style={{ color: 'var(--ok)' }}>฿{fmtTHB(found.price - costN)}</div>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button className="btn btn-lg" onClick={() => { setFound(null); setCode(''); setQty(''); setUnitCost(''); }}>
                    ยกเลิก
                  </button>
                  <button className="btn btn-primary btn-lg" disabled={!canSave} onClick={save}>
                    <ICO.check size={18}/> บันทึกการเติม
                  </button>
                </div>
              </div>
            </>
          )}

          {!found && (
            <div className="empty-state">
              <h3>ยังไม่ได้เลือกสินค้า</h3>
              <p>ยิงบาร์โค้ดด้านบน หรือใช้มือถือสแกน QR ที่กล่อง/แพ็คสินค้า</p>
            </div>
          )}
        </div>

        {/* Recent restocks */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>การเติมสต๊อกล่าสุด</h3>
              <div className="panel-sub">บันทึก {restocks.length} รายการล่าสุด</div>
            </div>
          </div>
          <div className="recent-list">
            {restocks.slice(0, 8).map((r) => {
              const p = products.find((x) => x.id === r.productId);
              return (
                <div key={r.id} className="recent-row">
                  <div>
                    <div style={{ fontWeight: 500 }}>{p?.name || r.productId}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                      {r.when} · โดย {r.by}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>+{r.qty} {p?.unit || ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>฿{fmtTHB(r.unitCost)}/หน่วย</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--brand-dark)' }}>
                    ฿{fmtTHB(r.qty * r.unitCost)}
                  </div>
                </div>
              );
            })}
            {restocks.length === 0 && (
              <div className="empty-state"><h3>ยังไม่มีประวัติ</h3></div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE COLUMN */}
      <div className="mobile-col">
        <div className="mobile-mock-wrap">
          <RestockMobile products={products} pushToast={pushToast}
            onSubmit={(p, q, c) => {
              setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, stock: x.stock + q, cost: c } : x));
              setRestocks((prev) => [{
                id: 'r' + Date.now().toString(36),
                when: new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                productId: p.id, qty: q, unitCost: c, by: 'คุณวรรณา (มือถือ)',
              }, ...prev]);
              pushToast({ kind: 'ok', text: `เติม ${p.name} +${q} ${p.unit} จากมือถือ` });
            }}/>
        </div>
      </div>
    </div>
  );
}

// === Mobile mockup of restock flow ===
function RestockMobile({ products, onSubmit, pushToast }) {
  const [step, setStep] = React.useState('scan'); // scan -> form -> done
  const [found, setFound] = React.useState(null);
  const [qty, setQty] = React.useState('');
  const [cost, setCost] = React.useState('');

  const pretendScan = () => {
    // Pick a "scanned" product (a low-stock one for storytelling)
    const candidates = products.filter((p) => p.stock <= p.lowStockAt);
    const pick = candidates[Math.floor(Math.random() * candidates.length)] || products[0];
    setFound(pick);
    setCost(String(pick.cost));
    setStep('form');
  };

  const save = () => {
    const q = Number(qty), c = Number(cost);
    if (!q || !c) return;
    onSubmit(found, q, c);
    setStep('done');
    setTimeout(() => { setStep('scan'); setFound(null); setQty(''); setCost(''); }, 1600);
  };

  return (
    <IOSDevice width={358} height={744} title="เติมสต๊อก" className="mobile-mock-frame">
      {step === 'scan' && (
        <div style={{ paddingTop: 4 }}>
          <div style={{ padding: '4px 16px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.01em' }}>สแกน QR/บาร์โค้ด</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>เล็งกล้องไปที่กล่องหรือแพ็คสินค้า</div>
          </div>

          <div className="mob-scan">
            <div className="reticle-m"></div>
            <div className="laser-m"></div>
            <div className="qr">
              <FakeQR size={110}/>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, margin: '12px 16px' }}>
            <button className="mob-cta" style={{ margin: 0, width: '100%' }} onClick={pretendScan}>
              จำลองสแกนสำเร็จ
            </button>
          </div>

          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
            💡 บนเครื่องจริง — ระบบจะอ่าน QR อัตโนมัติเมื่ออยู่ในกรอบ
          </div>
        </div>
      )}

      {step === 'form' && found && (
        <div>
          <div style={{ padding: '4px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setStep('scan')}
              style={{ width: 36, height: 36, borderRadius: 18, background: '#F0F2F8', border: 0, display: 'grid', placeItems: 'center' }}>
              <ICO.back size={18}/>
            </button>
            <div style={{ fontSize: 20, fontWeight: 700 }}>กรอกข้อมูล</div>
          </div>

          <div className="mob-found">
            <div className="ph"></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{found.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>{found.barcode}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                คงเหลือ <b>{found.stock}</b> {found.unit} · ทุน <b>฿{fmtTHB(found.cost)}</b>
              </div>
            </div>
          </div>

          <div className="mob-field">
            <label>จำนวนที่เติม ({found.unit})</label>
            <input type="text" inputMode="numeric" placeholder="0"
              value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ''))}/>
          </div>
          <div className="mob-field">
            <label>ราคาทุนต่อหน่วย (บาท)</label>
            <input type="text" inputMode="decimal" placeholder="0.00"
              value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ''))}/>
          </div>

          {qty && cost && (
            <div style={{ margin: '10px 16px', padding: 12, background: '#E7EEFB', borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: '#103E92' }}>มูลค่าเติมทั้งหมด</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#103E92' }}>฿{fmtTHB(Number(qty) * Number(cost))}</div>
            </div>
          )}

          <button className="mob-cta" onClick={save} disabled={!qty || !cost}
            style={{ opacity: !qty || !cost ? 0.5 : 1 }}>
            บันทึกและอัปเดตคลัง
          </button>
        </div>
      )}

      {step === 'done' && (
        <div style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto', borderRadius: 40, background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center' }}>
            <ICO.check size={48}/>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>บันทึกสำเร็จ</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>
            +{qty} {found?.unit} · ฿{fmtTHB(Number(qty) * Number(cost))}
          </div>
        </div>
      )}
    </IOSDevice>
  );
}

window.RestockScreen = RestockScreen;
