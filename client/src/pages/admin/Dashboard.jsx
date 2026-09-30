import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import adminFetch from '../../api/admin';
import '../../styles/admin.css';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function isWithinLastWeek(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

const STAT_CARDS = [
  { key: 'total_events',         label: 'Total Events',       icon: '📅' },
  { key: 'total_registrations',  label: 'Total Registrations', icon: '👥' },
  { key: 'upcoming_events',      label: 'Upcoming Events',    icon: '🗓️' },
  { key: '_new_this_week',       label: 'New This Week',      icon: '✨' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then(data => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const newThisWeek = stats
    ? stats.recent_registrations.filter(r => isWithinLastWeek(r.registered_at)).length
    : 0;

  function getStatValue(key) {
    if (!stats) return '—';
    if (key === '_new_this_week') return newThisWeek;
    return stats[key] ?? 0;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Welcome back — here's what's happening at ABES Wave.</p>
        </div>

        {/* Stat Cards */}
        <div className="admin-stats-row">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-stat-skeleton" />
              ))
            : STAT_CARDS.map(({ key, label, icon }) => (
                <div key={key} className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-icon">{icon}</span>
                    <span className="admin-stat-label">{label}</span>
                  </div>
                  <div className="admin-stat-value">{getStatValue(key)}</div>
                  <div className="admin-stat-accent-bar" />
                </div>
              ))}
        </div>

        {/* Recent Registrations */}
        <div className="admin-section-heading">Recent Registrations</div>
        <div className="admin-table-card">
          <div className="admin-table-card-header">
            <span className="admin-table-card-title">Last 5 sign-ups</span>
            <Link to="/admin/registrations" className="admin-btn-primary">
              View All
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="admin-skeleton-row">
                        {[80, 120, 100, 90].map((w, j) => (
                          <td key={j}>
                            <span
                              className="admin-skeleton-cell"
                              style={{ width: w }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  : stats?.recent_registrations.length === 0
                    ? (
                        <tr>
                          <td colSpan={4} className="admin-table-empty">
                            No registrations yet.
                          </td>
                        </tr>
                      )
                    : stats?.recent_registrations.map((r, i) => (
                        <tr key={i}>
                          <td className="admin-table-primary">{r.name}</td>
                          <td className="admin-table-secondary">{r.email}</td>
                          <td>{r.event_title}</td>
                          <td className="admin-table-secondary">
                            {formatDateTime(r.registered_at)}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
