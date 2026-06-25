import { useState, useEffect } from 'react';
import { login as loginApi, loginByEmail as loginByEmailApi } from '../services/api'; // loginByEmailApi used by Google Sign-In

const font = "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

const STATS = [
  { value: '113', label: 'SUCs Covered' },
  { value: '3', label: 'Access Levels' },
  { value: '100%', label: 'Secure' },
];

const FEATURES = [
  { icon: 'bi-file-earmark-richtext', title: 'Agenda Management', desc: 'Organize and track board meeting documents in one place.' },
  { icon: 'bi-shield-lock', title: 'Secure Storage', desc: 'Official SUC documents protected with role-based access.' },
  { icon: 'bi-people', title: 'Multi-Role Access', desc: 'Super Admin, Chairperson & Commissioner, and SUC account tiers.' },
];

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);

  // Load Google Identity Services script once
  useEffect(() => {
    if (document.getElementById('gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId || clientId.startsWith('YOUR_')) {
      setError('Google Sign-In is not configured. Please contact the administrator.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      callback: async (tokenResponse) => {
        try {
          if (tokenResponse.error) throw new Error('Google sign-in was cancelled.');
          const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const info = await resp.json();
          if (!info.email) throw new Error('Could not retrieve email from Google.');
          const res = await loginByEmailApi(info.email);
          onLogin(res.data.user, res.data.token);
        } catch (err) {
          setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const submittedUsername = (formData.get('username') || username || '').toString().trim();
      const submittedPassword = (formData.get('password') || password || '').toString();
      const res = await loginApi({ username: submittedUsername, password: submittedPassword });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-outer" style={{
      position: 'fixed', inset: 0,
      display: 'flex',
      fontFamily: font,
    }}>
      <style>{`
        .login-outer { overflow-y: auto; }
        .login-left { display: flex; }
        .login-right { flex: 1 1 50%; }
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.1); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseStatus {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-glow-1 {
          animation: pulseGlow 10s ease-in-out infinite alternate;
        }
        .animate-glow-2 {
          animation: pulseGlow 14s ease-in-out infinite alternate-reverse;
        }
        .animate-fade-in-up {
          animation: fadeInSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pulse-dot {
          position: relative;
        }
        .pulse-dot::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: inherit;
          animation: pulseStatus 2s infinite ease-in-out;
        }

        .login-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03), 0 16px 40px rgba(13,27,62,0.12) !important;
        }

        .stat-chip {
          transition: all 0.25s ease;
        }
        .stat-chip:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.13) !important;
          border-color: rgba(251,191,36,0.3) !important;
        }

        .input-wrapper input {
          transition: all 0.2s ease;
        }
        .input-wrapper input:focus {
          border-color: #2563eb !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.12) !important;
        }

        @media (max-width: 767px) {
          .login-outer { flex-direction: column; }
          .login-left { display: none !important; }
          .login-right { flex: 1 1 100% !important; min-height: 100vh; padding: 2rem 1.25rem !important; }
        }
      `}</style>

      {/* ══════════════════ LEFT PANEL — dark navy ══════════════════ */}
      <div className="login-left" style={{
        flex: '1 1 50%',
        position: 'relative',
        background: 'linear-gradient(150deg, #071221 0%, #0c1c44 50%, #082862 100%)',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Ambient Glowing Orbs */}
        <div className="animate-glow-1" style={{
          position: 'absolute', top: '15%', left: '-15%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none'
        }} />
        <div className="animate-glow-2" style={{
          position: 'absolute', bottom: '15%', right: '-10%',
          width: '450px', height: '450px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none'
        }} />

        {/* background sun decoration */}
        <svg
          viewBox="0 0 500 500"
          className="animate-float"
          style={{
            position: 'absolute', right: -60, bottom: -60,
            width: 440, height: 440, opacity: 0.06, pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <circle cx="250" cy="250" r="120" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="250" cy="250" r="80" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="250" cy="250" r="45" fill="#fff" opacity="0.6" />
          {[0,45,90,135,180,225,270,315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 250 + 90 * Math.cos(rad);
            const y1 = 250 + 90 * Math.sin(rad);
            const x2 = 250 + 175 * Math.cos(rad);
            const y2 = 250 + 175 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="10" strokeLinecap="round" />;
          })}
          {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 250 + 90 * Math.cos(rad);
            const y1 = 250 + 90 * Math.sin(rad);
            const x2 = 250 + 145 * Math.cos(rad);
            const y2 = 250 + 145 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="6" strokeLinecap="round" />;
          })}
        </svg>

        {/* subtle dot-grid pattern */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* top bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '1rem 2.5rem',
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <img src="/ched-logo.png" alt="CHED" style={{ height: 30, filter: 'brightness(0) invert(1)' }} />
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.1px' }}>
            e-Agenda <span style={{ color: '#fbbf24' }}>System</span>
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <img
              src="/bp-logo-white.png"
              alt="Bagong Pilipinas"
              style={{ height: 30, opacity: 0.9 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        {/* main content */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem 3rem',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{ width: '100%', maxWidth: 440 }}>

            {/* E-Agenda logo — frosted glass container */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}>
                <img
                  src="/e-agenda-logo.png"
                  alt="E-Agenda System"
                  style={{ width: 52, height: 52, objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* gold accent bar */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              marginBottom: '1rem',
            }} />

            <h1 style={{
              fontFamily: font,
              fontWeight: 900,
              fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 0.75rem',
              letterSpacing: '-0.5px',
            }}>
              Commission on<br />
              <span style={{ color: '#fbbf24' }}>Higher Education</span><br />
              e-Agenda Portal
            </h1>

            <p style={{
              fontFamily: font,
              color: 'rgba(255,255,255,0.65)',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              margin: '0 0 1.5rem',
              maxWidth: 420,
            }}>
              A unified digital platform for managing board meeting agendas and compliance metrics across all
              State Universities and Colleges nationwide.
            </p>

            {/* stat chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.8rem' }}>
              {STATS.map((s) => (
                <div className="stat-chip" key={s.label} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '0.4rem 0.85rem',
                  backdropFilter: 'blur(6px)',
                  cursor: 'default',
                }}>
                  <div style={{ fontFamily: font, fontWeight: 800, fontSize: '0.95rem', color: '#fbbf24', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: font, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${f.icon}`} style={{ fontSize: '0.85rem', color: '#fbbf24' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: font, fontWeight: 700, fontSize: '0.8rem', color: '#fff', lineHeight: 1.3 }}>{f.title}</div>
                    <div style={{ fontFamily: font, fontSize: '0.72rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.45, marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* bottom strip */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '0.8rem 2.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: font, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
            &copy; {new Date().getFullYear()} Commission on Higher Education &mdash; Republic of the Philippines
          </span>
        </div>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div className="login-right" style={{
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        overflow: 'auto',
        position: 'relative',
      }}>

        {/* floating top-right badge */}
        <div style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20, padding: '6px 14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontFamily: font, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>System Active</span>
        </div>

        {/* heading container */}
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420, marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/ched-logo.png" alt="CHED" style={{ height: 48 }} />
          </div>
          <h2 style={{
            fontFamily: font,
            fontWeight: 850,
            fontSize: '1.75rem',
            color: '#0f172a',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.75px',
          }}>
            Welcome Back
          </h2>
          <p style={{
            fontFamily: font,
            color: '#64748b',
            fontSize: '0.88rem',
            marginTop: 6,
            marginBottom: 0,
            lineHeight: 1.5,
          }}>
            Sign in to access your administrative dashboard
          </p>
        </div>

        {/* login card */}
        <div className="login-card animate-fade-in-up" style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 12px 36px rgba(13,27,62,0.06)',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}>

          {/* top accent gradient bar */}
          <div style={{
            height: 5,
            background: 'linear-gradient(90deg, #0c1c44 0%, #2563eb 50%, #fbbf24 100%)',
          }} />

          <div style={{ padding: '2rem 2rem 1.75rem' }}>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '0.7rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <i className="bi bi-exclamation-circle-fill" style={{ color: '#ef4444', fontSize: '0.95rem', flexShrink: 0 }} />
                <span style={{ fontFamily: font, fontSize: '0.82rem', color: '#dc2626', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Username field */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{
                  fontFamily: font, fontSize: '0.75rem', fontWeight: 700,
                  color: '#475569', display: 'block', marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.75px',
                }}>
                  Username
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusUser ? '#2563eb' : '#94a3b8',
                    transition: 'color 0.15s', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <i className="bi bi-person" style={{ fontSize: '1.1rem' }} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    style={{
                      fontFamily: font,
                      width: '100%',
                      height: 48,
                      paddingLeft: 42,
                      paddingRight: 14,
                      borderRadius: 12,
                      border: `1.5px solid ${focusUser ? '#2563eb' : '#e2e8f0'}`,
                      background: focusUser ? '#fff' : '#f8fafc',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusUser(true)}
                    onBlur={() => setFocusUser(false)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  fontFamily: font, fontSize: '0.75rem', fontWeight: 700,
                  color: '#475569', display: 'block', marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.75px',
                }}>
                  Password
                </label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusPass ? '#2563eb' : '#94a3b8',
                    transition: 'color 0.15s', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <i className="bi bi-lock" style={{ fontSize: '1.1rem' }} />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    style={{
                      fontFamily: font,
                      width: '100%',
                      height: 48,
                      paddingLeft: 42,
                      paddingRight: 48,
                      borderRadius: 12,
                      border: `1.5px solid ${focusPass ? '#2563eb' : '#e2e8f0'}`,
                      background: focusPass ? '#fff' : '#f8fafc',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusPass(true)}
                    onBlur={() => setFocusPass(false)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94a3b8',
                      cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
                    }}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.15rem' }} />
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  fontFamily: font,
                  width: '100%', height: 48,
                  background: loading
                    ? '#64748b'
                    : 'linear-gradient(135deg, #0c1c44 0%, #1e3a8a 100%)',
                  color: '#fff',
                  border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: '0.95rem',
                  letterSpacing: '0.2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 18px rgba(12,28,68,0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.95'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm" style={{ width: 16, height: 16 }} /> Signing in...</>
                  : <>Sign In &nbsp;<i className="bi bi-arrow-right-short" style={{ fontSize: '1.25rem' }} /></>
                }
              </button>
            </form>

            {/* ── OR divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontFamily: font, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                fontFamily: font,
                width: '100%', height: 46,
                background: googleLoading ? '#f8fafc' : '#fff',
                color: '#334155',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                fontWeight: 600, fontSize: '0.9rem',
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!googleLoading) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {googleLoading ? (
                <><span className="spinner-border spinner-border-sm" style={{ width: 16, height: 16 }} /> Signing in with Google...</>
              ) : (
                <>
                  {/* Google G logo SVG */}
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

          </div>{/* end card padding */}

          {/* security footer */}
          <div style={{
            background: '#fafaf9',
            borderTop: '1px solid #f5f5f4',
            padding: '0.8rem 1.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: font, fontSize: '0.75rem', color: '#78716c',
            }}>
              <LockIcon /> Secured by
              <strong style={{ color: '#1c1917' }}>CHED e-Agenda Auth</strong>
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d6d3d1', flexShrink: 0 }} />
            <span style={{ fontFamily: font, fontSize: '0.72rem', color: '#b45309', fontWeight: 650 }}>
              Philippines
            </span>
          </div>
        </div>

        <p style={{
          fontFamily: font, color: '#94a3b8', fontSize: '0.75rem',
          marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.5,
        }}>
          Don&apos;t have an account? Contact your system administrator.
        </p>

      </div>
    </div>
  );
}

export default Login;