import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import adminFetch from '../../api/admin';
import '../../styles/admin.css';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Technical',
  date: '',
  time: '',
  venue: '',
  image_url: '',
  capacity: '',
  ticket_price: '0',
  is_featured: false,
};

function categoryBadgeClass(cat) {
  const map = {
    Technical: 'ev-badge-technical',
    Cultural: 'ev-badge-cultural',
    Sports: 'ev-badge-sports',
    Workshop: 'ev-badge-workshop',
    Other: 'ev-badge-other',
  };
  return map[cat] || 'ev-badge-other';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function validate(form) {
  const errs = {};
  if (!form.title.trim()) errs.title = 'Title is required.';
  if (!form.description.trim()) errs.description = 'Description is required.';
  if (!form.date) errs.date = 'Date is required.';
  if (!form.time) errs.time = 'Time is required.';
  if (!form.venue.trim()) errs.venue = 'Venue is required.';
  const cap = Number(form.capacity);
  if (!form.capacity || isNaN(cap) || cap < 1) errs.capacity = 'Capacity must be ≥ 1.';
  return errs;
}

/* ── Thumbnail cell ── */
function EventThumb({ url, title }) {
  const [imgErr, setImgErr] = useState(false);

  if (!url || imgErr) {
    return <div className="ev-thumb-placeholder" aria-label={title}>📅</div>;
  }

  return (
    <img
      src={url}
      alt={title}
      className="ev-thumb"
      onError={() => setImgErr(true)}
    />
  );
}

/* ── Event Form Modal ── */
function EventFormModal({ event, onClose, onSaved }) {
  const isEdit = Boolean(event?.id);
  const [form, setForm] = useState(
    event
      ? {
          title: event.title || '',
          description: event.description || '',
          category: event.category || 'Technical',
          date: event.date || '',
          time: event.time || '',
          venue: event.venue || '',
          image_url: event.image_url || '',
          capacity: event.capacity?.toString() || '',
          ticket_price: event.ticket_price != null ? event.ticket_price.toString() : '0',
          is_featured: Boolean(event.is_featured),
        }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setServerError('');
    setSaving(true);

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      ticket_price: Number(form.ticket_price) || 0,
      is_featured: form.is_featured ? 1 : 0,
    };

    try {
      let saved;
      if (isEdit) {
        saved = await adminFetch(`/api/admin/events/${event.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        saved = await adminFetch('/api/admin/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved(saved, isEdit);
    } catch (err) {
      setServerError(err.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  }

  function field(name) {
    return {
      name,
      value: form[name],
      onChange: handleChange,
      className: `admin-form-input${errors[name] ? ' field-error' : ''}`,
    };
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="admin-modal-box">
        <div className="admin-modal-header">
          <h2 id="modal-title" className="admin-modal-title">
            {isEdit ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button className="admin-modal-close" onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        <form className="admin-modal-form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="title">Event Title *</label>
            <input id="title" type="text" {...field('title')} />
            {errors.title && <span className="admin-form-error-text">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`admin-form-textarea${errors.description ? ' field-error' : ''}`}
            />
            {errors.description && <span className="admin-form-error-text">{errors.description}</span>}
          </div>

          {/* Category + Venue */}
          <div className="admin-form-row-2">
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="admin-form-select"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="venue">Venue *</label>
              <input id="venue" type="text" {...field('venue')} />
              {errors.venue && <span className="admin-form-error-text">{errors.venue}</span>}
            </div>
          </div>

          {/* Date + Time */}
          <div className="admin-form-row-2">
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="date">Date *</label>
              <input id="date" type="date" {...field('date')} />
              {errors.date && <span className="admin-form-error-text">{errors.date}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="time">Time *</label>
              <input id="time" type="time" {...field('time')} />
              {errors.time && <span className="admin-form-error-text">{errors.time}</span>}
            </div>
          </div>

          {/* Image URL */}
          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="image_url">Image URL</label>
            <input id="image_url" type="url" {...field('image_url')} placeholder="https://…" />
          </div>

          {/* Capacity + Ticket Price */}
          <div className="admin-form-row-2">
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="capacity">Capacity *</label>
              <input id="capacity" type="number" min="1" {...field('capacity')} />
              {errors.capacity && <span className="admin-form-error-text">{errors.capacity}</span>}
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label" htmlFor="ticket_price">Ticket Price (₹)</label>
              <input
                id="ticket_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0 for free events"
                {...field('ticket_price')}
              />
            </div>
          </div>

          {/* Featured checkbox */}
          <div className="admin-form-checkbox-wrap">
            <label className="admin-form-checkbox-label" htmlFor="is_featured">
              <input
                id="is_featured"
                type="checkbox"
                name="is_featured"
                className="admin-form-checkbox"
                checked={form.is_featured}
                onChange={handleChange}
              />
              Mark as Featured Event
            </label>
            <span className="admin-form-checkbox-note">
              Only one event can be featured at a time — this will un-feature the current one.
            </span>
          </div>

          {serverError && (
            <div className="admin-modal-server-error">{serverError}</div>
          )}

          <div className="admin-modal-footer">
            <button type="button" className="admin-modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-modal-submit-btn" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Table Row ── */
function EventRow({ event, onEdit, onDeleted, onFeatureToggle }) {
  const [confirmState, setConfirmState] = useState(null);
  // confirmState = { regCount } when confirmation is showing

  async function handleDeleteClick() {
    // Fetch registration count for this event
    try {
      const data = await adminFetch(`/api/admin/registrations?event_id=${event.id}`);
      const count = Array.isArray(data) ? data.length : (data?.total ?? 0);
      setConfirmState({ regCount: count });
    } catch {
      setConfirmState({ regCount: event.registrations_count ?? 0 });
    }
  }

  async function handleConfirmDelete() {
    try {
      await adminFetch(`/api/admin/events/${event.id}`, { method: 'DELETE' });
      onDeleted(event.id);
    } catch (err) {
      alert(err.message || 'Failed to delete event.');
      setConfirmState(null);
    }
  }

  const filled = event.registrations_count ?? 0;
  const cap = event.capacity ?? 0;
  const ratio = cap > 0 ? filled / cap : 0;
  const capClass = ratio >= 1 ? 'capacity-full' : ratio > 0.8 ? 'capacity-warn' : 'capacity-normal';

  return (
    <tr>
      <td>
        <EventThumb url={event.image_url} title={event.title} />
      </td>
      <td className="admin-table-primary">{event.title}</td>
      <td>
        <span className={`ev-badge ${categoryBadgeClass(event.category)}`}>
          {event.category}
        </span>
      </td>
      <td className="admin-table-secondary">{formatDate(event.date)}</td>
      <td>
        {!event.ticket_price || Number(event.ticket_price) === 0 ? (
          <span style={{ color: '#10B981', fontWeight: '600' }}>Free</span>
        ) : (
          <span style={{ color: 'var(--color-amber)', fontWeight: '600' }}>₹{event.ticket_price}</span>
        )}
      </td>
      <td>
        <span className={capClass}>{filled} / {cap}</span>
      </td>
      <td>
        <button
          className="featured-star"
          title={event.is_featured ? 'Unfeature' : 'Set as featured'}
          onClick={() => onFeatureToggle(event.id)}
          type="button"
          aria-label={event.is_featured ? 'Featured event' : 'Set as featured'}
        >
          {event.is_featured ? '⭐' : '☆'}
        </button>
      </td>
      <td>
        {confirmState ? (
          <div className="admin-inline-confirm">
            <span className="admin-inline-confirm-text">
              ⚠️ Delete {confirmState.regCount} registrations too?
            </span>
            <button className="admin-confirm-yes-btn" onClick={handleConfirmDelete} type="button">
              Yes, Delete
            </button>
            <button className="admin-confirm-cancel-btn" onClick={() => setConfirmState(null)} type="button">
              Cancel
            </button>
          </div>
        ) : (
          <div className="admin-actions">
            <button
              className="admin-btn-sm admin-btn-sm-edit"
              onClick={() => onEdit(event)}
              type="button"
              aria-label={`Edit ${event.title}`}
            >
              ✏️ Edit
            </button>
            <button
              className="admin-btn-sm admin-btn-sm-delete"
              onClick={handleDeleteClick}
              type="button"
              aria-label={`Delete ${event.title}`}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ── Page ── */
export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState(undefined); // undefined = closed, null = add new

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/events');
      setEvents(Array.isArray(data) ? data : (data.events ?? []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function handleSaved(saved, isEdit) {
    if (isEdit) {
      setEvents(prev => prev.map(e => e.id === saved.id ? { ...e, ...saved } : e));
    } else {
      setEvents(prev => [saved, ...prev]);
    }
    setModalEvent(undefined);
  }

  function handleDeleted(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function handleFeatureToggle(id) {
    // Optimistic update — only one star at a time
    setEvents(prev =>
      prev.map(e => ({ ...e, is_featured: e.id === id ? 1 : 0 }))
    );
    try {
      await adminFetch(`/api/admin/events/${id}/feature`, { method: 'PUT' });
    } catch {
      // Revert on failure
      fetchEvents();
    }
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-page-header-row">
          <div>
            <h1 className="admin-page-title">Manage Events</h1>
            <p className="admin-page-subtitle">Create, edit, and manage all club events.</p>
          </div>
          <button
            className="admin-btn-primary"
            onClick={() => setModalEvent(null)}
            type="button"
          >
            + Add Event
          </button>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Capacity</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="admin-skeleton-row">
                        {[48, 120, 80, 80, 50, 60, 30, 100].map((w, j) => (
                          <td key={j}>
                            <span className="admin-skeleton-cell" style={{ width: w, height: j === 0 ? 48 : 16 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : events.length === 0
                    ? (
                        <tr>
                          <td colSpan={8} className="admin-table-empty">
                            No events found. Click "Add Event" to get started.
                          </td>
                        </tr>
                      )
                    : events.map(event => (
                        <EventRow
                          key={event.id}
                          event={event}
                          onEdit={ev => setModalEvent(ev)}
                          onDeleted={handleDeleted}
                          onFeatureToggle={handleFeatureToggle}
                        />
                      ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modalEvent !== undefined && (
        <EventFormModal
          event={modalEvent}
          onClose={() => setModalEvent(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
