// auth.jsx — Supabase Auth login (sign-in only)
// New users must be created via Supabase Dashboard → Authentication → Users.

function LoginScreen({ onSession }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSession?.(data.session);
    } catch (e2) {
      setErr(e2.message || String(e2));
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #D1D5DB', fontSize: 14, marginBottom: 12,
    fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 };

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
          <label style={labelStyle}>อีเมล</label>
          <input type="email" required autoFocus autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}/>

          <label style={labelStyle}>รหัสผ่าน</label>
          <input type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}/>

          {err && (
            <div style={{
              background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px',
              borderRadius: 8, fontSize: 13, marginBottom: 12,
            }}>{err}</div>
          )}

          <button type="submit" disabled={busy} style={{
            width: '100%', padding: '11px 12px',
            background: 'var(--brand, #1E55B8)', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: busy ? .6 : 1,
            fontFamily: 'inherit',
          }}>
            {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{
          marginTop: 14, fontSize: 12, color: 'var(--ink-3, #6B7280)',
          textAlign: 'center',
        }}>
          ยังไม่มีบัญชี? ติดต่อเจ้าของร้านเพื่อขอสิทธิ์
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
