import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import '../../styles/admin.css';

const NAV_LINKS = [
  { to: '/admin', icon: '🏠', label: 'Dashboard' },
  { to: '/admin/events', icon: '📅', label: 'Manage Events' },
  { to: '/admin/registrations', icon: '👥', label: 'Registrations' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    navigate('/');
  }

  function closeSidebar() {
    setOpen(false);
  }

  function isActive(to) {
    if (to === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(to);
  }

  const sidebarContent = (
    <>
      <div className="admin-sidebar-logo">
        <span className="admin-sidebar-brand">
          ABES<span> Wave</span>
        </span>
        <span className="admin-sidebar-badge">ADMIN</span>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {NAV_LINKS.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`admin-sidebar-link${isActive(to) ? ' active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="admin-sidebar-link-icon">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-logout">
        <button
          className="admin-sidebar-link"
          onClick={handleLogout}
          type="button"
        >
          <span className="admin-sidebar-link-icon">🚪</span>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`admin-sidebar${open ? ' open' : ''}`} aria-label="Sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="admin-mobile-bar" aria-hidden="false">
        <span className="admin-mobile-brand">ABES<span> Wave</span></span>
        <button
          className="admin-mobile-hamburger"
          onClick={() => setOpen(prev => !prev)}
          aria-label="Toggle navigation"
          type="button"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`admin-sidebar-overlay${open ? ' open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
    </>
  );
}
