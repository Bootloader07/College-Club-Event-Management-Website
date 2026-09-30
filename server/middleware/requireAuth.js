import 'dotenv/config';
import jwt from 'jsonwebtoken';

/**
 * requireAuth middleware
 *
 * Validates the Bearer JWT on every protected admin route.
 * On success: attaches the decoded payload to req.admin and calls next().
 * On failure: returns 401 with a human-readable error — the frontend
 *             detects this and redirects to /admin/login.
 */
export default function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please log in again' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}
