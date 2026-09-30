import React, { useState, useEffect } from 'react';
import { getEvents } from '../api/events';
import EventCard from '../components/EventCard';
import SearchFilter from '../components/SearchFilter';
import RegistrationModal from '../components/RegistrationModal';
import '../styles/events.css';

export default function Events() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalEvent, setActiveModalEvent] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch events whenever debouncedSearch or category changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchFilteredEvents() {
      try {
        const data = await getEvents(debouncedSearch, category);
        if (isMounted) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        if (isMounted) setEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFilteredEvents();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, category]);

  const handleOpenRegister = (eventId, eventTitle) => {
    setActiveModalEvent({ id: eventId, title: eventTitle });
  };

  const handleCloseModal = () => {
    setActiveModalEvent(null);
  };

  return (
    <div className="events-page">
      <div className="container">
        <header className="events-header">
          <h1 className="events-title">All Campus Events</h1>
          <p className="events-subtitle">
            Find technical hackathons, cultural festivals, sports tourneys, and
            hands-on workshops.
          </p>
        </header>

        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
        />

        {loading ? (
          <div className="events-grid" aria-label="Loading events">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-image"></div>
                <div className="skeleton-content">
                  <div className="skeleton-pill"></div>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-btn"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="events-empty-state" role="status">
            <div className="events-empty-icon" aria-hidden="true">
              🔍
            </div>
            <h2 className="events-empty-title">No events found.</h2>
            <p className="events-empty-desc">
              Try a different search or category filter.
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRegister={handleOpenRegister}
              />
            ))}
          </div>
        )}
      </div>

      {activeModalEvent && (
        <RegistrationModal
          eventId={activeModalEvent.id}
          eventName={activeModalEvent.title}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
