// receipt.jsx — Printable receipt modal
function ReceiptModal({ bill, onClose }) {
  if (!bill) return null;
  const print = () => window.print();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <h2>ใบเสร็จรับเงิน</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>เลขที่บิล {bill.id}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><ICO.x size={18}/></button>
        </div>
        <div className="modal-body" style={{ background: '#F2F4F8' }}>
          <div className="receipt-wrap">
            <div style={{ textAlign: 'center' }}>
              <img src={STORE.logo} alt="" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 4px', display: 'block' }}/>
            </div>
            <h2>{STORE.name}</h2>
            <div className="sub">{STORE.address}</div>
            <div className="sub">{STORE.address2}</div>
            <div className="sub">โทร {STORE.phone}</div>
            <div className="hr"/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span>บิล {bill.id}</span>
              <span>{bill.when}</span>
            </div>
            <div style={{ fontSize: 11 }}>พนักงาน: {STORE.ownerName}</div>
            <div className="hr"/>
            <table>
              <tbody>
                {(bill.lines || []).map((l) => (
                  <React.Fragment key={l.id}>
                    <tr>
                      <td colSpan={3} style={{ paddingTop: 4 }}>{l.name}</td>
                    </tr>
                    <tr>
                      <td className="qty">{l.qty}</td>
                      <td>×฿{fmtTHB(l.price)}</td>
                      <td className="amt">฿{fmtTHB(l.line)}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="hr"/>
            <table>
              <tbody>
                <tr><td>จำนวนรายการ</td><td className="amt">{bill.items} ชิ้น</td></tr>
                <tr className="grand"><td>รวมทั้งสิ้น</td><td className="amt">฿{fmtTHB(bill.total)}</td></tr>
                <tr><td>ชำระโดย {bill.method}</td><td className="amt">฿{fmtTHB(bill.received)}</td></tr>
                {bill.change > 0 && <tr><td>เงินทอน</td><td className="amt">฿{fmtTHB(bill.change)}</td></tr>}
              </tbody>
            </table>
            <div className="hr"/>
            <div className="thanks">ขอบคุณที่อุดหนุน 🙏</div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <FakeQR size={80}/>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4 }}>สแกน QR เพื่อรับใบกำกับภาษีอิเล็กทรอนิกส์</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn btn-primary btn-lg" onClick={print}>
            <ICO.printer size={18}/> พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>
    </div>
  );
}

window.ReceiptModal = ReceiptModal;
