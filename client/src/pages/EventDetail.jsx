import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById } from '../api/events';
import { getMyRegistrations } from '../api/students';
import RegistrationModal from '../components/RegistrationModal';
import '../styles/event-detail.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (hours == null || minutes == null) return timeStr;
  const h = Number(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    const token = localStorage.getItem('studentToken');
    if (token) {
      getMyRegistrations()
        .then((regs) => {
          if (!isMounted) return;
          const match = Array.isArray(regs) && regs.find((r) => String(r.event_id) === String(id));
          if (match) setRegistration(match);
        })
        .catch(() => {});
    }

    async function fetchDetail() {
      try {
        const data = await getEventById(id);
        if (isMounted) {
          setEvent(data);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <div className="skeleton-card skeleton-detail-banner"></div>
          <div className="skeleton-pill skeleton-detail-title"></div>
          <div className="skeleton-text skeleton-detail-desc"></div>
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="event-detail-page">
        <div className="container">
          <Link to="/events" className="event-detail-back-link">
            &larr; Back to Events
          </Link>
          <div className="event-detail-not-found" role="alert">
            <div className="event-detail-not-found-icon" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="event-detail-not-found-title">Event not found.</h1>
            <p className="event-detail-not-found-desc">
              The event you are looking for may have been removed or does not exist.
            </p>
            <Link to="/events" className="event-detail-not-found-btn">
              Explore Available Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category = event.category || 'Other';
  const badgeClass = `badge-${category.toLowerCase()}`;
  const showImage = Boolean(event.image_url) && !imgError;

  const capacity = Number(event.capacity) || 0;
  const registrationsCount = Number(event.registrations_count) || 0;
  const seatsRemaining = Math.max(0, capacity - registrationsCount);

  let seatsColorClass = 'seats-green';
  if (seatsRemaining === 0) {
    seatsColorClass = 'seats-red';
  } else if (seatsRemaining <= 10) {
    seatsColorClass = 'seats-amber';
  }

  return (
    <div className="event-detail-page">
      <div className="container">
        <Link to="/events" className="event-detail-back-link">
          &larr; Back to Events
        </Link>

        {/* ── Banner Media with Category Badge ── */}
        <div className="event-detail-banner">
          {showImage ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="event-detail-banner-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="event-detail-banner-placeholder" aria-label="Event placeholder">
              📅
            </div>
          )}
          <span className={`event-detail-badge ${badgeClass}`}>{category}</span>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="event-detail-grid">
          <main className="event-detail-main">
            <h1 className="event-detail-title">{event.title}</h1>

            <h2 className="event-detail-desc-heading">About This Event</h2>
            <p className="event-detail-desc-text">{event.description}</p>
          </main>

          <aside className="event-detail-sidebar" aria-label="Event summary and registration">
            <ul className="event-detail-meta-list">
              <li className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden="true">
                  🗓️
                </span>
                <div className="event-detail-meta-text">
                  <span className="event-detail-meta-label">Date</span>
                  <span className="event-detail-meta-value">
                    {formatDate(event.date)}
                  </span>
                </div>
              </li>

              <li className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden="true">
                  ⏰
                </span>
                <div className="event-detail-meta-text">
                  <span className="event-detail-meta-label">Time</span>
                  <span className="event-detail-meta-value">
                    {formatTime(event.time)}
                  </span>
                </div>
              </li>

              <li className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden="true">
                  📍
                </span>
                <div className="event-detail-meta-text">
                  <span className="event-detail-meta-label">Venue</span>
                  <span className="event-detail-meta-value">{event.venue}</span>
                </div>
              </li>

              <li className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden="true">
                  🎟
                </span>
                <div className="event-detail-meta-text">
                  {Number(event.ticket_price || 0) === 0 ? (
                    <div>
                      <span className="event-detail-meta-label">Ticket Price</span>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '4px',
                          background: 'rgba(16,185,129,0.15)',
                          color: '#10B981',
                          border: '1px solid #10B981',
                          borderRadius: '20px',
                          padding: '4px 14px',
                          fontSize: '13px',
                          fontWeight: '700',
                        }}
                      >
                        Free Entry 🎟
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="event-detail-meta-label">Ticket Price</span>
                      <span
                        className="event-detail-meta-value"
                        style={{
                          color: 'var(--color-amber)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          display: 'block',
                          marginTop: '2px',
                        }}
                      >
                        ₹{event.ticket_price}
                      </span>
                      <span
                        style={{
                          color: 'var(--color-muted)',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          display: 'block',
                          marginTop: '2px',
                        }}
                      >
                        (Payment collected at the venue)
                      </span>
                    </div>
                  )}
                </div>
              </li>

              <li className="event-detail-meta-item">
                <span className="event-detail-meta-icon" aria-hidden="true">
                  👥
                </span>
                <div className="event-detail-meta-text">
                  <span className="event-detail-meta-label">Total Capacity</span>
                  <span className="event-detail-meta-value">{capacity} seats</span>
                </div>
              </li>
            </ul>

            <div className="event-detail-seats">
              <span className="event-detail-seats-label">Availability</span>
              <span className={`seats-badge ${seatsColorClass}`}>
                {seatsRemaining === 0
                  ? 'Sold Out'
                  : `${seatsRemaining} seats remaining`}
              </span>
            </div>

            {registration ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    color: '#10B981',
                    border: '1px solid #10B981',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  ✓ You're registered for this event
                </div>
                <span style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
                  Registered on {formatDate(registration.registered_at?.split('T')[0] || registration.registered_at?.split(' ')[0] || registration.registered_at)}
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="event-detail-action-btn"
                disabled={seatsRemaining === 0}
                onClick={() => setIsModalOpen(true)}
              >
                {seatsRemaining === 0 ? 'Event Full' : 'Register for this Event'}
              </button>
            )}
          </aside>
        </div>
      </div>

      {isModalOpen && (
        <RegistrationModal
          eventId={event.id}
          eventName={event.title}
          ticket_price={event.ticket_price}
          onClose={() => {
            setIsModalOpen(false);
            const token = localStorage.getItem('studentToken');
            if (token) {
              getMyRegistrations()
                .then((regs) => {
                  const match = Array.isArray(regs) && regs.find((r) => String(r.event_id) === String(id));
                  if (match) setRegistration(match);
                })
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}
