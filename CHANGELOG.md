# Changelog

All notable changes to DearSafe are documented here.
This project follows [Semantic Versioning](https://semver.org) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

## [0.6.0] — 2026-06-28

### Added
- **Font family & size in the editor:** two toolbar dropdowns — Font (Default,
  Handwritten, Serif, Mono) and Size (S / M / L / XL) — apply to the selected text and
  are stored inline (encrypted at rest like the rest of the entry).

## [0.5.0] — 2026-06-28

### Added
- **Theme picker + more themes:** the per-entry background is now a 🎨 popover of
  **12 curated pastel themes** (Plain, Beach, Sky, Rain, Meadow, Forest, Floral, Sunset,
  Cozy, Sunny, Night, Starry) instead of a flat 4-chip row. Dark themes (Night, Starry)
  render a cozy translucent-dark card with light, readable text.

### Changed
- Themes are defined once in `client/src/themes.js` (shared by the editor and the calendar
  dots), so adding a theme is a one-line change.

### Added
- **Multi-photo storyboard editor:** add several photos to an entry at once, each as a
  captioned figure. Type a caption under any photo; **drag the handle to reorder**; remove
  with the ✕ button. Photos stay encrypted at rest (client-side downscale + EXIF strip).
- **Drag-and-drop & paste:** drop image files anywhere in an entry, or paste from the
  clipboard — they upload and insert at that spot.

### Changed
- Inline images now serialize as `<figure><img><figcaption>` (captioned). Legacy bare
  `<img>` entries (v0.2–0.3) still load fine, with an empty caption.

### Added
- **External calendar feed (`.ics`):** paste a read-only iCal URL (Google, Apple,
  Outlook all publish one) to see each day's events as context beside your entries.
  No OAuth or Google Cloud setup — just one link, encrypted at rest like everything else.
- **Editor context strip:** the day's calendar events show under the date while you write.
- **Calendar day view:** click any day to see your entries *and* that day's external
  events together; days with calendar events are marked with a 📅 on the month grid.
- Dependency-free `.ics` reader supporting all-day & timed events and common recurrence
  (daily/weekly/monthly/yearly, `INTERVAL`/`COUNT`/`UNTIL`/`BYDAY`, `EXDATE`).

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
