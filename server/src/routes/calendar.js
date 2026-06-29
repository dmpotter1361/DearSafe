import { Router } from 'express';
import db from '../db.js';
import { encrypt, decrypt } from '../crypto.js';
import { requireUnlocked } from '../auth.js';
import { parseICS, eventsForRange } from '../ical.js';

const r = Router();
r.use(requireUnlocked); // the feed URL is encrypted under the DEK

const FEED_KEY = 'ics_feed_url';
const CACHE_TTL = 10 * 60 * 1000; // refetch the .ics at most every 10 min
const cache = new Map(); // url -> { at, events }

function getFeedUrl(dek) {
  const row = db.prepare('SELECT value_enc FROM settings WHERE key = ?').get(FEED_KEY);
  if (!row || !row.value_enc) return null;
  try { return JSON.parse(decrypt(dek, row.value_enc)); } catch { return null; }
}

// GET the saved feed URL (or null). Returned to the owner's unlocked session only.
r.get('/feed', (req, res) => {
  res.json({ url: getFeedUrl(req.dek) });
});

// Save / replace the feed URL. Accepts http(s) or webcal.
r.put('/feed', (req, res) => {
  let url = (req.body?.url || '').trim();
  if (!url) return res.status(400).json({ error: 'url required' });
  url = url.replace(/^webcal:\/\//i, 'https://');
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'must be an http(s) or webcal URL' });
  db.prepare(
    `INSERT INTO settings (key, value_enc, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_enc = excluded.value_enc, updated_at = excluded.updated_at`
  ).run(FEED_KEY, encrypt(req.dek, JSON.stringify(url)), new Date().toISOString());
  cache.clear();
  res.json({ url });
});

r.delete('/feed', (req, res) => {
  db.prepare('DELETE FROM settings WHERE key = ?').run(FEED_KEY);
  cache.clear();
  res.json({ ok: true });
});

async function loadEvents(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.events;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!resp.ok) throw new Error(`feed responded ${resp.status}`);
    const text = await resp.text();
    const events = parseICS(text);
    cache.set(url, { at: Date.now(), events });
    return events;
  } finally {
    clearTimeout(timer);
  }
}

// List calendar events as context. Either ?date=YYYY-MM-DD (one day) or
// ?from=YYYY-MM-DD&to=YYYY-MM-DD (a range, e.g. a calendar month).
r.get('/events', async (req, res) => {
  const url = getFeedUrl(req.dek);
  if (!url) return res.json({ connected: false, events: [] });
  const date = req.query.date;
  const from = req.query.from || date;
  const to = req.query.to || date;
  if (!from || !to) return res.status(400).json({ error: 'date or from/to required' });
  try {
    const events = await loadEvents(url);
    res.json({ connected: true, events: eventsForRange(events, from, to) });
  } catch (e) {
    res.json({ connected: true, error: e.message || 'could not load feed', events: [] });
  }
});

export default r;
