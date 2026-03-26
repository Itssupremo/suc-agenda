import { Link, useLocation } from 'react-router-dom';

// ── Navigation definitions per role ─────────────────────────────────────────
const superAdminNav = [
  {
    section: 'OVERVIEW',
    items: [{ label: 'Dashboard', icon: 'bi-house-door', path: '/admin' }],
  },
  {
    section: 'e-AGENDA',
    items: [
      { label: 'Regular Board Meeting', icon: 'bi-calendar-event',  path: '/admin/regular-board' },
      { label: 'Minutes of the Meeting', icon: 'bi-file-text',       path: '/admin/minutes' },
      { label: 'Special Board Meeting', icon: 'bi-calendar-check',  path: '/admin/special-board' },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [{ label: 'Analytics', icon: 'bi-bar-chart-line', path: '/admin/analytics' }],
  },
  {
    section: 'MANAGEMENT',
    items: [{ label: 'User Management', icon: 'bi-people', path: '/admin/users' }],
  },
];

const adminNav = [
  {
    section: 'OVERVIEW',
    items: [{ label: 'Dashboard', icon: 'bi-house-door', path: '/admin' }],
  },
  {
    section: 'e-AGENDA',
    items: [
      { label: 'Regular Board Meeting', icon: 'bi-calendar-event',  path: '/admin/regular-board' },
      { label: 'Minutes of the Meeting', icon: 'bi-file-text',       path: '/admin/minutes' },
      { label: 'Special Board Meeting', icon: 'bi-calendar-check',  path: '/admin/special-board' },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [{ label: 'Analytics', icon: 'bi-bar-chart-line', path: '/admin/analytics' }],
  },
  {
    section: 'MANAGEMENT',
    items: [{ label: 'User Management', icon: 'bi-people', path: '/admin/users' }],
  },
];

const userNav = [
  {
    section: 'OVERVIEW',
    items: [{ label: 'Dashboard', icon: 'bi-house-door', path: '/dashboard' }],
  },
  {
    section: 'e-AGENDA',
    items: [
      { label: 'Regular Board Meeting', icon: 'bi-calendar-event',  path: '/admin/regular-board' },
      { label: 'Minutes of the Meeting', icon: 'bi-file-text',       path: '/admin/minutes' },
      { label: 'Special Board Meeting', icon: 'bi-calendar-check',  path: '/admin/special-board' },
    ],
  },
];

const NAV_BY_ROLE = { superadmin: superAdminNav, admin: adminNav, user: userNav };

const ROLE_BADGE = {
  superadmin: { label: 'Super Admin', color: '#e74c3c' },
  admin:      { label: 'Commissioner', color: '#2980b9' },
  user:       { label: 'SUC',          color: '#27ae60' },
};

function getRoleBadge(user) {
  if (user?.role === 'admin' && user?.occCode === 'OCSCA') {
    return { label: 'Chairperson', color: '#8e44ad' };
  }
  return ROLE_BADGE[user?.role] || ROLE_BADGE.user;
}

function Sidebar({ user, onLogout, open, onToggle }) {
  const location   = useLocation();
  const navSections = NAV_BY_ROLE[user?.role] || userNav;
  const badge       = getRoleBadge(user);

  return (
    <>
      {open && <div className="sidebar-overlay d-lg-none" onClick={onToggle} />}

      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        {/* Brand / Header */}
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={onToggle} type="button" title="Toggle menu">
            <i className="bi bi-list" />
          </button>
          <div className="sidebar-brand">
            <img src="/ched-logo.png" alt="CHED" className="sidebar-logo" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">e-Agenda</span>
              <span className="sidebar-brand-sub">CHED System</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.section} className="sidebar-section">
              <span className="sidebar-section-label">{section.section}</span>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-item${location.pathname === item.path ? ' active' : ''}`}
                  title={item.label}
                >
                  <i className={`bi ${item.icon} sidebar-nav-icon`} />
                  <span className="sidebar-nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: role badge + user info + logout */}
        <div className="sidebar-footer">
          <Link
            to="/my-account"
            className={`sidebar-user-row sidebar-user-row-link${location.pathname === '/my-account' ? ' active' : ''}`}
            title="My Account"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <i className="bi bi-person-circle sidebar-nav-icon" />
            <div className="sidebar-nav-label" style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.fullname}
              </div>
              <span
                style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.6px',
                  background: badge.color, color: '#fff',
                  padding: '1px 7px', borderRadius: 10, display: 'inline-block', marginTop: 2,
                }}
              >
                {badge.label}
              </span>
            </div>
            <i className="bi bi-chevron-right sidebar-nav-icon" style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: 'auto', flexShrink: 0 }} />
          </Link>
          <button className="sidebar-logout-btn" onClick={onLogout} type="button">
            <i className="bi bi-box-arrow-right sidebar-nav-icon" />
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
