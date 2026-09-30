import { useEffect, useState, useRef, useCallback } from 'react';
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

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // Fetch events list for the dropdown
  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data : (data.events ?? [])))
      .catch(() => {});
  }, []);

  const fetchRegistrations = useCallback(async (eventId, searchTerm) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (eventId) params.set('event_id', eventId);
    if (searchTerm) params.set('search', searchTerm);

    try {
      const data = await adminFetch(`/api/admin/registrations?${params.toString()}`);
      setRegistrations(Array.isArray(data) ? data : []);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and when event filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchRegistrations(selectedEvent, search);
  }, [selectedEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search (300ms)
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRegistrations(selectedEvent, val);
    }, 300);
  }

  const selectedEventName = events.find(ev => String(ev.id) === selectedEvent)?.title || null;

  let countLine = '';
  if (!loading) {
    if (registrations.length === 0) {
      countLine = selectedEventName
        ? `No registrations for "${selectedEventName}"`
        : 'No registrations found';
    } else {
      countLine = selectedEventName
        ? `Showing ${registrations.length} registration${registrations.length !== 1 ? 's' : ''} for "${selectedEventName}"`
        : `Showing ${registrations.length} registration${registrations.length !== 1 ? 's' : ''}`;
    }
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Registrations</h1>
          <p className="admin-page-subtitle">Browse and search all student registrations.</p>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <select
            className="admin-filter-select"
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            aria-label="Filter by event"
          >
            <option value="">All Events</option>
            {events.map(ev => (
              <option key={ev.id} value={String(ev.id)}>{ev.title}</option>
            ))}
          </select>

          <input
            type="search"
            className="admin-filter-input"
            placeholder="Search by name, email, or college…"
            value={search}
            onChange={handleSearchChange}
            aria-label="Search registrations"
          />
        </div>

        {!loading && (
          <p className="admin-showing-count">{countLine}</p>
        )}

        <div className="admin-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>College / Dept</th>
                  <th>Year</th>
                  <th>Phone</th>
                  <th>Event</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="admin-skeleton-row">
                        {[24, 90, 120, 100, 40, 80, 90, 100].map((w, j) => (
                          <td key={j}>
                            <span className="admin-skeleton-cell" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : registrations.length === 0
                    ? (
                        <tr>
                          <td colSpan={8} className="admin-table-empty">
                            {search || selectedEvent
                              ? 'No results match your filter.'
                              : 'No registrations yet.'}
                          </td>
                        </tr>
                      )
                    : registrations.map((reg, i) => (
                        <tr key={reg.id ?? i}>
                          <td className="admin-table-secondary">{i + 1}</td>
                          <td className="admin-table-primary">{reg.name}</td>
                          <td className="admin-table-secondary">{reg.email}</td>
                          <td>{reg.college}</td>
                          <td className="admin-table-secondary">{reg.year}</td>
                          <td className="admin-table-secondary">{reg.phone}</td>
                          <td>{reg.event_title ?? reg.event_id}</td>
                          <td className="admin-table-secondary">
                            {formatDateTime(reg.registered_at)}
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
