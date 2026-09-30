import { Router } from 'express';
import db from '../db.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth required
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/events
 * Query params: ?search=<string> ?category=<string>
 *
 * Returns all events ordered by date ASC.
 * Includes registrations_count via LEFT JOIN — used by admin ManageEvents
 * table and for calculating seats remaining without an extra request.
 */
router.get('/events', (req, res) => {
  const { search, category } = req.query;
  const conditions = [];
  const params = [];

  if (search?.trim()) {
    conditions.push('e.title LIKE ?');
    params.push(`%${search.trim()}%`);
  }
  if (category && category !== 'All') {
    conditions.push('e.category = ?');
    params.push(category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const events = db.prepare(`
      SELECT e.*, COUNT(r.id) AS registrations_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      ${where}
      GROUP BY e.id
      ORDER BY e.date ASC
    `).all(...params);

    res.json(events);
  } catch (err) {
    console.error('GET /api/events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/featured
 *
 * ⚠️  MUST be registered BEFORE /events/:id to prevent Express from treating
 *    the literal string "featured" as a dynamic :id parameter.
 *
 * Priority:
 *   1. Event explicitly marked is_featured = 1
 *   2. Fallback: the most upcoming future event (lowest future date)
 *      Never hides the section — always returns something if any event exists.
 */
router.get('/events/featured', (req, res) => {
  try {
    // 1. Explicitly featured event
    let event = db.prepare(`
      SELECT e.*, COUNT(r.id) AS registrations_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      WHERE e.is_featured = 1
      GROUP BY e.id
      LIMIT 1
    `).get();

    // 2. Fallback: nearest upcoming event
    if (!event) {
      event = db.prepare(`
        SELECT e.*, COUNT(r.id) AS registrations_count
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id
        WHERE e.date >= date('now')
        GROUP BY e.id
        ORDER BY e.date ASC
        LIMIT 1
      `).get();
    }

    res.json(event ?? null);
  } catch (err) {
    console.error('GET /api/events/featured error:', err);
    res.status(500).json({ error: 'Failed to fetch featured event' });
  }
});

/**
 * GET /api/events/:id
 *
 * Returns a single event with its registrations_count for the
 * "seats remaining = capacity - registrations_count" calculation.
 */
router.get('/events/:id', (req, res) => {
  try {
    const event = db.prepare(`
      SELECT e.*, COUNT(r.id) AS registrations_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
    `).get(req.params.id);

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(event);
  } catch (err) {
    console.error('GET /api/events/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ADMIN ROUTES — requireAuth applied per route
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/events
 *
 * Creates a new event. If is_featured is true, all other events are
 * unfeatured first to maintain the single-featured invariant.
 */
router.post('/admin/events', requireAuth, (req, res) => {
  const { title, description, category, date, time, venue, image_url, capacity, ticket_price, is_featured } = req.body ?? {};

  if (!title || !description || !category || !date || !time || !venue || capacity == null) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, category, date, time, venue, capacity',
    });
  }
  if (Number(capacity) < 1) {
    return res.status(400).json({ error: 'Capacity must be at least 1' });
  }
  const price = ticket_price != null ? Number(ticket_price) : 0;
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Ticket price must be a non-negative number' });
  }

  try {
    if (is_featured) {
      db.prepare('UPDATE events SET is_featured = 0').run();
    }

    const result = db.prepare(`
      INSERT INTO events (title, description, category, date, time, venue, image_url, capacity, ticket_price, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, description, category, date, time, venue,
      image_url || null, Number(capacity), price, is_featured ? 1 : 0
    );

    const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('POST /api/admin/events error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/admin/events/:id
 *
 * Updates all fields on an existing event. Same single-featured enforcement.
 * Returns the updated event row with registrations_count.
 */
router.put('/admin/events/:id', requireAuth, (req, res) => {
  const { title, description, category, date, time, venue, image_url, capacity, ticket_price, is_featured } = req.body ?? {};

  if (!title || !description || !category || !date || !time || !venue || capacity == null) {
    return res.status(400).json({
      error: 'Missing required fields: title, description, category, date, time, venue, capacity',
    });
  }
  if (Number(capacity) < 1) {
    return res.status(400).json({ error: 'Capacity must be at least 1' });
  }
  const price = ticket_price != null ? Number(ticket_price) : 0;
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Ticket price must be a non-negative number' });
  }

  try {
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    if (is_featured) {
      db.prepare('UPDATE events SET is_featured = 0').run();
    }

    db.prepare(`
      UPDATE events
      SET title = ?, description = ?, category = ?, date = ?, time = ?,
          venue = ?, image_url = ?, capacity = ?, ticket_price = ?, is_featured = ?
      WHERE id = ?
    `).run(
      title, description, category, date, time, venue,
      image_url || null, Number(capacity), price, is_featured ? 1 : 0,
      req.params.id
    );

    // Return the updated row with registrations_count for the admin table
    const updated = db.prepare(`
      SELECT e.*, COUNT(r.id) AS registrations_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/events/:id error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/admin/events/:id
 *
 * Deletes the event. The ON DELETE CASCADE on registrations.event_id
 * automatically removes all associated registrations.
 *
 * The admin UI (Fix 1) fetches registrations_count from the event row
 * BEFORE calling this endpoint to show: "Deleting X will remove Y registrations."
 */
router.delete('/admin/events/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id, title FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Event "${existing.title}" deleted` });
  } catch (err) {
    console.error('DELETE /api/admin/events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * PUT /api/admin/events/:id/feature
 *
 * Sets ONE event as featured and clears all others atomically.
 * The two-statement sequence runs synchronously in better-sqlite3 —
 * no explicit transaction needed since each prepare().run() is auto-committed.
 */
router.put('/admin/events/:id/feature', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    // Clear all, then set only this one
    db.prepare('UPDATE events SET is_featured = 0').run();
    db.prepare('UPDATE events SET is_featured = 1 WHERE id = ?').run(req.params.id);

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/events/:id/feature error:', err);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

export default router;
