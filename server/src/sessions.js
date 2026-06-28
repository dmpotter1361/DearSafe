import { randomUUID } from 'node:crypto';

// In-memory DEK store: the decryption key lives ONLY here while unlocked.
// Evicted on lock, logout, auto-lock timeout, or server restart.
const sessions = new Map(); // sid -> { dek, expires? }
const DEV = process.env.DEARSAFE_DEV === 'true';
const TTL_MS = (Number(process.env.LOCK_MINUTES) || 15) * 60 * 1000;

export function createSession(dek) {
  const sid = randomUUID();
  sessions.set(sid, DEV ? { dek } : { dek, expires: Date.now() + TTL_MS });
  return sid;
}

export function getDek(sid) {
  const s = sid && sessions.get(sid);
  if (!s) return null;
  if (s.expires && Date.now() > s.expires) {
    sessions.delete(sid);
    return null;
  }
  if (s.expires) s.expires = Date.now() + TTL_MS; // sliding auto-lock
  return s.dek;
}

export const clearSession = (sid) => sessions.delete(sid);
