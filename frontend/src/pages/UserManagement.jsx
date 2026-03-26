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

const ROLE_META = {
  superadmin: { badge: 'bg-danger',   icon: 'bi-shield-lock-fill',  label: 'Super Admin' },
  admin:      { badge: 'bg-primary',  icon: 'bi-shield-check',      label: 'Commissioner' },
  chairperson:{ badge: 'bg-purple',   icon: 'bi-shield-check',      label: 'Chairperson' },
  user:       { badge: 'bg-success',  icon: 'bi-person',            label: 'SUC User' },
};

function getRoleMeta(u) {
  if (u.role === 'admin' && u.occCode === 'OCSCA') return { ...ROLE_META.admin, label: 'Chairperson' };
  return ROLE_META[u.role] || ROLE_META.user;
}

function UserManagement({ user: currentUser }) {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullname: '', email: '', username: '', password: '', role: 'user', occCode: '', sucAbbreviation: '' });
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
    setTimeout(() => setAlert(null), 3000);
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">
          <i className="bi bi-people me-2"></i>User Management
        </h3>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-person-plus me-1"></i>Add User
        </button>
      </div>

      {alert && <div className={`alert alert-${alert.type} alert-dismissible fade show`}>{alert.msg}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="p-3 pb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ maxWidth: 300 }}
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle mb-0">
              <thead className="table-primary">
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>OCC / SUC</th>
                  <th>Created</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted">No users found</td></tr>
                ) : (
                  filtered.map((u, idx) => {
                    const rm = getRoleMeta(u);
                    return (
                    <tr key={u._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <i className={`bi ${rm.icon} me-1`}></i>
                        {u.fullname}
                      </td>
                      <td className="small text-muted">{u.email || '—'}</td>
                      <td><code>{u.username}</code></td>
                      <td>
                        <span className={`badge ${rm.badge}`}>{rm.label}</span>
                      </td>
                      <td className="small">
                        {u.role === 'admin' ? (u.occCode || '—') : u.role === 'user' ? (u.sucAbbreviation || '—') : '—'}
                      </td>
                      <td className="small text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-warning" title="Edit" onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(u._id, u.username)}>
                            <i className="bi bi-trash"></i>
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'var(--ched-navy)', color: '#fff' }}>
                <h5 className="modal-title">
                  <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
                  {editing ? 'Edit User' : 'Create User'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input type="text" className="form-control" value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="user@example.com" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Username</label>
                    <input type="text" className="form-control" value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Password {editing && <span className="text-muted fw-normal">(leave blank to keep current)</span>}
                    </label>
                    <input type="password" className="form-control" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      {...(!editing && { required: true })}
                      minLength={4} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Role</label>
                      <select className="form-select" value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                        {isSuperAdmin && <option value="admin">Admin (Commissioner)</option>}
                        <option value="user">User (SUC)</option>
                      </select>
                    </div>
                    {form.role === 'admin' && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">OCC Code</label>
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
                        <label className="form-label fw-semibold">SUC Abbreviation</label>
                        <input type="text" className="form-control" value={form.sucAbbreviation}
                          onChange={(e) => setForm({ ...form, sucAbbreviation: e.target.value })}
                          placeholder="e.g. CLSU" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className={`bi ${editing ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
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
