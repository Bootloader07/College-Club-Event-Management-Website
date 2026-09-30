# Architecture — College Club Event Management System

## Overview

A full-stack web application with a public-facing student side and a protected admin dashboard. The frontend is a React SPA; the backend is a Node.js/Express REST API backed by SQLite (development) with a clean migration path to PostgreSQL for production.

---

## Tech Stack

| Layer        | Technology                        | Reason                                              |
|--------------|-----------------------------------|-----------------------------------------------------|
| Frontend     | React (Vite)                      | Component reuse, fast dev server, easy build output |
| Styling      | Plain CSS (CSS Variables)         | No framework lock-in, full design control           |
| Backend      | Node.js + Express                 | Lightweight REST API, wide ecosystem                |
| Database     | SQLite → PostgreSQL               | Zero-config locally; swap DSN for production        |
| ORM          | better-sqlite3 (raw SQL)          | Predictable, no magic, fast on SQLite               |
| Auth         | JWT + bcrypt                      | Stateless admin sessions, secure password storage   |
| Deployment   | Render (API) + Vercel (Frontend)  | Free tiers, automatic deploys from GitHub           |

---

## Folder Structure

```
college-events/
│
├── client/                          # React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx                 # App entry point
│       ├── App.jsx                  # Router setup
│       ├── api/
│       │   ├── events.js            # Event API calls
│       │   ├── registrations.js     # Registration API calls
│       │   └── auth.js              # Login API call
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── EventCard.jsx
│       │   ├── RegistrationModal.jsx
│       │   ├── SearchFilter.jsx
│       │   └── FeaturedEvent.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Events.jsx
│       │   ├── EventDetail.jsx
│       │   └── admin/
│       │       ├── Login.jsx
│       │       ├── Dashboard.jsx
│       │       ├── ManageEvents.jsx
│       │       └── Registrations.jsx
│       └── styles/
│           ├── global.css
│           ├── navbar.css
│           ├── home.css
│           ├── events.css
│           └── admin.css
│
├── server/                          # Express backend
│   ├── index.js                     # Entry point, middleware setup
│   ├── db.js                        # SQLite connection + schema init
│   ├── seed.js                      # Optional: seed test data
│   ├── routes/
│   │   ├── events.js                # Public + admin event routes
│   │   ├── registrations.js         # Public POST + admin GET routes
│   │   └── auth.js                  # Admin login route
│   └── middleware/
│       └── requireAuth.js           # JWT verification middleware
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Schema

### Table: events

```sql
CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  category    TEXT    NOT NULL,           -- e.g. 'Technical', 'Cultural', 'Sports', 'Workshop'
  date        TEXT    NOT NULL,           -- ISO 8601: '2025-03-15'
  time        TEXT    NOT NULL,           -- '14:00'
  venue       TEXT    NOT NULL,
  image_url   TEXT,                       -- External URL or relative path
  capacity    INTEGER DEFAULT 100,
  is_featured INTEGER DEFAULT 0,         -- 0 or 1
  created_at  TEXT    DEFAULT (datetime('now'))
);
```

### Table: registrations

```sql
CREATE TABLE registrations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  college      TEXT    NOT NULL,
  year         TEXT    NOT NULL,          -- '1st Year', '2nd Year', etc.
  phone        TEXT    NOT NULL,
  registered_at TEXT   DEFAULT (datetime('now')),
  UNIQUE(event_id, email)                 -- Prevent duplicate registrations
);
```

### Table: admins

```sql
CREATE TABLE admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL
);
```

---

## API Routes

### Public Routes (No Auth)

| Method | Endpoint                  | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | `/api/events`             | All events. Query: `?search=&category=`  |
| GET    | `/api/events/featured`    | The featured event                       |
| GET    | `/api/events/:id`         | Single event detail                      |
| POST   | `/api/registrations`      | Submit a registration                    |
| POST   | `/api/auth/login`         | Admin login → returns JWT                |

### Protected Routes (JWT Required)

| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| POST   | `/api/admin/events`                | Create new event               |
| PUT    | `/api/admin/events/:id`            | Edit event                     |
| DELETE | `/api/admin/events/:id`            | Delete event                   |
| PUT    | `/api/admin/events/:id/feature`    | Toggle featured status         |
| GET    | `/api/admin/registrations`         | All registrations              |
| GET    | `/api/admin/registrations/:eventId`| Registrations for one event    |

---

## Auth Flow

```
Admin enters credentials
  → POST /api/auth/login
  → bcrypt.compare(password, hash)
  → returns { token: JWT (24h expiry) }
  → Frontend stores token in localStorage
  → All /admin/* requests send: Authorization: Bearer <token>
  → requireAuth middleware verifies token on every protected route
  → 401 response clears token and redirects to /admin/login
```

---

## Frontend Routing

```
/                    → Home (hero + upcoming events + featured)
/events              → All events (search + filter)
/events/:id          → Event detail + registration modal
/admin/login         → Admin login
/admin               → Dashboard (stats overview)
/admin/events        → Manage events (add / edit / delete)
/admin/registrations → View all registrations
```

---

## Design System

| Token           | Value                  | Usage                         |
|-----------------|------------------------|-------------------------------|
| `--color-base`  | `#0F1B35`              | Page background, nav          |
| `--color-accent`| `#4F46E5`              | Buttons, links, highlights    |
| `--color-amber` | `#F59E0B`              | Featured event, badges        |
| `--color-surface` | `#1A2744`            | Cards, modals                 |
| `--color-text`  | `#F9F8F5`              | Primary text                  |
| `--color-muted` | `#94A3B8`              | Secondary text, placeholders  |
| `--font-heading`| Plus Jakarta Sans      | All headings                  |
| `--font-body`   | Inter                  | Body, labels, forms           |
| `--radius`      | `8px`                  | Cards, inputs                 |
| `--radius-lg`   | `16px`                 | Modals, featured banner       |

---

## Environment Variables

```env
# server/.env
PORT=5000
JWT_SECRET=your_super_secret_key
DB_PATH=./database.db

# client/.env
VITE_API_URL=http://localhost:5000
```

---

## Deployment Checklist

- [ ] Push to GitHub (separate client/ and server/ or monorepo)
- [ ] Deploy server on Render (set env vars in dashboard)
- [ ] Deploy client on Vercel (set `VITE_API_URL` to Render URL)
- [ ] Seed one admin account via `node server/seed.js`
- [ ] Test all routes in production
- [ ] Add CORS origin whitelist (Vercel URL only)
