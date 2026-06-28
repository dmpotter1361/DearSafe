import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import db, { DATA_DIR } from '../db.js';
import { encryptBuffer, decryptBuffer } from '../crypto.js';
import { requireUnlocked } from '../auth.js';

const MEDIA_DIR = join(DATA_DIR, 'media');
mkdirSync(MEDIA_DIR, { recursive: true });

const blobPath = (id) => join(MEDIA_DIR, `${id}.bin`);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const r = Router();
r.use(requireUnlocked); // media is encrypted with the session DEK — must be unlocked

// Upload: encrypt the bytes with the DEK, store ciphertext on disk, metadata in DB.
r.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  if (!/^image\//.test(req.file.mimetype)) return res.status(400).json({ error: 'images only (v0.1)' });
  const id = randomUUID();
  writeFileSync(blobPath(id), encryptBuffer(req.dek, req.file.buffer));
  db.prepare(
    'INSERT INTO media (id, entry_id, kind, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.body.entryId || null, 'photo', req.file.mimetype, req.file.size, new Date().toISOString());
  res.json({ id, url: `/api/media/${id}` });
});

// Serve: decrypt on the fly (requires an unlocked session).
r.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  const path = blobPath(req.params.id);
  if (!row || !existsSync(path)) return res.status(404).end();
  try {
    const buf = decryptBuffer(req.dek, readFileSync(path));
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buf);
  } catch {
    res.status(500).end();
  }
});

r.delete('/:id', (req, res) => {
  try { unlinkSync(blobPath(req.params.id)); } catch { /* gone */ }
  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default r;
