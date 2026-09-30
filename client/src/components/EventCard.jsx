import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/events.css';

/**
 * Format ISO date string 'YYYY-MM-DD' into e.g. "Sat, 15 Mar 2025"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format 24h time '14:00' to e.g. '02:00 PM' or keep as '14:00'
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (hours == null || minutes == null) return timeStr;
  const h = Number(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function EventCard({ event, onRegister }) {
  const [imgError, setImgError] = useState(false);

  if (!event) return null;

  const category = event.category || 'Other';
  const badgeClass = `badge-${category.toLowerCase()}`;
  const showImage = Boolean(event.image_url) && !imgError;

  return (
    <article className="event-card">
      <div className="event-card-media">
        {showImage ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="event-card-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="event-card-placeholder" aria-label="Event placeholder">
            📅
          </div>
        )}
        <span className={`event-card-badge ${badgeClass}`}>
          {category}
        </span>
      </div>

      <div className="event-card-body">
        <Link to={`/events/${event.id}`} className="event-card-title-link">
          <h3 className="event-card-title">{event.title}</h3>
        </Link>

        <div className="event-card-meta">
          <div className="event-card-meta-item">
            <span aria-hidden="true">🗓️</span>
            <span>
              {formatDate(event.date)} at {formatTime(event.time)}
            </span>
          </div>
          <div className="event-card-meta-item">
            <span aria-hidden="true">📍</span>
            <span>{event.venue}</span>
          </div>
          <div className="event-card-meta-item">
            {Number(event.ticket_price || 0) === 0 ? (
              <span className="event-card-price-pill price-free">
                🎟 Free Entry
              </span>
            ) : (
              <span className="event-card-price-pill price-paid">
                🎟 ₹{event.ticket_price}
              </span>
            )}
          </div>
        </div>

        <p className="event-card-description">{event.description}</p>

        <div className="event-card-divider" aria-hidden="true" />
        <div className="event-card-footer">
          <button
            type="button"
            className="event-card-btn"
            onClick={() => onRegister(event.id, event.title)}
          >
            Register
          </button>
        </div>
      </div>
    </article>
  );
}
