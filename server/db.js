import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';

// node:sqlite is built into Node 24+ — no npm install required.
const dbPath = process.env.VERCEL ? '/tmp/database.db' : (process.env.DB_PATH ?? './database.db');
const db = new DatabaseSync(dbPath);

// WAL mode for better concurrent read performance
db.exec("PRAGMA journal_mode = WAL");
// Enforce ON DELETE CASCADE and other FK constraints
db.exec("PRAGMA foreign_keys = ON");

// ─── SCHEMA INITIALIZATION ────────────────────────────────────────────────────
// All three tables are created here if they don't already exist.
// Safe to run every server startup — CREATE TABLE IF NOT EXISTS is idempotent.

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    date        TEXT    NOT NULL,           -- ISO 8601 date: '2025-03-15'
    time        TEXT    NOT NULL,           -- 24h time: '14:00'
    venue       TEXT    NOT NULL,
    image_url   TEXT,                       -- Optional external URL
    capacity    INTEGER DEFAULT 100,
    ticket_price REAL DEFAULT 0,
    is_featured INTEGER DEFAULT 0,          -- 0 or 1; only ONE event featured at a time
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL,
    college       TEXT    NOT NULL,
    year          TEXT    NOT NULL,         -- '1st Year', '2nd Year', etc.
    phone         TEXT    NOT NULL,
    registered_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(event_id, email)                 -- DB-level duplicate prevention
  );

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    college       TEXT    NOT NULL,
    year          TEXT    NOT NULL,
    phone         TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
  );
`);

// Add ticket_price column to existing databases if missing
try {
  db.exec("ALTER TABLE events ADD COLUMN ticket_price REAL DEFAULT 0;");
} catch (e) {
  // column already exists
}

/**
 * transaction(fn) — wraps fn in BEGIN/COMMIT/ROLLBACK.
 * Mirrors the db.transaction() API from better-sqlite3 so the rest of the
 * codebase reads identically to the original spec.
 *
 * Usage:
 *   const register = transaction(db, (data) => { ... return result; });
 *   register(data);  // auto-commits; throws & rolls back on error
 */
export function transaction(fn) {
  return function (...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

export default db;
