# Changelog

All notable changes to DearSafe are documented here.
This project follows [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

## [0.2.0] — 2026-06-28

### Added
- **Rich-text editor (TipTap):** bold, italic, underline, strikethrough, headings,
  bulleted/numbered lists, text color, highlight, links, alignment — plus an emoji picker.
  Entry bodies are stored as HTML, encrypted at rest like everything else.
- **Inline photos:** add a photo straight into an entry. Images are downscaled and
  re-encoded client-side (strips EXIF/GPS), uploaded, then **AES-256-GCM encrypted on the
  server** and served decrypted only to an unlocked session.

## [0.1.0] — 2026-06-28

### Added
- Project scaffold: root tooling, generic `.env.example`, `.gitignore`, GPL-3.0 license.
- Visual, image-driven README with a screens gallery.
- Concept & design documents (`/concept`).
- **Encryption core:** passphrase-unlocked AES-256-GCM at rest; one-time recovery card.
- **Entries:** encrypted CRUD, multiple per day, soft-delete trash, tags, mood, themes.
- React + Vite client (pastel light/dark, lock/setup, editor, calendar); Express + SQLite.
- Dev mode (shared login + seed) for collaborative testing.
- Single Docker image + optional Caddy HTTPS; deployed live.

---

_Versioning starts at `0.1.0`. The first tagged release will land once the MVP
(encrypted entries, rich-text editor, inline media, pastel themes, search, calendar) is
usable end-to-end._
