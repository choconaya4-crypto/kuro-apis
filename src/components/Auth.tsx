import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const KuroLogo = () => (
  <div style={{
    width: 40, height: 40,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: '-1px',
  }}>
    <span style={{ color: '#00bcd4' }}>{`{`}</span>
    <span style={{ color: '#fff', fontSize: 15 }}>k</span>
    <span style={{ color: '#777' }}>{`}`}</span>
  </div>
);

export default function Auth() {
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithEmail } = useAuth();

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await login();
      if (!result.success) setError(result.error || 'Login gagal');
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      if (!result.success) setError(result.error || 'Login gagal');
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '9px 2px',
    fontSize: 14,
    color: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    borderRadius: 0,
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const ghostBtn = {
    width: '100%',
    padding: '11px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'inherit',
    fontSize: 13.5,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'all 0.18s',
    marginBottom: 10,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 7,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  };

  const Divider = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.4rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>atau</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />
      {/* Glow TL */}
      <div style={{
        position: 'absolute', top: -140, left: -100,
        width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,188,212,0.11) 0%, transparent 68%)',
      }} />
      {/* Glow BR */}
      <div style={{
        position: 'absolute', bottom: -110, right: -70,
        width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 68%)',
      }} />

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <KuroLogo />
          <span style={{
            fontFamily: "'Syne', sans-serif", fontSize: 17,
            fontWeight: 800, color: '#fff', letterSpacing: '-0.3px',
          }}>
            Kuro<span style={{ color: '#00bcd4' }}>Codex</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: 26,
          fontWeight: 800, color: '#fff', letterSpacing: '-0.5px',
          margin: '0 0 6px', lineHeight: 1.1,
        }}>
          Masuk ke<br />dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 300, margin: '0 0 2rem' }}>
          Admin panel · akses terbatas
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: '1.6rem',
        }}>
          {['email', 'google'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '10px', border: 'none',
                background: 'transparent',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.18s',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.3)',
                borderBottom: tab === t ? '2px solid #00bcd4' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t === 'email' ? 'Email' : 'Google'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 14, padding: '10px 14px', borderRadius: 8,
            fontSize: 13, color: '#f87171',
            background: 'rgba(239,68,68,0.08)',
            border: '0.5px solid rgba(239,68,68,0.15)',
          }}>
            {error}
          </div>
        )}

        {/* Email Panel */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kurocodex.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderBottomColor = '#00bcd4'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderBottomColor = '#00bcd4'}
                onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ textAlign: 'right', margin: '8px 0 18px' }}>
              <a href="#" style={{ fontSize: 12, color: '#00bcd4', opacity: 0.7, textDecoration: 'none' }}>
                Lupa password?
              </a>
            </div>

            <button
              type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: 12, border: 'none', borderRadius: 8,
                fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer', color: '#fff',
                background: 'linear-gradient(135deg, #00bcd4 0%, #6366f1 100%)',
                opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s',
                marginBottom: '1.4rem',
              }}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>

            <Divider />

            <button
              type="button"
              onClick={() => { setTab('google'); setError(''); }}
              style={ghostBtn}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <GoogleIcon /> Lanjutkan dengan Google
            </button>
          </form>
        )}

        {/* Google Panel */}
        {tab === 'google' && (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 300, lineHeight: 1.7, marginBottom: '1.4rem', textAlign: 'center' }}>
              Login dengan Google Workspace atau akun Gmail yang terdaftar sebagai admin.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              style={{ ...ghostBtn, opacity: isLoading ? 0.5 : 1 }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              {isLoading
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <GoogleIcon />
              }
              {isLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
            </button>

            <Divider />

            <button
              onClick={() => { setTab('email'); setError(''); }}
              style={ghostBtn}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              Masuk dengan Email
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.6rem', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Butuh akses?{' '}
          <a href="#" style={{ color: 'rgba(0,188,212,0.6)', textDecoration: 'none' }}>Hubungi administrator</a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.15) !important; }
      `}</style>
    </div>
  );
}
