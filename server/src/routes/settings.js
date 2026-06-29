import { Router } from 'express';
import db from '../db.js';
import { encrypt, decrypt } from '../crypto.js';
import { requireUnlocked } from '../auth.js';

// Small per-owner preferences (e.g. the app wallpaper), stored as a single
// AES-256-GCM JSON blob under the DEK. Readable only while unlocked.
const r = Router();
r.use(requireUnlocked);

const KEY = 'prefs';
const ALLOWED = new Set(['wallpaper']);

function readPrefs(dek) {
  const row = db.prepare('SELECT value_enc FROM settings WHERE key = ?').get(KEY);
  if (!row || !row.value_enc) return {};
  try { return JSON.parse(decrypt(dek, row.value_enc)); } catch { return {}; }
}

r.get('/', (req, res) => {
  res.json(readPrefs(req.dek));
});

// Merge the posted keys (whitelisted) into the stored prefs.
r.put('/', (req, res) => {
  const prefs = readPrefs(req.dek);
  for (const [k, v] of Object.entries(req.body || {})) {
    if (ALLOWED.has(k)) prefs[k] = v;
  }
  db.prepare(
    `INSERT INTO settings (key, value_enc, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_enc = excluded.value_enc, updated_at = excluded.updated_at`
  ).run(KEY, encrypt(req.dek, JSON.stringify(prefs)), new Date().toISOString());
  res.json(prefs);
});

export default r;
