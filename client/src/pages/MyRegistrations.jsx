import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRegistrations } from '../api/students';
import '../styles/global.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hour12 = hr % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function formatRegisteredAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `Registered on ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function RegistrationCard({ reg }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <article className="reg-card">
      <div className="reg-card-image-wrap">
        {reg.image_url && !imgErr ? (
          <img
            src={reg.image_url}
            alt={reg.event_title}
            className="reg-card-image"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="reg-card-image-placeholder">📅</div>
        )}
        <span className={`badge badge-${reg.category?.toLowerCase()}`}>
          {reg.category}
        </span>
      </div>

      <div className="reg-card-body">
        <h3 className="reg-card-title">{reg.event_title}</h3>

        <div className="reg-card-meta">
          <span className="reg-card-meta-item">📅 {formatDate(reg.date)}</span>
          <span className="reg-card-meta-item">🕐 {formatTime(reg.time)}</span>
          <span className="reg-card-meta-item">📍 {reg.venue}</span>
        </div>

        <div className="reg-card-footer">
          <span className="reg-status-badge">✓ Registered</span>
          <Link to={`/events/${reg.event_id}`} className="reg-view-link">
            View Event →
          </Link>
        </div>

        <p className="reg-registered-at">{formatRegisteredAt(reg.registered_at)}</p>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton-pill" />
        <div className="skeleton-title" />
        <div className="skeleton-text" />
        <div className="skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('studentToken'))
  );
  const studentName = localStorage.getItem('studentName') || 'Student';

  useEffect(() => {
    function handleAuthChange() {
      const loggedIn = Boolean(localStorage.getItem('studentToken'));
      setIsLoggedIn(loggedIn);
    }
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    getMyRegistrations()
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <main className="myreg-page">
        <div className="container">
          <div className="myreg-not-logged-in">
            <div className="myreg-lock-icon">🔒</div>
            <h1 className="myreg-not-logged-title">My Registrations</h1>
            <p className="myreg-not-logged-subtitle">
              Sign in to view all events you've registered for.
            </p>
            <Link to="/login" className="myreg-signin-btn">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  return (
    <main className="myreg-page">
      <div className="container">
        <div className="myreg-header">
          <h1 className="myreg-title">My Registrations</h1>
          <p className="myreg-subtitle">
            Hi {studentName}, here are all the events you've registered for.
          </p>
        </div>

        {loading ? (
          <div className="events-grid">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : registrations.length === 0 ? (
          <div className="myreg-empty">
            <p className="myreg-empty-text">You haven't registered for any events yet.</p>
            <Link to="/events" className="myreg-explore-link">
              Explore Events →
            </Link>
          </div>
        ) : (
          <div className="events-grid">
            {registrations.map((reg) => (
              <RegistrationCard key={reg.id} reg={reg} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
