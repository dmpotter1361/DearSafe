# DearSafe — Security Model

DearSafe is built so your journal is **unreadable to anyone but you** — including whoever
runs the server. Here's how, in plain terms and in detail.

## The short version

- One **master password** unlocks your journal.
- Your entries (titles, bodies, moods, tags, locations, media) are stored as
  **AES-256-GCM ciphertext** on disk and in backups.
- The decryption key exists **only in the server's memory while you're logged in**. Lock,
  log out, idle-timeout, or restart the server and it's gone — the disk is just gibberish.
- There is **no backdoor and no password reset**. A one-time **recovery card** is your only
  spare key.

## How the key works

1. **Setup** generates a random 256-bit **Data Encryption Key (DEK)** — this is what actually
   encrypts your entries.
2. Your **master password** is run through a key-derivation function (scrypt in v0.1;
   Argon2id planned) to produce a **Key-Encryption Key (KEK)**.
3. The DEK is **wrapped** (encrypted) by the KEK and stored. Your password is never stored.
4. A random **recovery key** wraps the DEK a second way, so it can also open your journal.
5. **Unlock:** password → KEK → unwrap DEK → held in memory for the session only.

Changing your password just re-wraps the same DEK — your entries are never re-encrypted.

## What's encrypted vs. visible at rest

| Encrypted (ciphertext) | Plaintext (metadata) |
| --- | --- |
| title, body, mood, tags, location, media, OCR text | entry id, dates, timestamps, theme name |

Dates are kept readable so the calendar works. A stolen disk reveals *that* you journaled on
certain days — never *what* you wrote.

## Threats this protects against

- A **stolen or seized** server / drive.
- A **leaked or stolen backup**.
- Someone **copying the database file** or a cloud snapshot.
- (With HTTPS/Caddy) **interception in transit**.

## Honest limits

- This is **"encrypted at rest,"** not zero-knowledge: while you're logged in, the server
  decrypts your data into memory to show it to you and to search. An attacker with **live
  root access during an active session** could read that memory.
- **Lose your password *and* recovery card → your entries are gone.** No one can recover
  them. This is the cost of real privacy.

## Two different safety nets

| Problem | Solution |
| --- | --- |
| Forgot your password | **Recovery card** (a second key that also unlocks) |
| Disk died / server lost | **Backups** of the data volume (a recovery card can't help without the data) |

Keep both: the recovery card protects *access*, backups protect *the data itself*.
