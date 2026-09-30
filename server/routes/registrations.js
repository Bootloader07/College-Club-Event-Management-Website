import { Router } from 'express';
import db, { transaction } from '../db.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/registrations
 *
 * Registers a student for an event.
 *
 * Fix 3 — Capacity enforcement via better-sqlite3 transaction:
 *   The count + insert is wrapped in a single transaction so that two
 *   simultaneous requests at the last seat cannot both succeed.
 *   Two distinct 409 errors are returned:
 *     - EVENT_FULL → "This event is at full capacity"
 *     - UNIQUE constraint → "You've already registered for this event"
 */
router.post('/registrations', (req, res) => {
  const { event_id, name, email, college, year, phone } = req.body ?? {};

  // ── Server-side validation ──────────────────────────────────────────────────
  if (!event_id || !name || !email || !college || !year || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  const abesEmailRegex = /^[a-zA-Z]+\.[a-zA-Z0-9]+@abes\.ac\.in$/;
  if (!abesEmailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Only ABES college emails are accepted' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
  }

  // ── Check event exists ──────────────────────────────────────────────────────
  const event = db.prepare('SELECT id, title FROM events WHERE id = ?').get(event_id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // ── Fix 3: transaction-based capacity enforcement ───────────────────────────
  const register = transaction((data) => {
    const { capacity } = db.prepare('SELECT capacity FROM events WHERE id = ?').get(data.event_id);
    const { count } = db.prepare('SELECT COUNT(*) as count FROM registrations WHERE event_id = ?').get(data.event_id);
    if (count >= capacity) throw Object.assign(new Error('FULL'), { code: 'EVENT_FULL' });
    return db.prepare(
      'INSERT INTO registrations (event_id, name, email, college, year, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(data.event_id, data.name, data.email, data.college, data.year, data.phone);
  });

  try {
    const result = register({ event_id, name, email, college, year, phone });
    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      success: true,
      message: `You're registered! See you at ${event.title}.`,
      registration,
    });
  } catch (err) {
    if (err.code === 'EVENT_FULL') {
      return res.status(409).json({ error: 'This event is at full capacity' });
    }
    // SQLite UNIQUE constraint: same email + event_id already exists
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: "You've already registered for this event" });
    }
    console.error('POST /api/registrations error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/registrations
 * Query params: ?event_id=<number> ?search=<string>
 *
 * Returns all registrations joined with event title.
 * Supports filtering by event and searching by student name or email.
 * Ordered newest-first.
 */
router.get('/admin/registrations', requireAuth, (req, res) => {
  const { event_id, search } = req.query;
  const conditions = [];
  const params = [];

  if (event_id) {
    conditions.push('r.event_id = ?');
    params.push(event_id);
  }
  if (search?.trim()) {
    conditions.push('(r.name LIKE ? OR r.email LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const registrations = db.prepare(`
      SELECT r.*, e.title AS event_title
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      ${where}
      ORDER BY r.registered_at DESC
    `).all(...params);

    res.json(registrations);
  } catch (err) {
    console.error('GET /api/admin/registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * GET /api/admin/registrations/:eventId
 *
 * Registrations for a single event, wrapped with event metadata.
 * Also present in architecture.md — retained for direct event-specific queries.
 */
router.get('/admin/registrations/:eventId', requireAuth, (req, res) => {
  try {
    const event = db.prepare('SELECT id, title FROM events WHERE id = ?').get(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const registrations = db.prepare(`
      SELECT r.*, e.title AS event_title
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE r.event_id = ?
      ORDER BY r.registered_at DESC
    `).all(req.params.eventId);

    res.json({ event, registrations });
  } catch (err) {
    console.error('GET /api/admin/registrations/:eventId error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

export default router;
