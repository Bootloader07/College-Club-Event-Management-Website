import React, { useState } from 'react';
import '../styles/featured-event.css';

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

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (hours == null || minutes == null) return timeStr;
  const h = Number(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export default function FeaturedEvent({ event, onRegister }) {
  const [imgError, setImgError] = useState(false);

  // If no event, return null per specification
  if (!event) return null;

  const hasImage = Boolean(event.image_url) && !imgError;

  return (
    <section className="featured-section" aria-label="Featured Event">
      <div className="featured-banner">
        {hasImage && (
          <img
            src={event.image_url}
            alt={event.title}
            className="featured-bg-img"
            onError={() => setImgError(true)}
            loading="eager"
          />
        )}
        <div className="featured-overlay" aria-hidden="true"></div>

        <div className="featured-content">
          <div className="featured-tag-row">
            <span className="featured-label">FEATURED EVENT</span>
            <span className="featured-category-badge">
              {event.category || 'Special'}
            </span>
          </div>

          <h2 className="featured-title">{event.title}</h2>

          <div className="featured-meta">
            <div className="featured-meta-item">
              <span aria-hidden="true">🗓️</span>
              <span>
                {formatDate(event.date)} &bull; {formatTime(event.time)}
              </span>
            </div>
            <div className="featured-meta-item">
              <span aria-hidden="true">📍</span>
              <span>{event.venue}</span>
            </div>
          </div>

          <p className="featured-description">{event.description}</p>

          <button
            type="button"
            className="featured-btn btn-primary"
            onClick={() => onRegister(event.id, event.title)}
          >
            Register Now
          </button>
        </div>
      </div>
    </section>
  );
}
