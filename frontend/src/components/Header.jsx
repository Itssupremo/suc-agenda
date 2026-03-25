import { Link, useLocation } from 'react-router-dom';

function Header({ user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="ocdra-header">
      <div className="container-fluid px-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <Link to="/" className="header-brand d-flex align-items-center text-decoration-none">
            <img src="/ched-logo.png" alt="CHED" className="header-logo" />
          </Link>
          <nav className="d-none d-md-flex align-items-center gap-1">
            {!user && <Link className={isActive('/')} to="/">HOME</Link>}
            {user && user.role === 'admin' && (
              <>
                <Link className={isActive('/admin')} to="/admin">e-AGENDA</Link>
                <Link className={isActive('/admin/users')} to="/admin/users">USER MANAGEMENT</Link>
              </>
            )}
            {user && user.role === 'user' && (
              <Link className={isActive('/dashboard')} to="/dashboard">DASHBOARD</Link>
            )}
          </nav>
        </div>

        <div className="d-flex align-items-center gap-2">
          {user ? (
            <>
              <span className="header-user d-none d-lg-inline">
                <i className="bi bi-person-circle me-1"></i>{user.fullname}
              </span>
              <button className="btn btn-sm btn-header-logout" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-sm btn-header-login" to="/login">Login</Link>
          )}
          {/* Mobile toggle */}
          <button
            className="btn btn-sm d-md-none btn-header-toggle"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mobileNav"
          >
            <i className="bi bi-list fs-5"></i>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="collapse container" id="mobileNav">
        <div className="mobile-nav pb-2">
          {!user && <Link className="mobile-nav-link" to="/">HOME</Link>}
          {user && user.role === 'admin' && (
            <>
              <Link className="mobile-nav-link" to="/admin">e-AGENDA</Link>
              <Link className="mobile-nav-link" to="/admin/users">USER MANAGEMENT</Link>
            </>
          )}
          {user && user.role === 'user' && (
            <Link className="mobile-nav-link" to="/dashboard">DASHBOARD</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
