import { randomUUID } from 'node:crypto';
import db from './db.js';
import * as core from './crypto.js';
import { encField } from './crypto.js';

// Shared dev password for DEARSAFE_DEV mode (you + a tester). NOT for production.
export const DEV_PASSWORD = 'dearsafe';

const SAMPLE = [
  {
    date: '2026-06-28', theme: 'beach', mood: '😄', tags: ['beach', 'family'],
    title: 'A day at the shore',
    body: 'Woke up early and drove out to the coast 🐚. The water was freezing but so worth it — we found the prettiest little tide pools. Built a lopsided sandcastle, ate too many snacks, came home sandy and happy 💛.',
  },
  {
    date: '2026-06-27', theme: 'plain', mood: '🙂', tags: ['soap', 'projects'],
    title: 'Soap batch #14 — lavender',
    body: 'Lavender + a touch of chamomile. Lye temp 105°F, oils 110°F, traced in ~4 min. Poured into the wooden mold — smells amazing.',
  },
  {
    date: '2026-06-25', theme: 'rain', mood: '😌', tags: ['journal'],
    title: 'Quiet rainy afternoon',
    body: 'Tea, a good book, and rain on the window. Some days that is the whole entry. ☔',
  },
];

// In DEV mode: auto-create the keyring (so the shared password works) and seed entries.
export function devSeed() {
  if (!core.isSetup()) core.setup(DEV_PASSWORD);
  const dek = core.unlock(DEV_PASSWORD);
  if (!dek) return;
  const count = db.prepare('SELECT COUNT(*) AS c FROM entries').get().c;
  if (count > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO entries (id, entry_date, created_at, updated_at, theme, accent, font,
       title_enc, body_enc, mood_enc, tags_enc, location_enc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const s of SAMPLE) {
    insert.run(
      randomUUID(), s.date, now, now, s.theme, null, null,
      encField(dek, s.title), encField(dek, s.body),
      encField(dek, s.mood), encField(dek, s.tags), null
    );
  }
  console.log(`[dev] seeded ${SAMPLE.length} sample entries (password: "${DEV_PASSWORD}")`);
}
