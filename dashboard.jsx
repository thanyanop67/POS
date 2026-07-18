// dashboard.jsx — Today's sales, profit, bill count + 7-day daily sales + low-stock + recent bills
// Egg demand forecast moved to its own tab (forecast.jsx).

function DashboardScreen({ products, bills, gotoRestock, gotoForecast }) {
  // Current shop-session totals (bills are already filtered by shopOpenedAt)
  const sales = bills.reduce((s, b) => s + b.total, 0);
  const profit = bills.reduce((s, b) => s + b.profit, 0);
  const billCount = bills.length;
  const avg = billCount ? Math.round(sales / billCount) : 0;
  const marginPct = sales > 0 ? (profit / sales) * 100 : 0;

  // 7-day daily chart data (includes "today" as the rightmost bar — running total)
  const labels = React.useMemo(() => dayLabels7d(), []);
  const todayLabel = { dayName: 'วันนี้', date: '20 พ.ค.' };
  const salesByDay = [...DAILY_SALES_7D, sales];
  const profitByDay = [...DAILY_PROFIT_7D, profit];
  const billsByDay = [...DAILY_BILLS_7D, billCount];
  const allLabels = [...labels, todayLabel];

  // Compare today (running) to last week's same weekday (index 0 = same weekday last week)
  const yesterdaySales = DAILY_SALES_7D[6];
  const dod = yesterdaySales > 0 ? ((sales - yesterdaySales) / yesterdaySales) * 100 : 0;
  const weekAvg = DAILY_SALES_7D.reduce((s, n) => s + n, 0) / 7;
  const vsAvg = weekAvg > 0 ? ((sales - weekAvg) / weekAvg) * 100 : 0;

  // Top sellers — derived from current shop-session bills
  const productSales = React.useMemo(() => {
    const map = {};
    bills.forEach((b) => {
      (b.lines || []).forEach((l) => {
        const e = map[l.id] || { name: l.name, qty: 0, total: 0 };
        e.qty += l.qty; e.total += l.line;
        map[l.id] = e;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [bills]);

  const lowStock = products
    .filter((p) => p.stock <= p.lowStockAt && p.stock > 0)
    .sort((a, b) => (a.stock / a.lowStockAt) - (b.stock / b.lowStockAt))
    .slice(0, 5);

  return (
    <div className="dash">
      {/* KPIs */}
      <div className="kpis">
        <div className="kpi primary">
          <div className="kpi-label">ยอดขายวันนี้</div>
          <div className="kpi-val">฿{fmtTHB(sales)}</div>
          <div className="kpi-delta">
            {dod >= 0 ? '▲' : '▼'} {Math.abs(dod).toFixed(0)}% เทียบเมื่อวาน
          </div>
          <Sparkline data={salesByDay} stroke="#fff" fill="rgba(255,255,255,0.18)"/>
        </div>
        <div className="kpi">
          <div className="kpi-label">กำไรสุทธิวันนี้</div>
          <div className="kpi-val" style={{ color: 'var(--ok)' }}>฿{fmtTHB(profit)}</div>
          <div className="kpi-delta">กำไร {marginPct.toFixed(1)}% ของยอดขาย</div>
          <Sparkline data={profitByDay} stroke="var(--ok)" fill="rgba(31,138,82,.14)"/>
        </div>
        <div className="kpi">
          <div className="kpi-label">จำนวนบิลวันนี้</div>
          <div className="kpi-val">{billCount} <span style={{ fontSize: 18, color: 'var(--ink-3)', fontWeight: 400 }}>บิล</span></div>
          <div className="kpi-delta">เฉลี่ย ฿{fmtTHB(avg)} / บิล</div>
          <Sparkline data={billsByDay} stroke="var(--brand)" fill="rgba(30,85,184,.14)"/>
        </div>
      </div>

      {/* 7-day daily chart */}
      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>ยอดขายรายวัน — 7 วันย้อนหลัง</h3>
            <div className="panel-sub">รวมวันนี้ที่กำลังขายอยู่ · {STORE.openTime}–{STORE.closeTime} น.</div>
          </div>
          <span className={`badge ${vsAvg >= 0 ? 'ok' : 'warn'}`}>
            <ICO.trendUp size={12}/>
            {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(0)}% vs ค่าเฉลี่ยสัปดาห์
          </span>
        </div>
        <div className="chart-pad">
          <DailyBarChart labels={allLabels} sales={salesByDay} profit={profitByDay}/>
        </div>
      </div>

      {/* Top sellers + low stock */}
      <div className="dash-grid">
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>สินค้าขายดีวันนี้</h3>
              <div className="panel-sub">เรียงตามยอดขาย</div>
            </div>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {productSales.map((p, i) => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', padding: '12px 18px', gap: 12, borderBottom: i < productSales.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--brand-soft)', color: 'var(--brand-dark)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.qty} ชิ้น</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>฿{fmtTHB(p.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>แจ้งเตือนสต๊อกต่ำ</h3>
              <div className="panel-sub">ควรเติมก่อนของจะหมด</div>
            </div>
            <span className="badge warn"><ICO.alert size={12}/> {lowStock.length} รายการ</span>
          </div>
          <div className="low-stock-list">
            {lowStock.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <h3>เยี่ยม — ไม่มีสินค้าที่ต้องเร่งเติม</h3>
              </div>
            ) : lowStock.map((p) => (
              <div key={p.id} className="low-stock-row">
                <div className="low-stock-meta">
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    คงเหลือ <b style={{ color: 'var(--warn)' }}>{p.stock}</b> {p.unit} · จุดเตือน {p.lowStockAt}
                  </span>
                </div>
                <span className="badge warn"><span className="dot"></span>ต่ำ</span>
                <button className="btn btn-primary" onClick={() => gotoRestock(p.barcode)}>
                  <ICO.plus size={14}/> เติม
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bills */}
      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>บิลล่าสุดวันนี้</h3>
            <div className="panel-sub">8 บิลล่าสุด</div>
          </div>
          <button className="btn btn-ghost"><ICO.download size={14}/> ส่งออก CSV</button>
        </div>
        <div style={{ padding: 0 }}>
          {bills.slice(0, 8).map((b) => (
            <div key={b.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', padding: '12px 18px', borderBottom: '1px solid var(--line)', gap: 14, alignItems: 'center' }}>
              <span className="sku-tag">{b.id}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{b.when}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{b.items} ชิ้น</span>
              <span className="badge">{b.method}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right' }}>฿{fmtTHB(b.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === 7-day bar chart ===
function DailyBarChart({ labels, sales, profit }) {
  const max = Math.max(...sales);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 240, padding: '0 4px' }}>
        {sales.map((v, i) => {
          const isToday = i === sales.length - 1;
          const profitH = (profit[i] / max) * 200;
          const salesH = (v / max) * 200;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 12, color: isToday ? 'var(--brand-dark)' : 'var(--ink-2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                ฿{(v / 1000).toFixed(1)}k
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 72,
                height: salesH + 'px',
                background: isToday
                  ? 'linear-gradient(180deg, var(--brand) 0%, var(--brand-dark) 100%)'
                  : 'linear-gradient(180deg, #B4C8E8 0%, #8FAFD7 100%)',
                borderRadius: '6px 6px 0 0',
                minHeight: 4,
                boxShadow: isToday ? '0 0 0 2px var(--brand-soft)' : 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: profitH + 'px',
                  background: isToday ? 'rgba(255,255,255,0.3)' : 'rgba(31,138,82,0.65)',
                  borderRadius: '0 0 6px 6px',
                  borderTop: '1.5px dashed rgba(255,255,255,0.7)',
                }}/>
              </div>
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, color: isToday ? 'var(--brand-dark)' : 'var(--ink)', fontWeight: 700 }}>
                  {labels[i].dayName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{labels[i].date}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, background: 'linear-gradient(180deg, #B4C8E8 0%, #8FAFD7 100%)', borderRadius: 3 }}/>
          ยอดขาย (บาท)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, background: 'rgba(31,138,82,0.65)', borderRadius: 3 }}/>
          กำไรในยอดขาย
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, background: 'var(--brand)', borderRadius: 3, boxShadow: '0 0 0 2px var(--brand-soft)' }}/>
          วันนี้
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data, stroke, fill }) {
  const w = 200, h = 36;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h * 0.8 - 4,
  ]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="kpi-spark" preserveAspectRatio="none" style={{ width: '100%' }}>
      <path d={area} fill={fill}/>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

window.DashboardScreen = DashboardScreen;
