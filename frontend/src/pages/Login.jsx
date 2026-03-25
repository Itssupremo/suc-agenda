import { useState } from 'react';
import { login as loginApi } from '../services/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="login-card" style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4">
          <img src="/ched-logo.png" alt="CHED" style={{ height: 80 }} />
          <h4 className="mt-3 fw-bold" style={{ color: 'var(--ched-navy)' }}>Welcome Back</h4>
          <p className="text-muted small">Sign in to e-Agenda System</p>
        </div>

        <div className="card shadow" style={{ border: 'none', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--ched-accent), var(--ched-navy), var(--ched-gold))' }}></div>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">
                  <i className="bi bi-person me-1"></i>Username
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  style={{ borderRadius: 8, fontSize: '0.95rem' }}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold small">
                  <i className="bi bi-lock me-1"></i>Password
                </label>
                <div className="input-group">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control form-control-lg"
                    style={{ borderRadius: '8px 0 0 8px', fontSize: '0.95rem' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: '0 8px 8px 0' }}
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn w-100 fw-bold"
                style={{
                  background: 'var(--ched-navy)',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '12px',
                  fontSize: '0.95rem',
                  letterSpacing: 0.5,
                  transition: 'all 0.2s',
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-muted small mt-3">
          <i className="bi bi-shield-lock me-1"></i>
          Secured by CHED Information Systems
        </p>
      </div>
    </div>
  );
}

export default Login;
