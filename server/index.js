import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import route handlers
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import registrationsRouter from './routes/registrations.js';
import statsRouter from './routes/stats.js';
import studentsRouter from './routes/students.js';

const app = express();
const PORT = process.env.PORT ?? 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

// CORS — in production, restrict to the Vercel frontend URL via CLIENT_URL env var.
// In development, CLIENT_URL defaults to localhost:5173 (set in .env).
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── ROUTE MOUNTING ───────────────────────────────────────────────────────────
//
// Mount map — full resolved paths:
//
//  authRouter          → POST /api/auth/login
//
//  eventsRouter        → GET  /api/events
//                      → GET  /api/events/featured   ← registered BEFORE /:id
//                      → GET  /api/events/:id
//                      → POST /api/admin/events
//                      → PUT  /api/admin/events/:id
//                      → DEL  /api/admin/events/:id
//                      → PUT  /api/admin/events/:id/feature
//
//  registrationsRouter → POST /api/registrations
//                      → GET  /api/admin/registrations
//                      → GET  /api/admin/registrations/:eventId
//
//  statsRouter         → GET  /api/admin/stats

app.use('/api/auth', authRouter);
app.use('/api', eventsRouter);
app.use('/api', registrationsRouter);
app.use('/api/admin', statsRouter);
app.use('/api/students', studentsRouter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// Catches any error passed via next(err) or unhandled throws in sync routes.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
