// forecast.jsx — Egg demand forecast (separate tab)
// - Pull last-7-days sales (in ฟอง) per egg size
// - Compute average daily demand, days-of-stock remaining
// - Recommended order for tomorrow / next 7 days
// - Output in ฟอง AND in แผง (1 แผง = 30 ฟอง)

function ForecastScreen({ products, pushToast, gotoRestock }) {
  const eggs = products.filter((p) => p.isEgg).sort((a, b) => a.eggSize - b.eggSize);
  const labels = React.useMemo(() => dayLabels7d(), []);

  // Aggregate totals across all sizes for header summary
  const totals = eggs.reduce((acc, e) => {
    const hist = EGG_SALES_HISTORY[e.eggSize] || [];
    const avg = hist.reduce((s, n) => s + n, 0) / (hist.length || 1);
    const recDay = Math.ceil(avg * 1.1); // 10% safety
    const recWeek = Math.ceil(avg * 7 * 1.1);
    acc.stock += e.stock;
    acc.avg += avg;
    acc.recDay += recDay;
    acc.recWeek += recWeek;
    return acc;
  }, { stock: 0, avg: 0, recDay: 0, recWeek: 0 });

  return (
    <div className="dash">
      {/* Header summary */}
      <div className="forecast-hero">
        <div className="fh-left">
          <div className="fh-title">
            <span className="fh-icon"><ICO.egg size={26}/></span>
            คาดการณ์ความต้องการไข่ไก่
          </div>
          <div className="fh-desc">
            ระบบวิเคราะห์ยอดขายไข่ <b>7 วันย้อนหลัง</b> เพื่อแนะนำจำนวนที่ควรสั่งเติม
            หักลบจากสต๊อกที่มีอยู่จริง รายงานเป็นทั้ง <b>ฟอง</b> และ <b>แผง</b>
            <span className="fh-tag">1 แผง = 30 ฟอง</span>
          </div>
        </div>
        <div className="fh-right">
          <div className="fh-stat">
            <div className="l">สต๊อกไข่รวม</div>
            <div className="v">{fmtInt(totals.stock)} <span>ฟอง</span></div>
            <div className="sub">≈ {ceilPanels(totals.stock)} แผง</div>
          </div>
          <div className="fh-stat">
            <div className="l">ขายเฉลี่ย/วัน</div>
            <div className="v">{Math.round(totals.avg)} <span>ฟอง</span></div>
            <div className="sub">รวมทุกเบอร์</div>
          </div>
          <div className="fh-stat highlight">
            <div className="l">แนะนำสั่งสำหรับ 7 วันข้างหน้า</div>
            <div className="v">{ceilPanels(Math.max(0, totals.recWeek - totals.stock))} <span>แผง</span></div>
            <div className="sub">≈ {Math.max(0, totals.recWeek - totals.stock)} ฟอง</div>
          </div>
        </div>
      </div>

      {/* Egg rows */}
      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>คำแนะนำการสั่งซื้อรายเบอร์</h3>
            <div className="panel-sub">เรียงจากเบอร์ใหญ่ (0) ไปเบอร์เล็ก (4)</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge info">7 วันย้อนหลัง</span>
          </div>
        </div>

        <div className="forecast-grid">
          {eggs.map((p) => (
            <EggForecastCard key={p.id} product={p} labels={labels} gotoRestock={gotoRestock}/>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>วิธีการคำนวณ</h3>
            <div className="panel-sub">โปร่งใส ตรวจสอบได้</div>
          </div>
        </div>
        <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <FormulaCard step="1" title="หาค่าเฉลี่ย"
            desc="รวมยอดขาย 7 วัน ÷ 7 = ขายเฉลี่ยต่อวัน (ฟอง)"/>
          <FormulaCard step="2" title="วันที่จะหมด"
            desc="สต๊อกคงเหลือ ÷ ค่าเฉลี่ย = จำนวนวันที่ขายได้อีก"/>
          <FormulaCard step="3" title="ความต้องการ 7 วัน"
            desc="ค่าเฉลี่ย × 7 × 1.1 (เผื่อ 10%) = ฟองที่ต้องใช้"/>
          <FormulaCard step="4" title="คำนวณแผง"
            desc="(ต้องใช้ − สต๊อกปัจจุบัน) ÷ 30 ปัดขึ้น = แผงที่ควรสั่ง"/>
        </div>
      </div>
    </div>
  );
}

// === Per-size forecast card ===
function EggForecastCard({ product, labels, gotoRestock }) {
  const hist = EGG_SALES_HISTORY[product.eggSize] || [];
  const todaySold = EGG_SALES_TODAY[product.eggSize] || 0;
  const sum = hist.reduce((s, n) => s + n, 0);
  const avg = sum / (hist.length || 1);
  const max = Math.max(...hist, todaySold) || 1;
  const stock = product.stock;
  const daysLeft = avg > 0 ? Math.floor(stock / avg) : 99;

  // Recommended order — for 7 days ahead with 10% safety buffer
  const target7 = Math.ceil(avg * 7 * 1.1);
  const needEggs = Math.max(0, target7 - stock);
  const needPanels = ceilPanels(needEggs);
  const targetTomorrow = Math.ceil(avg * 1.1);

  const status = daysLeft <= 2 ? 'danger' : daysLeft <= 4 ? 'warn' : 'ok';
  const statusLabel = {
    ok: 'พอขาย',
    warn: 'ใกล้หมด',
    danger: 'เร่งด่วน',
  }[status];

  return (
    <div className={`fc-card status-${status}`}>
      {/* Header */}
      <div className="fc-head">
        <div className="fc-num">
          <span className="lbl">เบอร์</span>
          <span className="n">{product.eggSize}</span>
        </div>
        <div className="fc-name">
          <div>{product.name.replace(/\s*\(.*?\)/, '')}</div>
          <div className="fc-meta">฿{fmtTHB(product.price)} / ฟอง · ทุน ฿{fmtTHB(product.cost)}</div>
        </div>
        <span className={`badge ${status}`}><span className="dot"></span>{statusLabel}</span>
      </div>

      {/* Chart */}
      <div className="fc-chart">
        {hist.map((v, i) => (
          <div key={i} className="bar-col">
            <span className="val">{v}</span>
            <div className="bar" style={{ height: `${(v / max) * 100}%` }}/>
            <span className="lab">
              <b>{labels[i].dayName}</b>
              <em>{labels[i].date}</em>
            </span>
          </div>
        ))}
        {/* today */}
        <div className="bar-col">
          <span className="val">{todaySold}</span>
          <div className="bar today" style={{ height: `${(todaySold / max) * 100}%` }}/>
          <span className="lab">
            <b>วันนี้</b>
            <em>กำลังขาย</em>
          </span>
        </div>
      </div>

      {/* Numbers */}
      <div className="fc-numbers">
        <div className="fc-num-row">
          <span>ขายรวม 7 วัน</span>
          <span><b>{sum}</b> ฟอง</span>
        </div>
        <div className="fc-num-row">
          <span>ขายเฉลี่ย/วัน</span>
          <span><b>{avg.toFixed(1)}</b> ฟอง</span>
        </div>
        <div className="fc-num-row">
          <span>สต๊อกคงเหลือ</span>
          <span><b>{stock}</b> ฟอง <em>({(stock / 30).toFixed(1)} แผง)</em></span>
        </div>
        <div className={`fc-num-row em ${status}`}>
          <span>ขายต่อได้อีก</span>
          <span><b>{daysLeft}</b> วัน</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`fc-rec ${status}`}>
        <div className="fc-rec-l">
          <div className="lbl">แนะนำสั่งพรุ่งนี้</div>
          <div className="big">{ceilPanels(targetTomorrow)} <span>แผง</span></div>
          <div className="sub">≈ {targetTomorrow} ฟอง · พอขาย 1 วัน</div>
        </div>
        <div className="fc-rec-divider"/>
        <div className="fc-rec-r">
          <div className="lbl">สั่งครั้งใหญ่ (7 วัน)</div>
          <div className="big">{needPanels} <span>แผง</span></div>
          <div className="sub">
            {needEggs > 0
              ? `ต้องเติมอีก ${needEggs} ฟอง`
              : 'สต๊อกพอแล้วสำหรับสัปดาห์นี้'}
          </div>
        </div>
      </div>

      <button className="btn btn-primary fc-cta"
        onClick={() => gotoRestock(product.barcode)}>
        <ICO.plus size={16}/> ไปเติมสต๊อก
      </button>
    </div>
  );
}

function FormulaCard({ step, title, desc }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--surface-2)',
      borderRadius: 12,
      border: '1px solid var(--line)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14,
        background: 'var(--brand)', color: '#fff',
        display: 'grid', placeItems: 'center',
        fontWeight: 700,
        marginBottom: 10,
      }}>{step}</div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

window.ForecastScreen = ForecastScreen;
