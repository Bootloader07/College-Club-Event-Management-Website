import jwt from 'jsonwebtoken';

/**
 * requireStudentAuth — verifies the student Bearer JWT.
 * Attaches decoded payload to req.student on success.
 * Student JWTs carry { id, name, email } (no `username` field).
 */
export default function requireStudentAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Distinguish student tokens (have .email) from admin tokens (have .username)
    if (!decoded.email) {
      return res.status(401).json({ error: 'Unauthorized — invalid token type' });
    }

    req.student = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please log in again' });
    }
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}
