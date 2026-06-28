import jwt from 'jsonwebtoken';
import { getDek } from './sessions.js';

const COOKIE = 'ds_session';
const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';
const SECURE = process.env.COOKIE_SECURE === 'true';

export function setSessionCookie(res, sid) {
  const token = jwt.sign({ sid }, SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SECURE,
    maxAge: 30 * 24 * 3600 * 1000,
  });
}

export const clearSessionCookie = (res) => res.clearCookie(COOKIE);

export function readSid(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET).sid;
  } catch {
    return null;
  }
}

// Gate: the session must hold a live DEK in memory, else 423 Locked.
export function requireUnlocked(req, res, next) {
  const sid = readSid(req);
  const dek = getDek(sid);
  if (!dek) return res.status(423).json({ error: 'locked' });
  req.dek = dek;
  req.sid = sid;
  next();
}
