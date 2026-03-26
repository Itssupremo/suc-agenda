import { useState, useEffect } from 'react';
import { updateSelf } from '../services/api';

const ROLE_LABEL = { superadmin: 'Super Admin', admin: 'Commissioner', user: 'SUC User' };
const ROLE_BADGE  = { superadmin: 'bg-danger', admin: 'bg-primary', user: 'bg-success' };

function getRoleLabel(user) {
  if (user?.role === 'admin' && user?.occCode === 'OCSCA') return 'Chairperson';
  return ROLE_LABEL[user?.role] || user?.role;
}

const OCC_OFFICIALS = {
  OCSCA: 'Chairperson Shirley C. Agrupis',
  OCDRA: 'Commissioner Desiderio R. Apag III',
  OCRPA: 'Commissioner Ricmar P. Aquino',
  OCMQM: 'Commissioner Myrna Q. Mallari',
  OCMAO: 'Commissioner Michelle Aguilar-Ong',
};

function MyAccount({ user, onUserUpdate }) {
  const [editing, setEditing]           = useState(false);
  const [alert,   setAlert]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [form,    setForm]              = useState({
    fullname: '', email: '', username: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setForm({ fullname: user.fullname || '', email: user.email || '', username: user.username || '', password: '', confirmPassword: '' });
    }
  }, [user]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      showAlert('danger', 'Passwords do not match');
      return;
    }
    if (form.password && form.password.length < 4) {
      showAlert('danger', 'Password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const data = { email: form.email, username: form.username };
      if (form.password) data.password = form.password;
      await updateSelf(data);
      showAlert('success', 'Account updated successfully!');
      setEditing(false);
      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({ fullname: user.fullname || '', email: user.email || '', username: user.username || '', password: '', confirmPassword: '' });
    setAlert(null);
  };

  const roleBadge  = ROLE_BADGE[user?.role]  || 'bg-secondary';
  const roleLabel  = getRoleLabel(user);
  const displayName = user?.role === 'admin' && user?.occCode
    ? (OCC_OFFICIALS[user.occCode] || user.occCode)
    : user?.fullname;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7 col-md-9">

        {alert && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center`}>
            <i className={`bi ${alert.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
            {alert.msg}
            <button type="button" className="btn-close ms-auto" onClick={() => setAlert(null)}></button>
          </div>
        )}

        <div className="card shadow-sm">
          {/* Card Header */}
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ background: 'var(--ched-navy)', color: '#fff' }}
          >
            <span className="fw-semibold fs-6">
              <i className="bi bi-person-circle me-2"></i>My Account
            </span>
            {!editing && (
              <button className="btn btn-sm btn-warning" onClick={() => setEditing(true)}>
                <i className="bi bi-pencil-square me-1"></i>Edit Profile
              </button>
            )}
          </div>

          {!editing ? (
            /* ── VIEW MODE ─────────────────────────────────────────────── */
            <div className="card-body">
              <div className="d-flex align-items-center mb-4 gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 68, height: 68, flexShrink: 0,
                    background: 'var(--ched-gold)',
                    fontSize: '2rem', color: '#fff',
                  }}
                >
                  <i className="bi bi-person-fill"></i>
                </div>
                <div>
                  <h5 className="mb-1 fw-bold">{user?.fullname}</h5>
                  {user?.role === 'admin' && user?.occCode && (
                    <div className="small text-muted mb-1">{displayName}</div>
                  )}
                  <span className={`badge ${roleBadge}`}>{roleLabel}</span>
                  {user?.sucAbbreviation && (
                    <span className="badge bg-secondary ms-1">{user.sucAbbreviation}</span>
                  )}
                </div>
              </div>

              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted fw-semibold" style={{ width: 150 }}>
                      <i className="bi bi-person me-1"></i>Username
                    </td>
                    <td><code>{user?.username}</code></td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">
                      <i className="bi bi-envelope me-1"></i>Email
                    </td>
                    <td>
                      {user?.email
                        ? user.email
                        : <span className="text-muted fst-italic">Not set</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted fw-semibold">
                      <i className="bi bi-shield me-1"></i>Role
                    </td>
                    <td>{roleLabel}</td>
                  </tr>
                  {user?.sucAbbreviation && (
                    <tr>
                      <td className="text-muted fw-semibold">
                        <i className="bi bi-building me-1"></i>Institution
                      </td>
                      <td>{user.sucAbbreviation}</td>
                    </tr>
                  )}
                  {user?.occCode && (
                    <tr>
                      <td className="text-muted fw-semibold">
                        <i className="bi bi-award me-1"></i>Office
                      </td>
                      <td>{user.occCode}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── EDIT MODE ─────────────────────────────────────────────── */
            <form onSubmit={handleSave}>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={form.fullname}
                    readOnly
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>

                <hr />
                <p className="text-muted small mb-2">
                  <i className="bi bi-lock me-1"></i>
                  Change Password{' '}
                  <span className="fst-italic">(leave blank to keep current password)</span>
                </p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="New password"
                      minLength={4}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                    : <><i className="bi bi-check-lg me-1"></i>Save Changes</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
