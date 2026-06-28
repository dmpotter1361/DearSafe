import crypto from 'node:crypto';

// Password/recovery-key -> 32-byte key.
// v0.1 uses Node's built-in scrypt (strong, zero native deps, builds everywhere).
// PLANNED HARDENING: swap to Argon2id here — this is the single place to change.
export const KDF_NAME = 'scrypt';
export const KDF_PARAMS = { N: 1 << 15, r: 8, p: 1, keylen: 32 };

export function deriveKey(secret, saltBuf, params = KDF_PARAMS) {
  return crypto.scryptSync(secret, saltBuf, params.keylen, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: 256 * 1024 * 1024,
  });
}
