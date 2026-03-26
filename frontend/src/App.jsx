import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import UserManagement from './pages/UserManagement';
import RegularBoardMeeting from './pages/RegularBoardMeeting';
import MinutesOfMeeting from './pages/MinutesOfMeeting';
import SpecialBoardMeeting from './pages/SpecialBoardMeeting';
import MyAccount from './pages/MyAccount';
import { getMe } from './services/api';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/analytics': 'Analytics',
  '/admin/regular-board': 'Regular Board Meeting',
  '/admin/minutes': 'Minutes of the Meeting',
  '/admin/special-board': 'Special Board Meeting',
  '/dashboard': 'Dashboard',
  '/my-account': 'My Account',
};

function AuthenticatedLayout({ user, onLogout, sidebarOpen, setSidebarOpen, children }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'e-Agenda System';
  const toggle = () => setSidebarOpen((o) => !o);

  return (
    <div className="app-authenticated">
      <Sidebar user={user} onLogout={onLogout} open={sidebarOpen} onToggle={toggle} />
      <div className={`app-main-area${sidebarOpen ? ' sidebar-open' : ''}`}>
        {/* Top bar */}
        <div className="app-topbar">
          <button className="sidebar-toggle d-lg-none me-2" onClick={toggle} type="button" title="Toggle menu">
            <i className="bi bi-list" />
          </button>
          <span className="app-topbar-title">{title}</span>
          <div className="app-topbar-user d-none d-md-flex">
            <i className="bi bi-person-circle" />
            <span>{user.fullname}</span>
          </div>
        </div>
        <main className="app-content flex-grow-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = () => {
    getMe().then((res) => setUser(res.data.user)).catch(() => {});
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <AuthenticatedLayout
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        >
          <Routes>
            {/* My Account — all roles */}
            <Route path="/my-account" element={<MyAccount user={user} onUserUpdate={refreshUser} />} />
            {/* SuperAdmin + Admin */}
            <Route
              path="/admin"
              element={['superadmin', 'admin'].includes(user.role) ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/admin/users"
              element={['superadmin', 'admin'].includes(user.role) ? <UserManagement user={user} /> : <Navigate to="/dashboard" />}
            />
            {/* SuperAdmin + Admin + User (SUC) */}
            <Route
              path="/admin/regular-board"
              element={<RegularBoardMeeting user={user} />}
            />
            <Route
              path="/admin/minutes"
              element={<MinutesOfMeeting user={user} />}
            />
            <Route
              path="/admin/special-board"
              element={<SpecialBoardMeeting user={user} />}
            />
            {/* SUC user */}
            <Route path="/dashboard" element={<UserDashboard user={user} />} />
            <Route path="*" element={
              <Navigate to={
                user.role === 'superadmin' ? '/admin' :
                user.role === 'admin'      ? '/admin' :
                                             '/dashboard'
              } />
            } />
          </Routes>
        </AuthenticatedLayout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
