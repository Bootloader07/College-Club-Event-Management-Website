import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import '../styles/navbar.css';

function getAuthState() {
  const hasAdmin = Boolean(localStorage.getItem('adminToken'));
  if (hasAdmin) {
    return { isAdmin: true, isStudent: false, studentName: '' };
  }
  const hasStudent = Boolean(localStorage.getItem('studentToken'));
  if (hasStudent) {
    return {
      isAdmin: false,
      isStudent: true,
      studentName: localStorage.getItem('studentName') || 'Student',
    };
  }
  return { isAdmin: false, isStudent: false, studentName: '' };
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuth] = useState(getAuthState);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshAuth = useCallback(() => {
    setAuth(getAuthState());
  }, []);

  useEffect(() => {
    refreshAuth();
    setIsOpen(false);
  }, [location, refreshAuth]);

  useEffect(() => {
    window.addEventListener('authChange', refreshAuth);
    return () => window.removeEventListener('authChange', refreshAuth);
  }, [refreshAuth]);

  function handleAdminLogout() {
    localStorage.removeItem('adminToken');
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  }

  function handleStudentLogout() {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentName');
    localStorage.removeItem('studentProfile');
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  }

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          ABES<span> Wave</span>
        </Link>

        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setIsOpen(p => !p)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="navbar-hamburger-line" />
          <span className="navbar-hamburger-line" />
          <span className="navbar-hamburger-line" />
        </button>

        <ul className={`navbar-links${isOpen ? ' open' : ''}`}>
          {/* Primary nav links */}
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              Events
            </NavLink>
          </li>

          {/* ── State 3: Admin logged in (adminToken priority) ── */}
          {auth.isAdmin ? (
            <>
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `navbar-link navbar-admin-link${isActive ? ' active' : ''}`
                  }
                >
                  Admin Dashboard
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  className="navbar-logout-btn"
                  onClick={handleAdminLogout}
                >
                  Logout
                </button>
              </li>
            </>
          ) : auth.isStudent ? (
            /* ── State 2: Student logged in (only studentToken) ── */
            <>
              <li>
                <span className="navbar-greeting">Hi, {auth.studentName}</span>
              </li>
              <li>
                <NavLink
                  to="/my-registrations"
                  className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                >
                  My Registrations
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  className="navbar-logout-btn"
                  onClick={handleStudentLogout}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            /* ── State 1: No one logged in ── */
            <li>
              <Link to="/login" className="navbar-signin-btn btn-outline">
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
