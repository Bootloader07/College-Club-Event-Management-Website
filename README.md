# College Club Event Management System

A full-stack web app for managing college club events. Students can browse and register for events; admins can create, edit, delete, and feature events via a protected dashboard.

**Stack:** React (Vite) · Node.js + Express · SQLite (better-sqlite3) · JWT + bcrypt

---

## Quick Start

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server — copy the example and edit as needed
cp ../.env.example server/.env    # then set JWT_SECRET and ADMIN_PASSWORD

# Client — already configured for local dev (Vite proxy handles /api)
# No changes needed for development
```

### 3. Seed the Admin Account

```bash
cd server
npm run seed
# Output: ✅ Admin created — username: admin, password: admin123
```

### 4. Start Development Servers

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm run dev
```

Visit http://localhost:5173 to see the app.

---

## API Routes

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | All events. Supports `?search=` and `?category=` |
| `GET` | `/api/events/featured` | Featured event (fallback: nearest upcoming) |
| `GET` | `/api/events/:id` | Single event with `registrations_count` |
| `POST` | `/api/registrations` | Register a student for an event |
| `POST` | `/api/auth/login` | Admin login → returns JWT |
| `GET` | `/api/health` | Server health check |

### Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard stats |
| `POST` | `/api/admin/events` | Create event |
| `PUT` | `/api/admin/events/:id` | Update event |
| `DELETE` | `/api/admin/events/:id` | Delete event (cascades registrations) |
| `PUT` | `/api/admin/events/:id/feature` | Set as featured event |
| `GET` | `/api/admin/registrations` | All registrations (`?event_id=` `?search=`) |
| `GET` | `/api/admin/registrations/:eventId` | Registrations for one event |

---

## Project Structure

```
college-events/
├── client/                   React + Vite frontend
│   ├── src/
│   │   ├── api/              fetch() wrappers (events, registrations, auth)
│   │   ├── components/       Navbar, Footer, EventCard, RegistrationModal, …
│   │   ├── pages/            Home, Events, EventDetail, admin/*
│   │   └── styles/           global.css + per-page CSS
│   ├── vite.config.js
│   └── vercel.json           SPA rewrite rule
└── server/                   Express API
    ├── routes/               auth, events, registrations, stats
    ├── middleware/            requireAuth.js (JWT check)
    ├── db.js                 SQLite connection + schema init
    ├── seed.js               Admin account seeder
    └── index.js              Entry point
```

---

## Deployment

### Backend → Render

1. Push to GitHub
2. Create a new **Web Service** on Render pointing to the `server/` directory
3. Set environment variables in Render dashboard:
   - `JWT_SECRET` — long random string
   - `ADMIN_PASSWORD` — secure password
   - `CLIENT_URL` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
   - `DB_PATH` — `./database.db` (note: free tier storage is ephemeral)
4. Start command: `npm start`
5. After first deploy, run: `node seed.js` via Render shell

### Frontend → Vercel

1. Create a new project on Vercel pointing to the `client/` directory
2. Set environment variable: `VITE_API_URL` = your Render backend URL
3. Vercel auto-detects Vite — no build config needed
4. The `vercel.json` handles SPA routing (no 404 on hard refresh)

---

## Key Design Decisions

- **`bcryptjs`** (pure JS) over `bcrypt` (native) — avoids C++ build failures on Render free tier
- **Vite dev proxy** — `/api` → `localhost:5000` in development, so `VITE_API_URL` stays empty
- **`/events/featured` before `/:id`** — critical Express route order to prevent string capture
- **`registrations_count` on all event queries** — avoids an extra API call for seats-remaining display
- **Transaction-based capacity enforcement** — count + insert is atomic in better-sqlite3
