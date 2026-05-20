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

  // ---- Auth ----
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

  // Load from Supabase once authenticated (or immediately if no Supabase configured)
  useEffect(() => {
    if (!window.sb || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await DB.fetchAll();
        if (cancelled || !all) return;
        if (all.products.length) setProducts(all.products);
        if (all.bills.length)    setBills(all.bills);
        if (all.restocks.length) setRestocks(all.restocks);
      } catch (e) {
        console.error('Load from DB failed; using seeds.', e);
      } finally {
        if (!cancelled) setDbReady(true);
      }
    })();
    return () => { cancelled = true; };
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

  // Today's date string
  const todayStr = new Date().toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  // Auth gate: show login screen if Supabase configured but user not signed in
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
            pushToast={pushToast} initialBarcode={routeArg}/>
        )}
        {route === 'dashboard' && (
          <DashboardScreen products={products} bills={bills}
            gotoRestock={gotoRestock} gotoForecast={gotoForecast}/>
        )}
        {route === 'forecast' && (
          <ForecastScreen products={products} pushToast={pushToast}
            gotoRestock={gotoRestock}/>
        )}
        {route === 'settings' && (
          <SettingsScreen pushToast={pushToast} bills={bills}/>
        )}
      </div>

      {receipt && <ReceiptModal bill={receipt} onClose={() => setReceipt(null)}/>}

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
