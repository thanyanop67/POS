// app.jsx — Main App: layout, routing, shared state, Tweaks
const { useState, useMemo, useEffect, useCallback } = React;

const THEMES = {
  classic: { name: 'น้ำเงินคลาสสิก', brand: '#1E55B8', dark: '#103E92', soft: '#E7EEFB' },
  navy:    { name: 'กรมท่าเข้ม',     brand: '#1D3F7C', dark: '#0E2659', soft: '#E3E8F3' },
  teal:    { name: 'น้ำเงิน-เขียว',   brand: '#1A6C8A', dark: '#0E4D66', soft: '#DDF0F4' },
  emerald: { name: 'เขียวมรกต',       brand: '#13754A', dark: '#075632', soft: '#DCEFE3' },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "posLayout": "classic",
  "scanMode": "hid",
  "theme": "classic",
  "showStorefront": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState('dashboard');
  const [routeArg, setRouteArg] = useState(null);

  // ---- Supabase Auth ----
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    if (!window.sb) { setAuthReady(true); return; }
    window.sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = window.sb.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- Data ----
  const [products, setProducts] = useState(() => SEED_PRODUCTS.map((p) => ({ ...p })));
  const [restocks, setRestocks] = useState(() => SEED_RESTOCKS.map((r) => ({ ...r })));
  const [bills, setBills] = useState(() => SEED_BILLS.map((b) => ({ ...b })));
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [dbReady, setDbReady] = useState(!window.sb);

  // Load from Supabase once authenticated + shop is open.
  // Bills / restocks are filtered by shopOpenedAt so we only see this session.
  useEffect(() => {
    if (!window.sb || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await DB.fetchAll({ since: shop.openedAt || undefined });
        if (cancelled || !all) return;
        if (all.products.length) setProducts(all.products);
        setBills(all.bills);
        setRestocks(all.restocks);
      } catch (e) {
        console.error('Load from DB failed; using seeds.', e);
      } finally {
        if (!cancelled) setDbReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [session, shop.openedAt]);

  // Realtime sync — listen for changes from other clients
  useEffect(() => {
    if (!window.sb || !session) return;
    const ch = window.sb.channel('pos-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
        } else {
          const p = rowToProduct(payload.new);
          setProducts((prev) => {
            const idx = prev.findIndex((x) => x.id === p.id);
            if (idx === -1) return [...prev, p];
            const next = prev.slice();
            next[idx] = p;
            return next;
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bills' }, (payload) => {
        const b = {
          id: payload.new.id,
          when: new Date(payload.new.occurred_at).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          items: payload.new.items_count,
          total: Number(payload.new.total),
          profit: Number(payload.new.profit),
          method: payload.new.payment_method,
        };
        setBills((prev) => prev.some((x) => x.id === b.id) ? prev : [b, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'restocks' }, (payload) => {
        const r = {
          id: payload.new.id,
          when: new Date(payload.new.occurred_at).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          productId: payload.new.product_id,
          qty: Number(payload.new.qty),
          unitCost: Number(payload.new.unit_cost),
          by: payload.new.by_name,
        };
        setRestocks((prev) => prev.some((x) => x.id === r.id) ? prev : [r, ...prev]);
      })
      .subscribe();
    return () => { window.sb.removeChannel(ch); };
  }, [session]);

  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { ...toast, id }]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 2600);
  }, []);

  // Persist a completed bill + decrement stock in DB
  const pushBill = useCallback((bill) => {
    setBills((prev) => [{ ...bill, isNew: true }, ...prev]);
    if (!window.sb) return;
    (async () => {
      try {
        const lines = (bill.lines || []).map((l) => ({
          productId: l.id,
          qty: l.qty,
          unitPrice: l.price,
          unitCost: l.cost ?? 0,
          lineTotal: l.line,
        }));
        await DB.createBill(bill, lines);
        // Decrement stocks in DB (sequential, best-effort)
        for (const l of bill.lines || []) {
          const cur = await window.sb.from('products').select('stock').eq('id', l.id).single();
          if (cur.data) {
            await DB.updateProductStock(l.id, Number(cur.data.stock) - l.qty);
          }
        }
      } catch (e) {
        console.error('Persist bill failed', e);
        pushToast({ kind: 'warn', text: 'บันทึกลงเซิร์ฟเวอร์ไม่สำเร็จ (เก็บไว้ในเครื่อง)' });
      }
    })();
  }, [pushToast]);

  // Persist a restock entry + increment stock in DB
  const pushRestock = useCallback((rec, productId, addQty, newCost) => {
    setRestocks((prev) => [rec, ...prev]);
    if (!window.sb) return;
    (async () => {
      try {
        await DB.createRestock(rec);
        const cur = await window.sb.from('products').select('stock').eq('id', productId).single();
        if (cur.data) {
          await window.sb.from('products')
            .update({ stock: Number(cur.data.stock) + addQty, cost: newCost })
            .eq('id', productId);
        }
      } catch (e) {
        console.error('Persist restock failed', e);
        pushToast({ kind: 'warn', text: 'บันทึกลงเซิร์ฟเวอร์ไม่สำเร็จ (เก็บไว้ในเครื่อง)' });
      }
    })();
  }, [pushToast]);

  const gotoRestock = (barcode) => {
    setRouteArg(barcode || null);
    setRoute('restock');
  };
  const gotoForecast = () => setRoute('forecast');

  // Apply theme variables
  useEffect(() => {
    const th = THEMES[t.theme] || THEMES.classic;
    const root = document.documentElement;
    root.style.setProperty('--brand', th.brand);
    root.style.setProperty('--brand-dark', th.dark);
    root.style.setProperty('--brand-soft', th.soft);
  }, [t.theme]);

  const lowCount = products.filter((p) => p.stock <= p.lowStockAt).length;
  const newBillsCount = bills.filter((b) => b.isNew).length;

  // Derive a friendly display name from the logged-in email
  const userName = (() => {
    const raw = session?.user?.email || '';
    const local = raw.split('@')[0] || '';
    if (!local) return STORE.ownerName || 'ผู้ใช้';
    // Replace separators with spaces, capitalize each word
    return local.split(/[._-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  })();

  // Shop session: { open, openedAt }
  // Auto-closes at midnight: if openedAt is from a previous calendar day,
  // treat the shop as closed so the owner must re-open for the new day.
  const [shop, setShop] = useState(() => {
    try {
      const open = localStorage.getItem('shop-open') === '1';
      const openedAt = localStorage.getItem('shop-opened-at');
      const today = new Date().toDateString();
      const openedDay = openedAt ? new Date(openedAt).toDateString() : null;
      if (open && openedDay !== today) return { open: false, openedAt: null };
      return { open, openedAt };
    } catch { return { open: false, openedAt: null }; }
  });
  const persistShop = (next) => {
    try {
      localStorage.setItem('shop-open', next.open ? '1' : '0');
      if (next.openedAt) localStorage.setItem('shop-opened-at', next.openedAt);
      else localStorage.removeItem('shop-opened-at');
    } catch {}
  };

  const [closingModal, setClosingModal] = useState(null); // { sales, profit, count, top }

  const openShop = useCallback(() => {
    const next = { open: true, openedAt: new Date().toISOString() };
    setShop(next);
    persistShop(next);
    // Reset session lists — fresh start for the new day
    setBills([]);
    setRestocks([]);
    setCart([]);
    pushToast({ kind: 'ok', text: 'เปิดร้านเริ่มขายวันใหม่' });
  }, [pushToast]);

  const promptCloseShop = useCallback(() => {
    // Summary comes straight from local state — bills are already filtered
    // by shopOpenedAt, so these are just "this session's" totals.
    const sales = bills.reduce((s, b) => s + b.total, 0);
    const profit = bills.reduce((s, b) => s + b.profit, 0);
    const count = bills.length;
    const counts = {};
    bills.forEach((b) => {
      (b.lines || []).forEach((l) => {
        counts[l.id] = counts[l.id] || { name: l.name, qty: 0 };
        counts[l.id].qty += l.qty;
      });
    });
    const top = Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 3);
    setClosingModal({ sales, profit, count, top });
  }, [bills]);

  const confirmCloseShop = useCallback(() => {
    const next = { open: false, openedAt: null };
    setShop(next);
    persistShop(next);
    setClosingModal(null);
    pushToast({ kind: 'ok', text: 'ปิดร้านแล้ว — สรุปวันนี้ถูกบันทึก' });
  }, [pushToast]);

  // Today's date string
  const todayStr = new Date().toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  // Auth gate
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
        กำลังโหลด...
      </div>
    );
  }
  if (window.sb && !session) {
    return <LoginScreen onSession={setSession}/>;
  }
  if (!shop.open) {
    return <ShopGate userName={userName} onOpen={openShop}/>;
  }

  const titles = {
    pos:       { h: 'หน้าขาย (POS)',           sub: 'รับชำระเงินและสรุปบิล' },
    dashboard: { h: 'ภาพรวมวันนี้',             sub: 'ยอดขาย กำไร และสรุปประจำวัน' },
    forecast:  { h: 'คาดการณ์ความต้องการไข่ไก่', sub: 'แนะนำจำนวนแผงที่ควรสั่งจากยอดขาย 7 วัน' },
    inventory: { h: 'คลังสินค้า',               sub: 'ดูและจัดการรายการสินค้า' },
    restock:   { h: 'เติมสต๊อก',                sub: 'รับของเข้าและอัปเดตราคาทุน' },
    settings:  { h: 'การจัดการพื้นที่ข้อมูล',     sub: 'ตั้งค่าการเก็บและทำความสะอาดข้อมูลอัตโนมัติ' },
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark logo">
            <img src={STORE.logo} alt={STORE.name}/>
          </div>
          <div>
            <div className="brand-name">{STORE.name}</div>
            <div className="brand-sub">ของชำ · ไข่ไก่ · อาหารสัตว์</div>
          </div>
        </div>
        <nav className="nav">
          <NavItem icon={<ICO.dashboard/>} label="แดชบอร์ด" active={route === 'dashboard'}
            onClick={() => setRoute('dashboard')} badge={newBillsCount > 0 ? newBillsCount : null}/>
          <NavItem icon={<ICO.pos/>} label="หน้าขาย" active={route === 'pos'}
            onClick={() => setRoute('pos')}/>
          <NavItem icon={<ICO.egg/>} label="คาดการณ์ไข่ไก่" active={route === 'forecast'}
            onClick={() => setRoute('forecast')}/>
          <NavItem icon={<ICO.inventory/>} label="คลังสินค้า" active={route === 'inventory'}
            onClick={() => setRoute('inventory')}/>
          <NavItem icon={<ICO.restock/>} label="เติมสต๊อก" active={route === 'restock'}
            onClick={() => { setRouteArg(null); setRoute('restock'); }}/>
          <NavItem icon={<ICO.history/>} label="จัดการข้อมูล" active={route === 'settings'}
            onClick={() => setRoute('settings')}/>
        </nav>
        <div className="nav-spacer"/>

        {/* Storefront thumbnail */}
        {t.showStorefront && (
          <div className="storefront-card" onClick={() => setRoute('dashboard')}>
            <img src={STORE.storefront} alt="ร้านนายตะวัน"/>
            <div className="sf-shade">
              <div className="sf-name">{STORE.name}</div>
              <div className="sf-addr">เปิด {STORE.openTime}–{STORE.closeTime} น.</div>
            </div>
          </div>
        )}

        {lowCount > 0 && (
          <div className="low-alert" onClick={() => setRoute('dashboard')}>
            <ICO.alert size={18}/>
            <div>
              <div style={{ fontWeight: 600 }}>สต๊อกต่ำ {lowCount} รายการ</div>
              <div style={{ fontSize: 12, marginTop: 2, opacity: .85 }}>ดูในแดชบอร์ด →</div>
            </div>
          </div>
        )}
        <div className="nav-user">
          <div className="avatar">{STORE.ownerInitial}</div>
          <div>
            <div className="nav-user-name">{STORE.ownerName}</div>
            <div className="nav-user-role">เจ้าของร้าน</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <div>
            <div className="crumbs">{STORE.name} / {titles[route].h}</div>
            <h1>{titles[route].h}</h1>
            <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 2 }}>{titles[route].sub}</div>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="pill"
              onClick={promptCloseShop}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'var(--ok-soft, #DCEFE3)',
                color: 'var(--ok, #13754A)',
                fontFamily: 'inherit',
              }}
              title="กดเพื่อปิดร้าน">
              <span className="dot" style={{ background: 'var(--ok, #13754A)' }}></span>
              ร้านเปิด
            </button>
            <span className="pill"><span className="dot"></span>เชื่อมต่ออยู่</span>
            <span className="pill">
              <ICO.history size={14}/>
              {todayStr} · {STORE.openTime}–{STORE.closeTime}
            </span>
            <button className="btn btn-ghost btn-icon" title="แจ้งเตือน">
              <ICO.bell size={18}/>
            </button>
          </div>
        </header>

        {route === 'pos' && (
          <POSScreen
            products={products} setProducts={setProducts}
            cart={cart} setCart={setCart}
            pushToast={pushToast} pushBill={pushBill} openReceipt={setReceipt}
            layout={t.posLayout}
            scanMode={t.scanMode}
            setScanMode={(m) => setTweak('scanMode', m)}
          />
        )}
        {route === 'inventory' && (
          <InventoryScreen products={products} setProducts={setProducts}
            pushToast={pushToast} gotoRestock={gotoRestock}/>
        )}
        {route === 'restock' && (
          <RestockScreen products={products} setProducts={setProducts}
            restocks={restocks} setRestocks={setRestocks}
            pushRestock={pushRestock}
            pushToast={pushToast} initialBarcode={routeArg}
            userName={userName}/>
        )}
        {route === 'dashboard' && (
          <DashboardScreen products={products} bills={bills}
            gotoRestock={gotoRestock} gotoForecast={gotoForecast}/>
        )}
        {route === 'forecast' && (
          <ForecastScreen products={products} pushToast={pushToast}
            gotoRestock={gotoRestock}/>
        )}
      </div>

      {receipt && <ReceiptModal bill={receipt} onClose={() => setReceipt(null)}/>}

      {closingModal && (
        <CloseShopModal
          summary={closingModal}
          lowCount={lowCount}
          onCancel={() => setClosingModal(null)}
          onConfirm={confirmCloseShop}/>
      )}

      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind || ''}`}>
            {t.kind === 'ok' && <ICO.check size={18}/>}
            {t.kind === 'warn' && <ICO.alert size={18}/>}
            {t.kind === 'danger' && <ICO.alert size={18}/>}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="โทนสี">
          <TweakColor
            label="ธีม"
            value={[THEMES[t.theme].brand, THEMES[t.theme].dark, THEMES[t.theme].soft]}
            options={Object.values(THEMES).map((th) => [th.brand, th.dark, th.soft])}
            onChange={(arr) => {
              const key = Object.keys(THEMES).find((k) => THEMES[k].brand === arr[0]);
              if (key) setTweak('theme', key);
            }}/>
        </TweakSection>
        <TweakSection label="หน้า POS">
          <TweakRadio label="เลย์เอาต์"
            value={t.posLayout}
            options={[
              { value: 'classic', label: 'สินค้า/บิล' },
              { value: 'cashier', label: 'บิล/สินค้า' },
            ]}
            onChange={(v) => setTweak('posLayout', v)}/>
          <TweakRadio label="โหมดสแกน"
            value={t.scanMode}
            options={[
              { value: 'hid', label: 'ยิงบาร์โค้ด' },
              { value: 'webcam', label: 'กล้อง' },
            ]}
            onChange={(v) => setTweak('scanMode', v)}/>
        </TweakSection>
        <TweakSection label="ทั่วไป">
          <TweakToggle label="แสดงภาพร้านในเมนู"
            value={t.showStorefront}
            onChange={(v) => setTweak('showStorefront', v)}/>
        </TweakSection>
        <TweakSection label="เดโม่">
          <TweakButton label="รีเซ็ตข้อมูลตัวอย่าง"
            onClick={() => {
              setProducts(SEED_PRODUCTS.map((p) => ({ ...p })));
              setRestocks(SEED_RESTOCKS.map((r) => ({ ...r })));
              setBills(SEED_BILLS.map((b) => ({ ...b })));
              setCart([]);
              pushToast({ kind: 'ok', text: 'รีเซ็ตข้อมูลเดโม่แล้ว' });
            }}/>
        </TweakSection>
        {window.sb && session && (
          <TweakSection label="บัญชี">
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
              {session.user?.email}
            </div>
            <TweakButton label="ออกจากระบบ"
              onClick={async () => {
                await window.sb.auth.signOut();
                pushToast({ kind: 'ok', text: 'ออกจากระบบแล้ว' });
              }}/>
          </TweakSection>
        )}
      </TweaksPanel>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-ico">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto',
          background: 'var(--brand)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 10,
        }}>{badge}</span>
      )}
    </button>
  );
}

function ShopGate({ userName, onOpen }) {
  const nowStr = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg, #F2F4F8)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,.08)',
        textAlign: 'center',
      }}>
        <img src={STORE.logo} alt="" style={{
          width: 72, height: 72, borderRadius: 14,
          margin: '0 auto 16px', display: 'block',
        }}/>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{STORE.name}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3, #6B7280)', marginBottom: 24 }}>
          {nowStr}
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--bg, #F2F4F8)',
          borderRadius: 10,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, color: 'var(--ink-2, #374151)', marginBottom: 4 }}>
            ยินดีต้อนรับ <strong>{userName}</strong>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3, #6B7280)' }}>
            ร้านยังไม่ได้เปิด — กดปุ่มด้านล่างเพื่อเริ่มวันใหม่
          </div>
        </div>

        <button onClick={onOpen} style={{
          width: '100%', padding: '14px 12px',
          background: 'var(--brand, #1E55B8)', color: '#fff',
          border: 'none', borderRadius: 10,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          เปิดร้าน
        </button>

        <div style={{
          marginTop: 16, fontSize: 12, color: 'var(--ink-3, #6B7280)',
        }}>
          ยอดขาย/บิลของวันนี้จะเริ่มนับใหม่หลังกดเปิดร้าน
        </div>
      </div>
    </div>
  );
}

function CloseShopModal({ summary, lowCount, onCancel, onConfirm }) {
  const { sales, profit, count, top } = summary;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <h2>สรุปก่อนปิดร้าน</h2>
          <button className="btn btn-ghost btn-icon" onClick={onCancel} title="ปิด">
            <ICO.x size={18}/>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            <SummaryStat label="ยอดขายวันนี้" value={`฿${fmtTHB(sales)}`} accent="var(--brand)"/>
            <SummaryStat label="กำไรวันนี้" value={`฿${fmtTHB(profit)}`} accent="var(--ok, #13754A)"/>
            <SummaryStat label="จำนวนบิล" value={fmtInt(count)} accent="var(--ink)"/>
          </div>

          {top.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>สินค้าขายดีวันนี้</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {top.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg, #F2F4F8)', borderRadius: 8, fontSize: 14,
                  }}>
                    <span><strong style={{ marginRight: 6 }}>{i + 1}.</strong>{t.name}</span>
                    <span style={{ color: 'var(--ink-3)' }}>{fmtInt(t.qty)} ชิ้น</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowCount > 0 && (
            <div style={{
              padding: '10px 14px',
              background: '#FEF3C7',
              color: '#92400E',
              borderRadius: 8,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <ICO.alert size={16}/>
              <span>มีสินค้าสต๊อกต่ำ {lowCount} รายการ — อย่าลืมเติมพรุ่งนี้</span>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>ยืนยันปิดร้าน</button>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--bg, #F2F4F8)',
      borderRadius: 10,
      padding: 12,
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3, #6B7280)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
