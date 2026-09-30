import React, { useState, useEffect, useRef } from 'react';
import { registerForEvent } from '../api/registrations';
import '../styles/modal.css';

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Alumni',
];

export default function RegistrationModal({ eventId, eventName, ticket_price, ticketPrice, onClose }) {
  const profile = JSON.parse(localStorage.getItem('studentProfile') || 'null');
  const isPreFilled = Boolean(profile);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    college: profile?.college || '',
    year: profile?.year || '1st Year',
    phone: profile?.phone || '',
  });

  const [fetchedPrice, setFetchedPrice] = useState(null);
  useEffect(() => {
    if (ticket_price == null && ticketPrice == null && eventId) {
      fetch(`/api/events/${eventId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.ticket_price != null) setFetchedPrice(data.ticket_price);
        })
        .catch(() => {});
    }
  }, [eventId, ticket_price, ticketPrice]);
  const effectivePrice = Number(ticket_price ?? ticketPrice ?? fetchedPrice ?? 0);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const overlayRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close when clicking directly on the backdrop overlay
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const abesEmailRegex = /^[a-zA-Z]+\.[a-zA-Z0-9]+@abes\.ac\.in$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!abesEmailRegex.test(formData.email.trim())) {
      newErrors.email = 'Only ABES college emails are valid (format: name.admissionno@abes.ac.in)';
    }

    if (!formData.college.trim()) {
      newErrors.college = 'College/Department is required';
    }

    if (!formData.year) {
      newErrors.year = 'Please select your current year';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await registerForEvent({
        event_id: Number(eventId),
        name: formData.name.trim(),
        email: formData.email.trim(),
        college: formData.college.trim(),
        year: formData.year,
        phone: formData.phone.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      if (err.status === 409 || errMsg.includes('already registered')) {
        setServerError("You've already registered for this event.");
      } else if (errMsg.includes('full capacity') || errMsg.includes('capacity')) {
        setServerError('This event is at full capacity.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 id="modal-title" className="modal-title">
              {isSuccess ? 'Registration Complete' : 'Register for Event'}
            </h2>
            <p className="modal-subtitle">{eventName}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {isSuccess ? (
          <div className="modal-success-box">
            <div className="modal-success-icon" aria-hidden="true">
              ✅
            </div>
            <p className="modal-success-message">
              You&apos;re registered! See you at <strong>{eventName}</strong>.
            </p>
            <button
              type="button"
              className="modal-success-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit} noValidate>
            {isPreFilled && (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 14px 0' }}>
                ℹ️ Your details have been pre-filled from your account.
              </p>
            )}

            {effectivePrice > 0 && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ color: 'var(--color-amber)', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>
                  🎟 Ticket Summary
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span>Event Ticket</span>
                  <span>₹{effectivePrice}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700' }}>
                  <span>Total</span>
                  <span>₹{effectivePrice}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '8px', marginBottom: 0 }}>
                  ⚠️ Payment is collected at the venue. Please carry exact change.
                </p>
              </div>
            )}

            <div className="modal-field">
              <label htmlFor="reg-name" className="modal-label">
                Full Name *
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                className={`modal-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Alex Johnson"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                readOnly={isPreFilled}
                style={isPreFilled ? { background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', cursor: 'not-allowed' } : undefined}
                required
              />
              {errors.name && (
                <span className="modal-error-text">{errors.name}</span>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="reg-email" className="modal-label">
                Email Address *
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className={`modal-input ${errors.email ? 'input-error' : ''}`}
                placeholder="e.g. alex.23b12345@abes.ac.in"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                readOnly={isPreFilled}
                style={isPreFilled ? { background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', cursor: 'not-allowed' } : undefined}
                required
              />
              {errors.email && (
                <span className="modal-error-text">{errors.email}</span>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="reg-college" className="modal-label">
                College / Department *
              </label>
              <input
                id="reg-college"
                name="college"
                type="text"
                className={`modal-input ${errors.college ? 'input-error' : ''}`}
                placeholder="e.g. Computer Science & Eng"
                value={formData.college}
                onChange={handleChange}
                disabled={isSubmitting}
                readOnly={isPreFilled}
                style={isPreFilled ? { background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', cursor: 'not-allowed' } : undefined}
                required
              />
              {errors.college && (
                <span className="modal-error-text">{errors.college}</span>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="reg-year" className="modal-label">
                Year of Study *
              </label>
              <select
                id="reg-year"
                name="year"
                className={`modal-select ${errors.year ? 'input-error' : ''}`}
                value={formData.year}
                onChange={handleChange}
                disabled={isSubmitting || isPreFilled}
                style={isPreFilled ? { background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', cursor: 'not-allowed' } : undefined}
                required
              >
                {YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              {errors.year && (
                <span className="modal-error-text">{errors.year}</span>
              )}
            </div>

            <div className="modal-field">
              <label htmlFor="reg-phone" className="modal-label">
                Phone Number (10 digits) *
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                maxLength={10}
                className={`modal-input ${errors.phone ? 'input-error' : ''}`}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                readOnly={isPreFilled}
                style={isPreFilled ? { background: 'rgba(255,255,255,0.03)', color: 'var(--color-muted)', cursor: 'not-allowed' } : undefined}
                required
              />
              {errors.phone && (
                <span className="modal-error-text">{errors.phone}</span>
              )}
            </div>

            {serverError && (
              <div className="modal-server-error" role="alert">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              className="modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Registering...'
                : effectivePrice === 0
                ? 'Confirm Registration'
                : `Confirm & Pay at Venue  ₹${effectivePrice}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
