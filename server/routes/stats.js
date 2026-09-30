import { Router } from 'express';
import db from '../db.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

/**
 * GET /api/admin/stats
 *
 * Fix 2 — Single endpoint for all Dashboard stats.
 * Dashboard.jsx calls only this endpoint — no client-side derivation.
 *
 * Returns:
 * {
 *   total_events        : number,
 *   total_registrations : number,
 *   upcoming_events     : number,   -- events with date >= today
 *   recent_registrations: [         -- last 5, newest first
 *     { name, email, event_title, registered_at }
 *   ]
 * }
 */
router.get('/stats', requireAuth, (req, res) => {
  try {
    const { total_events } = db
      .prepare('SELECT COUNT(*) AS total_events FROM events')
      .get();

    const { total_registrations } = db
      .prepare('SELECT COUNT(*) AS total_registrations FROM registrations')
      .get();

    const { upcoming_events } = db
      .prepare("SELECT COUNT(*) AS upcoming_events FROM events WHERE date >= date('now')")
      .get();

    const recent_registrations = db
      .prepare(`
        SELECT r.name, r.email, e.title AS event_title, r.registered_at
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        ORDER BY r.registered_at DESC
        LIMIT 5
      `)
      .all();

    res.json({
      total_events,
      total_registrations,
      upcoming_events,
      recent_registrations,
    });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
