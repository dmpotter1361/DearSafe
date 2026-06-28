import { Router } from 'express';
import * as core from '../crypto.js';
import { createSession, getDek, clearSession } from '../sessions.js';
import { setSessionCookie, clearSessionCookie, readSid } from '../auth.js';

const r = Router();
const DEV = process.env.DEARSAFE_DEV === 'true';

r.get('/status', (req, res) => {
  const sid = readSid(req);
  res.json({ setup: core.isSetup(), unlocked: !!getDek(sid), dev: DEV });
});

r.post('/unlock', (req, res) => {
  if (!core.isSetup()) return res.status(409).json({ error: 'not set up' });
  const dek = core.unlock((req.body?.password) || '');
  if (!dek) return res.status(401).json({ error: 'wrong password' });
  setSessionCookie(res, createSession(dek));
  res.json({ ok: true });
});

// Recover with the recovery key; optionally set a new password in the same step.
r.post('/recover', (req, res) => {
  const { recoveryKey, newPassword } = req.body || {};
  const dek = core.unlockWithRecovery((recoveryKey || '').trim());
  if (!dek) return res.status(401).json({ error: 'invalid recovery key' });
  if (newPassword) {
    if (newPassword.length < 6) return res.status(400).json({ error: 'password too short' });
    core.changePassword(dek, newPassword);
  }
  setSessionCookie(res, createSession(dek));
  res.json({ ok: true });
});

r.post('/lock', (req, res) => {
  clearSession(readSid(req));
  res.json({ ok: true });
});

r.post('/logout', (req, res) => {
  clearSession(readSid(req));
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default r;
