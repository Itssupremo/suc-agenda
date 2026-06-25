import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

const OCC_OPTIONS = [
  { code: '', label: 'None' },
  { code: 'OCSCA', label: 'OCSCA — Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', label: 'OCDRA — Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', label: 'OCRPA — Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', label: 'OCMQM — Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', label: 'OCMAO — Commissioner Michelle Aguilar-Ong' },
];

const ROLE_STYLES = {
  superadmin:  { bg: 'rgba(220,38,38,0.09)',   color: '#dc2626', border: 'rgba(220,38,38,0.2)',   icon: 'bi-shield-lock-fill',  label: 'Super Admin' },
  admin:       { bg: 'rgba(13,27,62,0.08)',     color: '#0d1b3e', border: 'rgba(13,27,62,0.2)',    icon: 'bi-shield-check',      label: 'Commissioner' },
  chairperson: { bg: 'rgba(124,58,237,0.09)',   color: '#7c3aed', border: 'rgba(124,58,237,0.2)',  icon: 'bi-shield-check',      label: 'Chairperson' },
  user:        { bg: 'rgba(5,150,105,0.09)',    color: '#059669', border: 'rgba(5,150,105,0.2)',   icon: 'bi-person',            label: 'SUC User' },
};

function getRoleMeta(u) {
  if (u.role === 'admin' && u.occCode === 'OCSCA') {
    return { ...ROLE_STYLES.admin, label: 'Chairperson', bg: 'rgba(124,58,237,0.09)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)', icon: 'bi-shield-check' };
  }
  return ROLE_STYLES[u.role] || ROLE_STYLES.user;
}

function UserManagement({ user: currentUser }) {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullname: '', email: '', username: '', password: '',
    role: 'user', occCode: '', sucAbbreviation: ''
  });
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      showAlert('danger', 'Failed to load users');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ fullname: '', email: '', username: '', password: '', role: 'user', occCode: '', sucAbbreviation: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      fullname: user.fullname,
      email: user.email || '',
      username: user.username,
      password: '',
      role: user.role,
      occCode: user.occCode || '',
      sucAbbreviation: user.sucAbbreviation || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const data = {
          fullname: form.fullname,
          email: form.email,
          username: form.username,
          role: form.role,
          occCode: form.role === 'admin' ? form.occCode : '',
          sucAbbreviation: form.role === 'user' ? form.sucAbbreviation : '',
        };
        if (form.password) data.password = form.password;
        await updateUser(editing._id, data);
        showAlert('success', 'User updated successfully');
      } else {
        await createUser({
          ...form,
          occCode: form.role === 'admin' ? form.occCode : '',
          sucAbbreviation: form.role === 'user' ? form.sucAbbreviation : '',
        });
        showAlert('success', 'User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      showAlert('success', 'User deleted');
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.fullname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) || (u.occCode || '').toLowerCase().includes(q) ||
      (u.sucAbbreviation || '').toLowerCase().includes(q);
  });

  // Role counts for stat row
  const roleCounts = {
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    user: users.filter(u => u.role === 'user').length,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-section-title mb-0">
            <i className="bi bi-people me-2" style={{ color: 'var(--gold)' }} />
            User Management
          </h2>
          <p className="page-section-sub mb-0">{users.length} user{users.length !== 1 ? 's' : ''} registered in the system</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-user-btn">
          <i className="bi bi-person-plus" />
          Add User
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} mb-3`} role="alert">
          <i className={`bi bi-${alert.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {alert.msg}
        </div>
      )}

      {/* Role stat pills */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {[
          { role: 'superadmin', label: 'Super Admins', icon: 'bi-shield-lock-fill' },
          { role: 'admin',      label: 'Commissioners',  icon: 'bi-shield-check' },
          { role: 'user',       label: 'SUC Users',      icon: 'bi-person' },
        ].map(({ role, label, icon }) => {
          const s = ROLE_STYLES[role];
          return (
            <div key={role} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 'var(--r-pill)', padding: '7px 16px',
            }}>
              <i className={`bi ${icon}`} style={{ color: s.color, fontSize: '0.9rem' }} />
              <span style={{ fontWeight: 700, color: s.color, fontSize: '0.85rem' }}>{roleCounts[role]}</span>
              <span style={{ color: s.color, fontSize: '0.8rem', opacity: 0.8 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-body p-0">
          {/* Search bar */}
          <div className="p-3 pb-0">
            <div className="input-group" style={{ maxWidth: 360 }}>
              <span className="input-group-text" style={{ borderRadius: 'var(--r-md) 0 0 var(--r-md)' }}>
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: '0 var(--r-md) var(--r-md) 0', borderLeft: 'none' }}
                placeholder="Search name, username, email, OCC…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-users"
              />
            </div>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-striped table-hover align-middle mb-0" id="users-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>OCC / SUC</th>
                  <th>Joined</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <i className="bi bi-person-x empty-state-icon" />
                        <span className="empty-state-text">No users found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => {
                    const rm = getRoleMeta(u);
                    return (
                      <tr key={u._id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: rm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <i className={`bi ${rm.icon}`} style={{ color: rm.color, fontSize: '0.9rem' }} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.fullname}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{u.email || '—'}</td>
                        <td>
                          <code style={{ fontSize: '0.82rem' }}>{u.username}</code>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: rm.bg, color: rm.color,
                            border: `1px solid ${rm.border}`,
                            padding: '4px 11px', borderRadius: 'var(--r-pill)',
                            fontSize: '0.73rem', fontWeight: 700,
                          }}>
                            {rm.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {u.role === 'admin' ? (u.occCode || '—') : u.role === 'user' ? (u.sucAbbreviation || '—') : '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-warning" title="Edit" onClick={() => openEdit(u)} id={`edit-user-${u._id}`}>
                              <i className="bi bi-pencil-square" />
                            </button>
                            <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(u._id, u.username)} id={`delete-user-${u._id}`}>
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(10,20,50,0.55)', backdropFilter: 'blur(3px)' }} id="user-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`} />
                  {editing ? 'Edit User' : 'Create New User'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })} required
                      placeholder="e.g. Juan Dela Cruz" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="user@example.com" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input type="text" className="form-control" value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })} required
                      placeholder="Enter username" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Password {editing && <span className="text-muted fw-normal">(leave blank to keep current)</span>}
                    </label>
                    <input type="password" className="form-control" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      {...(!editing && { required: true })}
                      minLength={4}
                      placeholder={editing ? '••••••••' : 'Min. 4 characters'} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                        {isSuperAdmin && <option value="admin">Admin (Commissioner)</option>}
                        <option value="user">User (SUC)</option>
                      </select>
                    </div>
                    {form.role === 'admin' && (
                      <div className="col-md-6">
                        <label className="form-label">OCC Code</label>
                        <select className="form-select" value={form.occCode}
                          onChange={(e) => setForm({ ...form, occCode: e.target.value })}>
                          {OCC_OPTIONS.map((o) => (
                            <option key={o.code} value={o.code}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.role === 'user' && (
                      <div className="col-md-6">
                        <label className="form-label">SUC Abbreviation</label>
                        <input type="text" className="form-control" value={form.sucAbbreviation}
                          onChange={(e) => setForm({ ...form, sucAbbreviation: e.target.value })}
                          placeholder="e.g. CLSU" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    <i className="bi bi-x-lg" /> Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" id="save-user-btn">
                    <i className={`bi ${editing ? 'bi-check-lg' : 'bi-plus-lg'}`} />
                    {editing ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
