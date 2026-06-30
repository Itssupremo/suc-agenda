import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

const ROLE_STYLES = {
  board_member: { bg: 'rgba(124,58,237,0.09)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)', icon: 'bi-people-fill', label: 'Board Member' }
};

function SucUserManagement({ user: currentUser }) {
  const [users, setUsers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullname: '', email: '', username: '', password: ''
  });
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      // Only keep board_members (extra check, backend also filters this)
      setUsers(res.data.filter(u => u.role === 'board_member'));
    } catch {
      showAlert('danger', 'Failed to load board members');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ fullname: '', email: '', username: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      fullname: user.fullname,
      email: user.email || '',
      username: user.username,
      password: '',
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
          role: 'board_member',
          sucAbbreviation: currentUser.sucAbbreviation,
        };
        if (form.password) data.password = form.password;
        await updateUser(editing._id, data);
        showAlert('success', 'Board Member updated successfully');
      } else {
        await createUser({
          ...form,
          role: 'board_member',
          sucAbbreviation: currentUser.sucAbbreviation,
        });
        showAlert('success', 'Board Member created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete board member "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      showAlert('success', 'Board Member deleted');
      fetchUsers();
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.fullname.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-section-title mb-0">
            <i className="bi bi-people me-2" style={{ color: 'var(--gold)' }} />
            Board Member Management
          </h2>
          <p className="page-section-sub mb-0">{users.length} board member{users.length !== 1 ? 's' : ''} registered for {currentUser?.sucAbbreviation || 'SUC'}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-user-btn">
          <i className="bi bi-person-plus" />
          Add Board Member
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} mb-3`} role="alert">
          <i className={`bi bi-${alert.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />
          {alert.msg}
        </div>
      )}

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
                placeholder="Search name, username, email…"
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
                  <th>SUC</th>
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
                        <span className="empty-state-text">No board members found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => {
                    const rm = ROLE_STYLES.board_member;
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
                            {u.sucAbbreviation ? `${u.sucAbbreviation} — Board Member` : 'Board Member'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {u.sucAbbreviation || '—'}
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
      {showModal && createPortal(
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(10,20,50,0.55)', backdropFilter: 'blur(3px)', zIndex: 1055 }} id="user-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editing ? 'bi-pencil-square' : 'bi-person-plus-fill'} me-2`} />
                  {editing ? 'Edit Board Member' : 'Create Board Member'}
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
        </div>,
        document.body
      )}
    </div>
  );
}

export default SucUserManagement;
