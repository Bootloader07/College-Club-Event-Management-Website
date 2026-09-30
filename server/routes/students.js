import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import requireStudentAuth from '../middleware/requireStudentAuth.js';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signStudentToken(student) {
  return jwt.sign(
    { id: student.id, name: student.name, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeStudent(s) {
  return { id: s.id, name: s.name, email: s.email, college: s.college, year: s.year, phone: s.phone };
}

// ─── POST /api/students/register ─────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, email, password, college, year, phone } = req.body;

  // Validate all fields required
  if (!name || !email || !password || !college || !year || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // ABES email format validation
  const abesEmailRegex = /^[a-zA-Z]+\.[a-zA-Z0-9]+@abes\.ac\.in$/;
  if (!abesEmailRegex.test(email.trim())) {
    return res.status(400).json({
      error: 'Only ABES college emails are accepted (format: name.admissionno@abes.ac.in)',
    });
  }

  // Phone must be 10 digits
  if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Phone must be 10 digits' });
  }

  try {
    const password_hash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare(
        `INSERT INTO students (name, email, password_hash, college, year, phone)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(name.trim(), email.trim().toLowerCase(), password_hash, college.trim(), year, phone.trim());

    const student = db
      .prepare('SELECT * FROM students WHERE id = ?')
      .get(result.lastInsertRowid);

    const token = signStudentToken(student);
    return res.status(201).json({ token, student: safeStudent(student) });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Student register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── POST /api/students/login ─────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const student = db
    .prepare('SELECT * FROM students WHERE email = ?')
    .get(email.trim().toLowerCase());

  if (!student || !bcrypt.compareSync(password, student.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signStudentToken(student);
  return res.json({ token, student: safeStudent(student) });
});

// ─── GET /api/students/me/registrations ──────────────────────────────────────
router.get('/me/registrations', requireStudentAuth, (req, res) => {
  try {
    const registrations = db
      .prepare(
        `SELECT r.id, r.event_id, r.name, r.email, r.college, r.year, r.phone,
                r.registered_at,
                e.title AS event_title, e.date, e.time, e.venue,
                e.category, e.image_url
         FROM registrations r
         JOIN events e ON e.id = r.event_id
         WHERE r.email = ?
         ORDER BY r.registered_at DESC`
      )
      .all(req.student.email);

    return res.json(registrations);
  } catch (err) {
    console.error('Fetch my registrations error:', err);
    return res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

export default router;
