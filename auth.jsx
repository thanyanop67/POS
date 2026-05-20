// auth.jsx — Login gate for ร้านนายตะวัน
// Email + password auth via Supabase. Shows a centered card before
// the rest of the app loads; once authenticated, App renders normally.

function LoginScreen({ onSession }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState('signin'); // 'signin' | 'signup'
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [info, setInfo] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSession?.(data.session);
      } else {
        const { data, error } = await window.sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onSession?.(data.session);
        } else {
          setInfo('สร้างบัญชีสำเร็จ — กรุณาตรวจสอบอีเมลเพื่อยืนยัน');
        }
      }
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  };

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
        maxWidth: 380,
        background: '#fff',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 4px 24px rgba(0,0,0,.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <img src={STORE.logo} alt="" style={{ width: 44, height: 44, borderRadius: 10 }}/>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{STORE.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3, #6B7280)' }}>เข้าสู่ระบบเพื่อใช้งาน</div>
          </div>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>อีเมล</label>
          <input
            type="email" required autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #D1D5DB', fontSize: 14, marginBottom: 12,
              fontFamily: 'inherit',
            }}/>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>รหัสผ่าน</label>
          <input
            type="password" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #D1D5DB', fontSize: 14, marginBottom: 16,
              fontFamily: 'inherit',
            }}/>

          {err && (
            <div style={{
              background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px',
              borderRadius: 8, fontSize: 13, marginBottom: 12,
            }}>{err}</div>
          )}
          {info && (
            <div style={{
              background: '#ECFDF5', color: '#065F46', padding: '8px 12px',
              borderRadius: 8, fontSize: 13, marginBottom: 12,
            }}>{info}</div>
          )}

          <button type="submit" disabled={busy} style={{
            width: '100%', padding: '11px 12px',
            background: 'var(--brand, #1E55B8)', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: busy ? .6 : 1,
            fontFamily: 'inherit',
          }}>
            {busy ? 'กำลังโหลด...' : (mode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี')}
          </button>
        </form>

        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErr(''); setInfo(''); }}
          style={{
            marginTop: 14, background: 'none', border: 'none',
            color: 'var(--brand, #1E55B8)', fontSize: 13, cursor: 'pointer',
            display: 'block', width: '100%', fontFamily: 'inherit',
          }}>
          {mode === 'signin' ? 'ยังไม่มีบัญชี? สร้างบัญชีใหม่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
