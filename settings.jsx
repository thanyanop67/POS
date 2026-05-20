// settings.jsx — Data retention / cleanup settings
// Designed for non-technical owners: shows the data pipeline as 3 tiers
// (raw → daily summary → monthly summary) and lets them tweak retention
// periods + see when the next cleanup runs.

function SettingsScreen({ pushToast, bills }) {
  // Tier retention periods (days). Sensible defaults.
  const [keepRaw, setKeepRaw] = React.useState(1);        // ดิบ: เก็บแค่วันนี้
  const [keepDaily, setKeepDaily] = React.useState(35);    // สรุปวัน: 5 สัปดาห์
  const [keepMonthly, setKeepMonthly] = React.useState(365); // สรุปเดือน: 1 ปี
  const [autoCleanup, setAutoCleanup] = React.useState(true);
  const [cleanupHour, setCleanupHour] = React.useState('20:30'); // หลังปิดร้าน

  const [confirming, setConfirming] = React.useState(null); // 'raw' | 'daily' | 'monthly' | null

  // Mock storage breakdown
  const storage = {
    raw:     { name: 'ข้อมูลดิบรายบิล',  size: 4.2,  count: bills.length, color: 'var(--brand)',     suffix: 'MB' },
    daily:   { name: 'สรุปรายวัน',       size: 0.8,  count: 35, color: 'var(--ok)',                   suffix: 'MB' },
    monthly: { name: 'สรุปรายเดือน',     size: 0.2,  count: 12, color: 'var(--ink-2)',                suffix: 'MB' },
    images:  { name: 'รูปสินค้า/ใบเสร็จ',  size: 12.4, count: 287, color: 'var(--warn)',               suffix: 'MB' },
  };
  const totalUsed = Object.values(storage).reduce((s, x) => s + x.size, 0);
  const totalQuota = 100; // MB

  // Mock cleanup history
  const cleanupHistory = [
    { when: '20 พ.ค. 00:00', kind: 'อัตโนมัติ', cleared: '184 บิลของเมื่อวาน', saved: '3.6 MB', archived: 'เซฟเป็นสรุปวัน' },
    { when: '19 พ.ค. 00:00', kind: 'อัตโนมัติ', cleared: '167 บิลของวันที่ 18',  saved: '3.2 MB', archived: 'เซฟเป็นสรุปวัน' },
    { when: '15 พ.ค. 00:05', kind: 'อัตโนมัติ', cleared: 'สรุปวันเก่ากว่า 35 วัน', saved: '2.1 MB', archived: 'รวมเข้าสรุปเดือน' },
    { when: '01 พ.ค. 00:00', kind: 'อัตโนมัติ', cleared: 'รวมข้อมูลเดือน เม.ย.',    saved: '0.7 MB', archived: 'เซฟเป็นสรุปเดือน' },
    { when: '28 เม.ย. 14:23', kind: 'ด้วยตนเอง', cleared: 'ลบรูปใบเสร็จเก่า 60+ วัน', saved: '8.4 MB', archived: '–' },
  ];

  // Calculate next cleanup time
  const nextRun = React.useMemo(() => {
    const [hh, mm] = cleanupHour.split(':').map(Number);
    const next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const sameDay = next.toDateString() === new Date().toDateString();
    return sameDay
      ? `วันนี้ ${cleanupHour} น.`
      : `${days[next.getDay()]} ${cleanupHour} น.`;
  }, [cleanupHour]);

  const runCleanup = (kind) => {
    setConfirming(null);
    const messages = {
      raw: 'รวมบิลของเมื่อวานเป็นสรุปวันแล้ว — ประหยัด 3.4 MB',
      daily: 'รวมสรุปวันเก่ากว่า 35 วันเป็นสรุปเดือน — ประหยัด 1.8 MB',
      monthly: 'ลบสรุปเดือนเก่ากว่า 1 ปีแล้ว — ประหยัด 0.5 MB',
      all: 'ทำความสะอาดข้อมูลครบทุกระดับเรียบร้อย',
    };
    pushToast({ kind: 'ok', text: messages[kind] || messages.all });
  };

  return (
    <div className="dash">
      {/* Hero */}
      <div className="settings-hero">
        <div className="sh-left">
          <div className="sh-title">
            <span className="sh-ico"><ICO.history size={24}/></span>
            การจัดการพื้นที่ข้อมูล
          </div>
          <div className="sh-desc">
            เมื่อใช้งานนานๆ ระบบจะมีข้อมูลสะสมมหาศาล —
            เราออกแบบให้ <b>บิบดิบเคลียร์ทุกวันหลังปิดร้าน</b> เหลือไว้แค่
            สรุปยอดเพื่อให้ระบบทำงานเร็วและไม่เปลืองพื้นที่
          </div>
        </div>
        <div className="sh-right">
          <div className="storage-card">
            <div className="storage-head">
              <span className="lbl">พื้นที่ที่ใช้</span>
              <span className="amt">{totalUsed.toFixed(1)} <span>/ {totalQuota} MB</span></span>
            </div>
            <div className="storage-bar">
              {Object.entries(storage).map(([key, s]) => (
                <div key={key}
                  title={`${s.name}: ${s.size} MB`}
                  style={{
                    width: `${(s.size / totalQuota) * 100}%`,
                    background: s.color,
                  }}/>
              ))}
            </div>
            <div className="storage-legend">
              {Object.entries(storage).map(([key, s]) => (
                <span key={key}>
                  <i style={{ background: s.color }}/>{s.name} <b>{s.size} {s.suffix}</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3 tiers as pipeline */}
      <div className="panel">
        <div className="panel-h">
          <div>
            <h3>เส้นทางข้อมูล — 3 ระดับ</h3>
            <div className="panel-sub">ข้อมูลถูกย่อให้เล็กลงเรื่อยๆ อัตโนมัติ เพื่อให้เก็บได้นานโดยไม่เปลือง</div>
          </div>
        </div>

        <div className="tier-pipeline">
          <TierCard
            tier="1"
            color="brand"
            title="ข้อมูลดิบรายบิล"
            subtitle="ทุกบิล ทุกชิ้น ทุกบาท"
            kept={keepRaw}
            keptLabel={keepRaw === 1 ? 'เก็บแค่วันนี้' : `เก็บ ${keepRaw} วันที่ผ่านมา`}
            onKeptChange={setKeepRaw}
            min={1} max={7}
            example="บิล B-2026-0140 · 4 ชิ้น · ฿138 · จ่ายเงินสด · 11:23 น."
            usedFor={['การพิมพ์ใบเสร็จย้อนหลัง', 'การคืนสินค้า', 'ตรวจสอบเฉพาะวัน']}
            cleanupAt={`ทุกวัน ${cleanupHour} น.`}
            onClearNow={() => setConfirming('raw')}
            size={storage.raw.size}
            count={storage.raw.count}
            unit="บิล"
          />

          <div className="tier-arrow">
            <ICO.trendUp size={22}/>
            <span>ย่อเป็นสรุปวัน</span>
          </div>

          <TierCard
            tier="2"
            color="ok"
            title="สรุปรายวัน"
            subtitle="ยอดขาย · กำไร · จำนวนบิล · สินค้าขายดี"
            kept={keepDaily}
            keptLabel={`เก็บ ${keepDaily} วันที่ผ่านมา`}
            onKeptChange={setKeepDaily}
            min={7} max={90} step={7}
            example="19 พ.ค. · ฿5,680 · 45 บิล · กำไร ฿1,580 · ขายดี: ไข่เบอร์ 2"
            usedFor={['กราฟยอดขาย 7 วัน', 'คาดการณ์ไข่ไก่', 'เปรียบเทียบรายสัปดาห์']}
            cleanupAt="ทุกวันอาทิตย์ 00:05 น."
            onClearNow={() => setConfirming('daily')}
            size={storage.daily.size}
            count={storage.daily.count}
            unit="วัน"
          />

          <div className="tier-arrow">
            <ICO.trendUp size={22}/>
            <span>ย่อเป็นสรุปเดือน</span>
          </div>

          <TierCard
            tier="3"
            color="ink"
            title="สรุปรายเดือน"
            subtitle="ภาพรวมระยะยาว"
            kept={keepMonthly}
            keptLabel={`เก็บ ${Math.round(keepMonthly / 30)} เดือนที่ผ่านมา`}
            onKeptChange={setKeepMonthly}
            min={90} max={730} step={30}
            example="เมษายน 2026 · ฿142,800 · 1,247 บิล · กำไรรวม ฿38,420"
            usedFor={['รายงานประจำเดือน', 'เปรียบเทียบปีต่อปี', 'ยื่นภาษีสิ้นปี']}
            cleanupAt="ทุกวันที่ 1 ของเดือน"
            onClearNow={() => setConfirming('monthly')}
            size={storage.monthly.size}
            count={storage.monthly.count}
            unit="เดือน"
          />
        </div>
      </div>

      {/* Schedule + manual cleanup */}
      <div className="dash-grid">
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>กำหนดการทำความสะอาดอัตโนมัติ</h3>
              <div className="panel-sub">ระบบจะรันทุกวันหลังปิดร้าน — ไม่รบกวนการขาย</div>
            </div>
          </div>
          <div style={{ padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="setting-row">
              <div>
                <div className="setting-label">เปิดทำความสะอาดอัตโนมัติ</div>
                <div className="setting-hint">แนะนำให้เปิดไว้เสมอ ระบบจะดูแลให้เอง</div>
              </div>
              <button className={`switch ${autoCleanup ? 'on' : ''}`}
                onClick={() => setAutoCleanup(!autoCleanup)}>
                <span/>
              </button>
            </div>

            <div className="divider"/>

            <div className="setting-row">
              <div>
                <div className="setting-label">เวลาทำความสะอาด</div>
                <div className="setting-hint">หลังร้านปิด ({STORE.closeTime} น.) เพื่อไม่ให้ระบบสะดุดตอนขาย</div>
              </div>
              <select className="time-select"
                value={cleanupHour}
                onChange={(e) => setCleanupHour(e.target.value)}>
                <option value="20:30">20:30 น.</option>
                <option value="21:00">21:00 น.</option>
                <option value="22:00">22:00 น.</option>
                <option value="00:00">00:00 น. (เที่ยงคืน)</option>
                <option value="03:00">03:00 น. (ก่อนเปิดร้าน)</option>
              </select>
            </div>

            <div className="next-run">
              <div className="nr-ico"><ICO.history size={20}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>รอบทำความสะอาดถัดไป</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-dark)' }}>{nextRun}</div>
              </div>
              <button className="btn btn-primary" onClick={() => setConfirming('all')}>
                <ICO.flash size={16}/> ทำเลยตอนนี้
              </button>
            </div>

            <div className="info-callout">
              <ICO.alert size={18}/>
              <div>
                <b>ไม่ต้องห่วง</b> — ก่อนเคลียร์ข้อมูลดิบ ระบบจะสรุปยอดเก็บไว้ก่อนเสมอ
                คุณยังย้อนดูยอดขายรายวันได้ {keepDaily} วันย้อนหลัง
                และยอดรายเดือนได้อีก {Math.round(keepMonthly / 30)} เดือน
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>ประวัติการทำความสะอาด</h3>
              <div className="panel-sub">รายการล่าสุด</div>
            </div>
          </div>
          <div style={{ padding: 0 }}>
            {cleanupHistory.map((h, i) => (
              <div key={i} className="cleanup-row">
                <div className="cr-ico"><ICO.check size={16}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{h.cleared}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {h.when} · {h.kind} · {h.archived}
                  </div>
                </div>
                <span className="badge ok">ประหยัด {h.saved}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <ConfirmCleanup
          kind={confirming}
          onCancel={() => setConfirming(null)}
          onConfirm={() => runCleanup(confirming)}
        />
      )}
    </div>
  );
}

// === Tier card ===
function TierCard({
  tier, color, title, subtitle, kept, keptLabel, onKeptChange, min, max, step = 1,
  example, usedFor, cleanupAt, onClearNow, size, count, unit,
}) {
  return (
    <div className={`tier-card color-${color}`}>
      <div className="tc-tier">
        <span className="tc-tier-n">{tier}</span>
        <div>
          <div className="tc-title">{title}</div>
          <div className="tc-sub">{subtitle}</div>
        </div>
      </div>

      <div className="tc-example">
        <div className="tc-example-lbl">ตัวอย่างข้อมูล</div>
        <div className="tc-example-row">{example}</div>
      </div>

      <div className="tc-storage">
        <div>
          <div className="tc-meta-l">ปัจจุบันเก็บ</div>
          <div className="tc-meta-v">{fmtInt(count)} <span>{unit}</span></div>
        </div>
        <div>
          <div className="tc-meta-l">ขนาด</div>
          <div className="tc-meta-v">{size} <span>MB</span></div>
        </div>
      </div>

      <div className="tc-keep">
        <div className="tc-keep-head">
          <span>ระยะเวลาเก็บ</span>
          <b>{keptLabel}</b>
        </div>
        <input type="range" min={min} max={max} step={step} value={kept}
          onChange={(e) => onKeptChange(Number(e.target.value))}
          className="tc-range"/>
        <div className="tc-range-marks">
          <span>{min} วัน</span>
          <span>{max} วัน</span>
        </div>
      </div>

      <div className="tc-usedfor">
        <div className="tc-used-lbl">ใช้ทำอะไร</div>
        <ul>
          {usedFor.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      </div>

      <div className="tc-foot">
        <div>
          <div className="tc-foot-lbl">เคลียร์อัตโนมัติ</div>
          <div className="tc-foot-v">{cleanupAt}</div>
        </div>
        <button className="btn" onClick={onClearNow}>
          <ICO.trash size={14}/> เคลียร์เลย
        </button>
      </div>
    </div>
  );
}

// === Confirm modal ===
function ConfirmCleanup({ kind, onCancel, onConfirm }) {
  const detail = {
    raw: {
      title: 'รวมข้อมูลบิลของเมื่อวาน',
      desc: 'ระบบจะรวมบิลทุกใบของเมื่อวานเป็นสรุปยอดประจำวัน 1 รายการ บิลดิบจะถูกลบ',
      preserved: ['ยอดขายรวมของวัน', 'จำนวนบิล', 'กำไร', 'รายการสินค้าขายดี Top 10'],
      lost: ['รายละเอียดของแต่ละบิลทีละใบ', 'เวลาขายแต่ละบิล'],
    },
    daily: {
      title: 'รวมสรุปวันเก่าเป็นสรุปเดือน',
      desc: 'สรุปวันที่เก่ากว่าระยะที่ตั้งไว้จะถูกรวมเข้าสรุปเดือน',
      preserved: ['ยอดรวมของเดือน', 'กำไรรวมของเดือน', 'จำนวนบิลรวมของเดือน'],
      lost: ['กราฟยอดขายเป็นรายวันของเดือนเก่า'],
    },
    monthly: {
      title: 'ลบสรุปเดือนเก่า',
      desc: 'สรุปเดือนที่เก่ากว่าระยะที่ตั้งไว้จะถูกลบถาวร',
      preserved: ['ไม่มี (เป็นการลบขั้นสุดท้าย)'],
      lost: ['ข้อมูลทั้งหมดของเดือนนั้นจะหายถาวร'],
    },
    all: {
      title: 'ทำความสะอาดข้อมูลครบทุกระดับ',
      desc: 'ระบบจะรันการเคลียร์ทั้ง 3 ระดับตามที่ตั้งค่าไว้',
      preserved: ['สรุปวัน + สรุปเดือนยังอยู่ครบ', 'รายงานทั้งหมดยังดูได้'],
      lost: ['บิลดิบของวันที่เลยระยะเก็บ'],
    },
  }[kind];

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h2>{detail.title}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>โปรดตรวจสอบก่อนยืนยัน</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><ICO.x size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>{detail.desc}</p>

          <div className="confirm-list ok">
            <div className="cl-lbl"><ICO.check size={16}/> ข้อมูลที่ยังเก็บไว้</div>
            <ul>{detail.preserved.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          <div className="confirm-list warn">
            <div className="cl-lbl"><ICO.alert size={16}/> ข้อมูลที่จะถูกลบ</div>
            <ul>{detail.lost.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onCancel}>ยกเลิก</button>
          <button className="btn btn-primary btn-lg" onClick={onConfirm}>
            <ICO.check size={18}/> ยืนยัน ทำความสะอาดเลย
          </button>
        </div>
      </div>
    </div>
  );
}

window.SettingsScreen = SettingsScreen;
