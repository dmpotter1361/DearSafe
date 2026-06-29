import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import db from '../db.js';
import { encField, decField } from '../crypto.js';
import { requireUnlocked } from '../auth.js';

const r = Router();
r.use(requireUnlocked); // every entries route needs an unlocked session (DEK in memory)

function toEntry(row, dek) {
  return {
    id: row.id,
    date: row.entry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    theme: row.theme,
    paper: row.paper || 'plain',
    accent: row.accent,
    font: row.font,
    title: decField(dek, row.title_enc),
    body: decField(dek, row.body_enc),
    mood: decField(dek, row.mood_enc),
    tags: decField(dek, row.tags_enc) || [],
    location: decField(dek, row.location_enc),
  };
}

// List live entries (newest first).
r.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM entries WHERE deleted_at IS NULL ORDER BY entry_date DESC, created_at DESC')
    .all();
  res.json(rows.map((row) => toEntry(row, req.dek)));
});

r.get('/trash', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM entries WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
    .all();
  res.json(rows.map((row) => toEntry(row, req.dek)));
});

r.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(toEntry(row, req.dek));
});

r.post('/', (req, res) => {
  const { date, title, body, mood, tags, location, theme, paper, accent, font } = req.body || {};
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO entries (id, entry_date, created_at, updated_at, theme, paper, accent, font,
       title_enc, body_enc, mood_enc, tags_enc, location_enc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, date || now.slice(0, 10), now, now, theme || 'plain', paper || 'plain', accent || null, font || null,
    encField(req.dek, title ?? ''), encField(req.dek, body ?? null),
    encField(req.dek, mood ?? null), encField(req.dek, tags || []),
    encField(req.dek, location ?? null)
  );
  res.json({ id });
});

r.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const { date, title, body, mood, tags, location, theme, paper, accent, font } = req.body || {};
  db.prepare(
    `UPDATE entries SET entry_date = ?, updated_at = ?, theme = ?, paper = ?, accent = ?, font = ?,
       title_enc = ?, body_enc = ?, mood_enc = ?, tags_enc = ?, location_enc = ? WHERE id = ?`
  ).run(
    date ?? row.entry_date, new Date().toISOString(),
    theme ?? row.theme, paper ?? row.paper, accent ?? row.accent, font ?? row.font,
    title !== undefined ? encField(req.dek, title) : row.title_enc,
    body !== undefined ? encField(req.dek, body) : row.body_enc,
    mood !== undefined ? encField(req.dek, mood) : row.mood_enc,
    tags !== undefined ? encField(req.dek, tags) : row.tags_enc,
    location !== undefined ? encField(req.dek, location) : row.location_enc,
    req.params.id
  );
  res.json({ ok: true });
});

// Soft delete -> trash.
r.delete('/:id', (req, res) => {
  db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
  res.json({ ok: true });
});

r.post('/:id/restore', (req, res) => {
  db.prepare('UPDATE entries SET deleted_at = NULL WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
