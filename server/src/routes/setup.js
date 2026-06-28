import { Router } from 'express';
import * as core from '../crypto.js';
import { createSession } from '../sessions.js';
import { setSessionCookie } from '../auth.js';

const r = Router();

r.get('/status', (_req, res) => res.json({ setup: core.isSetup() }));

// First-run setup: create the password + DEK + recovery key, then auto-unlock.
// Returns the recovery key ONCE — the client must show/save it.
r.post('/', (req, res) => {
  if (core.isSetup()) return res.status(409).json({ error: 'already set up' });
  const { password } = req.body || {};
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  const { recoveryKey } = core.setup(password);
  const dek = core.unlock(password);
  setSessionCookie(res, createSession(dek));
  res.json({ recoveryKey });
});

export default r;
