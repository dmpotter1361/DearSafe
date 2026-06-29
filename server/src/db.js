import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// All persistent data lives under DATA_DIR (gitignored; a Docker volume in prod).
export const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'dearsafe.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  -- Single-row keyring: how to derive the key + the wrapped Data Encryption Key (DEK).
  CREATE TABLE IF NOT EXISTS keyring (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    kdf         TEXT NOT NULL,            -- key-derivation function name
    kdf_params  TEXT NOT NULL,            -- JSON of cost params
    pw_salt     TEXT NOT NULL,            -- salt for the password KEK
    dek_pw      TEXT NOT NULL,            -- DEK wrapped by the password-derived key
    rec_salt    TEXT NOT NULL,            -- salt for the recovery KEK
    dek_rec     TEXT NOT NULL,            -- DEK wrapped by the recovery-derived key
    created_at  TEXT NOT NULL
  );

  -- Entries. Personal fields are AES-256-GCM ciphertext (title/body/mood/tags/location).
  -- Plaintext metadata (date, theme) is kept for the calendar + decorative rendering.
  CREATE TABLE IF NOT EXISTS entries (
    id          TEXT PRIMARY KEY,
    entry_date  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,                     -- soft-delete (trash); NULL = live
    theme       TEXT DEFAULT 'plain',
    accent      TEXT,
    font        TEXT,
    title_enc   TEXT,
    body_enc    TEXT,
    mood_enc    TEXT,
    tags_enc    TEXT,
    location_enc TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date);
  CREATE INDEX IF NOT EXISTS idx_entries_live ON entries(deleted_at);

  -- Media: encrypted blobs on disk (DATA_DIR/media/<id>.bin). Only metadata in the DB.
  CREATE TABLE IF NOT EXISTS media (
    id          TEXT PRIMARY KEY,
    entry_id    TEXT,
    kind        TEXT DEFAULT 'photo',
    mime        TEXT NOT NULL,
    size        INTEGER NOT NULL,
    created_at  TEXT NOT NULL
  );

  -- Generic settings: small per-owner values, AES-256-GCM ciphertext under the DEK
  -- (e.g. the .ics calendar feed URL, the app wallpaper). Readable only while unlocked.
  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value_enc   TEXT,
    updated_at  TEXT NOT NULL
  );
`);

// Lightweight migration: add the per-entry paper style (plain | lined | dotted | grid).
const entryCols = db.prepare('PRAGMA table_info(entries)').all().map((c) => c.name);
if (!entryCols.includes('paper')) {
  db.exec("ALTER TABLE entries ADD COLUMN paper TEXT DEFAULT 'plain'");
}

export default db;
