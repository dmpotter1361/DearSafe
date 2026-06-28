import crypto from 'node:crypto';
import db from './db.js';
import { deriveKey, KDF_NAME, KDF_PARAMS } from './kdf.js';

// ---- helpers ----
const b64 = (buf) => Buffer.from(buf).toString('base64');
const unb64 = (s) => Buffer.from(s, 'base64');

// AES-256-GCM, packed as base64( iv(12) | tag(16) | ciphertext ).
export function encrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(Buffer.from(plaintext, 'utf8')), c.final()]);
  return b64(Buffer.concat([iv, c.getAuthTag(), ct]));
}
export function decrypt(key, packed) {
  const buf = unb64(packed);
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

// Encrypt/decrypt a JSON-serializable field with the DEK (null passes through).
export const encField = (dek, value) => (value == null ? null : encrypt(dek, JSON.stringify(value)));
export const decField = (dek, packed) => (packed == null ? null : JSON.parse(decrypt(dek, packed)));

// ---- recovery key (160-bit, base32, grouped) ----
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
const canonicalRecovery = (s) => s.replace(/[^A-Za-z2-7]/g, '').toUpperCase();

// ---- keyring / setup state ----
export function isSetup() {
  return !!db.prepare('SELECT 1 FROM keyring WHERE id = 1').get();
}

export function setup(password) {
  if (isSetup()) throw new Error('already set up');
  const dek = crypto.randomBytes(32);
  const dekB64 = dek.toString('base64');

  const pwSalt = crypto.randomBytes(16);
  const pwKek = deriveKey(password, pwSalt);

  const canonical = base32(crypto.randomBytes(20)); // 32 chars
  const recoveryKey = canonical.match(/.{1,4}/g).join('-');
  const recSalt = crypto.randomBytes(16);
  const recKek = deriveKey(canonical, recSalt);

  db.prepare(
    `INSERT INTO keyring (id, kdf, kdf_params, pw_salt, dek_pw, rec_salt, dek_rec, created_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    KDF_NAME,
    JSON.stringify(KDF_PARAMS),
    b64(pwSalt),
    encrypt(pwKek, dekB64),
    b64(recSalt),
    encrypt(recKek, dekB64),
    new Date().toISOString()
  );
  return { recoveryKey };
}

// Returns the DEK (Buffer) on success, or null on a wrong password/recovery key.
export function unlock(password) {
  const row = db.prepare('SELECT * FROM keyring WHERE id = 1').get();
  if (!row) return null;
  const kek = deriveKey(password, unb64(row.pw_salt), JSON.parse(row.kdf_params));
  try {
    return unb64(decrypt(kek, row.dek_pw)); // GCM auth fails on wrong key
  } catch {
    return null;
  }
}

export function unlockWithRecovery(recoveryKey) {
  const row = db.prepare('SELECT * FROM keyring WHERE id = 1').get();
  if (!row) return null;
  const kek = deriveKey(canonicalRecovery(recoveryKey), unb64(row.rec_salt), JSON.parse(row.kdf_params));
  try {
    return unb64(decrypt(kek, row.dek_rec));
  } catch {
    return null;
  }
}

// Re-wrap the existing DEK under a new password (entries are NOT re-encrypted).
export function changePassword(dek, newPassword) {
  const pwSalt = crypto.randomBytes(16);
  const pwKek = deriveKey(newPassword, pwSalt);
  db.prepare('UPDATE keyring SET pw_salt = ?, dek_pw = ? WHERE id = 1').run(
    b64(pwSalt),
    encrypt(pwKek, dek.toString('base64'))
  );
}
