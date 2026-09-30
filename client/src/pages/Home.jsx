import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getFeaturedEvent } from '../api/events';
import EventCard from '../components/EventCard';
import FeaturedEvent from '../components/FeaturedEvent';
import RegistrationModal from '../components/RegistrationModal';
import '../styles/home.css';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop'];

const FLOATING_PROPS = [
  { icon: '⚡', label: '24h HackSphere', cat: 'Technical', pos: 'pos-tl' },
  { icon: '🎭', label: 'Cultural Fest', cat: 'Cultural', pos: 'pos-tr' },
  { icon: '🏆', label: 'Athletic Meet', cat: 'Sports', pos: 'pos-bl' },
  { icon: '🔬', label: 'Robotics Workshop', cat: 'Workshop', pos: 'pos-br' },
];

export default function Home() {
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [featuredRes, allEventsRes] = await Promise.all([
          getFeaturedEvent().catch(() => null),
          getEvents().catch(() => []),
        ]);

        if (isMounted) {
          setFeaturedEvent(featuredRes);
          setAllEvents(Array.isArray(allEventsRes) ? allEventsRes : []);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenRegister = (eventId, eventTitle) => {
    setActiveModalEvent({ id: eventId, title: eventTitle });
  };

  const handleCloseModal = () => {
    setActiveModalEvent(null);
  };

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    const target = document.getElementById('upcoming-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered upcoming events based on category & search
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      const matchCat = activeCategory === 'All' || (ev.category && ev.category.toLowerCase() === activeCategory.toLowerCase());
      const query = heroSearch.trim().toLowerCase();
      const matchQuery = !query ||
        ev.title?.toLowerCase().includes(query) ||
        ev.venue?.toLowerCase().includes(query) ||
        ev.description?.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [allEvents, activeCategory, heroSearch]);

  return (
    <div className="home-page">
      {/* ── Interactive Hero Section with Lines & Background Props ── */}
      <section className="home-hero" aria-label="Welcome">
        {/* Architectural Tech Grid Lines Background */}
        <div className="hero-grid-pattern" aria-hidden="true" />
        
        {/* Geometric Tech Laser Lines with Coordinate Nodes */}
        <div className="hero-laser-line hero-laser-h1" aria-hidden="true">
          <span className="hero-laser-node node-1" />
          <span className="hero-laser-node node-2" />
        </div>
        <div className="hero-laser-line hero-laser-h2" aria-hidden="true">
          <span className="hero-laser-node node-3" />
        </div>
        <div className="hero-laser-line hero-laser-v1" aria-hidden="true" />
        <div className="hero-laser-line hero-laser-v2" aria-hidden="true" />

        {/* Ambient Glowing Orbs */}
        <div className="hero-orb hero-orb-crimson" aria-hidden="true" />
        <div className="hero-orb hero-orb-gold" aria-hidden="true" />

        {/* Corner Tech Crosshairs */}
        <span className="hero-crosshair crosshair-tl" aria-hidden="true">+</span>
        <span className="hero-crosshair crosshair-tr" aria-hidden="true">+</span>
        <span className="hero-crosshair crosshair-bl" aria-hidden="true">+</span>
        <span className="hero-crosshair crosshair-br" aria-hidden="true">+</span>

        {/* Interactive Floating Event Props / Chips */}
        {FLOATING_PROPS.map((prop, idx) => (
          <button
            key={idx}
            type="button"
            className={`hero-floating-chip ${prop.pos}`}
            onClick={() => handleSelectCategory(prop.cat)}
            title={`Filter by ${prop.cat}`}
          >
            <span className="floating-chip-icon">{prop.icon}</span>
            <div className="floating-chip-text">
              <span className="floating-chip-title">{prop.label}</span>
              <span className="floating-chip-cat">{prop.cat} &rarr;</span>
            </div>
          </button>
        ))}

        <div className="container home-hero-content">
          {/* Live Campus Radar Pulse Pill */}
          <div className="hero-live-pill">
            <span className="pulse-indicator">
              <span className="pulse-dot" />
              <span className="pulse-ring" />
            </span>
            <span className="hero-live-text">
              CAMPUS LIFE &bull; ABES WAVE PORTAL &bull; LIVE REGISTRATIONS
            </span>
          </div>

          <h1 className="home-hero-heading">
            Discover What&apos;s Happening at <span className="hero-heading-highlight">ABES</span>
          </h1>

          <p className="home-hero-subtext">
            The official event management portal for ABES Engineering College.
            Browse and register for technical hackathons, cultural festivals, sports tournaments, and skill workshops.
          </p>

          {/* Interactive Hero Quick-Search Bar */}
          <div className="hero-search-box">
            <span className="hero-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Quick search events, hackathons, venues..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              aria-label="Search events directly from hero"
            />
            {heroSearch && (
              <button
                type="button"
                className="hero-search-clear"
                onClick={() => setHeroSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Interactive Category Filter Chips */}
          <div className="hero-category-pills" role="tablist" aria-label="Quick category filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`hero-category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleSelectCategory(cat)}
                role="tab"
                aria-selected={activeCategory === cat}
              >
                {cat === 'Technical' && '💻 '}
                {cat === 'Cultural' && '🎭 '}
                {cat === 'Sports' && '🏆 '}
                {cat === 'Workshop' && '🔬 '}
                {cat === 'All' && '⚡ '}
                {cat}
              </button>
            ))}
          </div>

          {/* Hero CTA Button Row */}
          <div className="hero-cta-group">
            <Link to="/events" className="btn btn-primary hero-btn-main">
              Explore All Events &rarr;
            </Link>
            {featuredEvent && (
              <a href="#featured-section" className="btn btn-outline hero-btn-secondary">
                View Featured Event &darr;
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Campus Stats Highlight Row (Directly matching Image 2 Stat Cards) ── */}
      <section className="campus-stats-section" aria-label="Campus Highlights">
        <div className="container">
          <div className="campus-stats-grid">
            {/* Stat Card 1 - Blue Line */}
            <div className="campus-stat-card border-top-blue">
              <div className="stat-card-header">
                <span className="stat-card-label">CAMPUS EVENTS</span>
                <span className="stat-card-icon blue-tint">📅</span>
              </div>
              <div className="stat-card-number">50+</div>
              <div className="stat-card-desc">Annual Technical &amp; Cultural Fests</div>
            </div>

            {/* Stat Card 2 - Green Line */}
            <div className="campus-stat-card border-top-green">
              <div className="stat-card-header">
                <span className="stat-card-label">ACTIVE STUDENTS</span>
                <span className="stat-card-icon green-tint">👥</span>
              </div>
              <div className="stat-card-number">2,500+</div>
              <div className="stat-card-desc">Registered across all departments</div>
            </div>

            {/* Stat Card 3 - Gold Line */}
            <div className="campus-stat-card border-top-gold">
              <div className="stat-card-header">
                <span className="stat-card-label">STUDENT CLUBS</span>
                <span className="stat-card-icon gold-tint">⭐</span>
              </div>
              <div className="stat-card-number">12+</div>
              <div className="stat-card-desc">Innovation &amp; Cultural Societies</div>
            </div>

            {/* Stat Card 4 - Red Line */}
            <div className="campus-stat-card border-top-red">
              <div className="stat-card-header">
                <span className="stat-card-label">VERIFIED ACCESS</span>
                <span className="stat-card-icon red-tint">🎓</span>
              </div>
              <div className="stat-card-number">100%</div>
              <div className="stat-card-desc">Direct admission &amp; OD recognition</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Featured Event Section (if exists) ── */}
        {featuredEvent && (
          <div id="featured-section">
            <FeaturedEvent
              event={featuredEvent}
              onRegister={handleOpenRegister}
            />
          </div>
        )}

        {/* ── Upcoming Events Section with Live Interactive Tabs ── */}
        <section id="upcoming-section" className="home-upcoming-section" aria-label="Upcoming Events">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Upcoming Events</h2>
              <p className="home-section-subtitle">
                {activeCategory !== 'All' ? `Showing ${activeCategory} events` : 'Browse what is happening on campus'}
                {heroSearch ? ` matching "${heroSearch}"` : ''} ({filteredEvents.length})
              </p>
            </div>
            <Link to="/events" className="home-view-all-link">
              View All Events &rarr;
            </Link>
          </div>

          {/* Interactive Category Filter Bar */}
          <div className="home-filter-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`home-filter-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="events-grid" aria-label="Loading upcoming events">
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
          ) : filteredEvents.length === 0 ? (
            <div className="home-no-events">
              <span className="no-events-icon">📅</span>
              <h3>No events found</h3>
              <p>No upcoming events match your selected filters. Try switching category or clearing your search.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setActiveCategory('All'); setHeroSearch(''); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {filteredEvents.slice(0, 6).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleOpenRegister}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Registration Modal ── */}
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
