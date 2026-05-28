import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const KuroLogo = () => (
  <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="36" fontSize="38" fontWeight="700" fill="#00bcd4" fontFamily="monospace">{"{"}</text>
    <text x="12" y="35" fontSize="28" fontWeight="800" fill="#ffffff" fontFamily="Arial, sans-serif">k</text>
    <text x="30" y="36" fontSize="38" fontWeight="700" fill="#888" fontFamily="monospace">{"}"}</text>
  </svg>
);

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
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

  const handleEmailLogin = async (e: React.FormEvent) => {
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
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#fff',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const ghostBtn = {
    width: '100%',
    padding: '10px',
    border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    fontWeight: 500 as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.18s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Glow TL */}
      <div style={{
        position: 'absolute', top: -130, left: -80,
        width: 360, height: 360, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,188,212,0.13) 0%, transparent 70%)',
      }} />
      {/* Glow BR */}
      <div style={{
        position: 'absolute', bottom: -100, right: -60,
        width: 280, height: 280, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 20, overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.75rem 2rem 1.4rem',
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <KuroLogo />
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 20,
              fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.3px',
            }}>
              Kuro<span style={{ color: '#00bcd4' }}>Codex</span>
            </h1>
            <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: '0.5px' }}>
              AI ASSISTANT FOR DEVELOPERS
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 21,
            fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px',
          }}>
            Masuk ke dashboard
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: '0 0 1.4rem', fontWeight: 300 }}>
            Admin panel - akses terbatas
          </p>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 5,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: 4, marginBottom: '1.4rem',
          }}>
            {['email', 'google'].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 7,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.18s',
                  background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: tab === t ? '#fff' : 'rgba(255,255,255,0.38)',
                }}
              >
                {t === 'email' ? 'Email' : 'Google'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 12, padding: '10px 14px', borderRadius: 10,
              fontSize: 13, color: '#f87171',
              background: 'rgba(239,68,68,0.08)',
              border: '0.5px solid rgba(239,68,68,0.18)',
            }}>
              {error}
            </div>
          )}

          {/* Email Panel */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: 11 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
                  Email
                </label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kurocodex.com"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,188,212,0.55)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
                  Password
                </label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="..."
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,188,212,0.55)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: 14 }}>
                <a href="#" style={{ fontSize: 12, color: '#00bcd4', opacity: 0.78, textDecoration: 'none' }}>
                  Lupa password?
                </a>
              </div>

              <button
                type="submit" disabled={isLoading}
                style={{
                  width: '100%', padding: 11, border: 'none', borderRadius: 10,
                  fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer', color: '#fff',
                  background: 'linear-gradient(135deg, #00bcd4, #6366f1)',
                  opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.2rem 0' }}>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>atau</span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <button
                type="button"
                onClick={() => { setTab('google'); setError(''); }}
                style={ghostBtn}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                <GoogleIcon /> Lanjutkan dengan Google
              </button>
            </form>
          )}

          {/* Google Panel */}
          {tab === 'google' && (
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', margin: '0 0 1.2rem', fontWeight: 300, lineHeight: 1.65 }}>
                Login dengan Google Workspace atau akun Gmail yang terdaftar sebagai admin.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                style={{ ...ghostBtn, marginBottom: 12, opacity: isLoading ? 0.5 : 1 }}
                onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                {isLoading
                  ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <GoogleIcon />
                }
                {isLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.2rem 0' }}>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>atau</span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <button
                onClick={() => { setTab('email'); setError(''); }}
                style={ghostBtn}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                Masuk dengan Email
              </button>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>
            Butuh akses?{' '}
            <a href="#" style={{ color: 'rgba(0,188,212,0.65)', textDecoration: 'none' }}>Hubungi administrator</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>
    </div>
  );
}
