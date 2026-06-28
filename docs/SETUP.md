# DearSafe — Setup Guide

A step-by-step checklist to get your own DearSafe running. The **core journal needs only
Steps 1–4** (no Google, no special keys). Steps 5–7 are optional extras.

---

## 0. Prerequisites

| You need | Why | Check |
| --- | --- | --- |
| **Docker** + Docker Compose | runs the app in one container | `docker --version` |
| (dev only) **Node 20+** | local `npm run dev` | `node --version` |
| A machine reachable by your devices | so you can open it anywhere | — |

> Don't have Docker? Install **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux).

---

## 1. Get the code

```bash
git clone https://github.com/dmpotter1361/DearSafe.git
cd DearSafe
cp .env.example .env
```

## 2. Set your one required secret — `JWT_SECRET`

This signs your login session. Generate a long random value and paste it into `.env`:

```bash
# pick ONE:
openssl rand -hex 32                       # mac/linux/git-bash
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `.env` and set:

```ini
JWT_SECRET=<paste the long random string here>
PORT=3600          # change if 3600 is taken
```

## 3. Start it

```bash
docker compose up -d --build
```

Open **http://localhost:3600** (or `http://<server-ip>:3600`).

## 4. First-run setup (in the browser)

1. Choose a **master password** (this encrypts everything — pick a strong one).
2. **Save the recovery card** that's shown — download/copy it and keep it somewhere safe.
   > ⚠️ If you lose **both** your password and recovery card, your entries are
   > **unrecoverable by anyone**. That's the security guarantee, not a bug.
3. You're in. 🎉

✅ **That's the whole core setup.** Everything below is optional.

---

## 5. (Optional) HTTPS with your own domain

Point a domain (e.g. `journal.example`) at your server, then in `.env`:

```ini
DOMAIN=journal.example
APP_BASE_URL=https://journal.example
COOKIE_SECURE=true
```

If **this host owns ports 80/443**, use the built-in Caddy (auto Let's Encrypt cert):

```bash
docker compose --profile https up -d --build
```

If the host **already runs Caddy for other apps**, don't start a second one — add a block to
your existing Caddy instead:

```caddy
journal.example {
    encode zstd gzip
    reverse_proxy dearsafe-app:3600
}
```

## 6. (Optional) Calendar context — paste an `.ics` URL

To see "what was on my calendar that day," grab a **secret iCal URL** and paste it in
Settings. No keys, no OAuth:

- **Google Calendar:** Settings → *Settings for my calendars* → pick a calendar →
  *Integrate calendar* → **Secret address in iCal format**.
- **Apple iCloud:** calendar.icloud.com → share a calendar → *Public Calendar* → copy link
  (change `webcal://` to `https://`).
- **Outlook.com:** Settings → Calendar → *Shared calendars* → publish → copy the **ICS** link.

## 7. (Optional) Store video in your own Google Drive

Videos are big, so DearSafe can offload them (still encrypted) to a `DearSafe/Videos` folder
in **your** Google Drive. This needs a one-time, ~10-minute Google setup:

1. Go to **https://console.cloud.google.com** → create a project (any name).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen →** set it up (External; add yourself as a test user).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
5. Under **Authorized redirect URIs**, add exactly:
   ```
   <APP_BASE_URL>/api/drive/callback
   ```
   (e.g. `http://localhost:3600/api/drive/callback` or `https://journal.example/api/drive/callback`)
6. Copy the **Client ID** and **Client secret** into `.env`:
   ```ini
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
7. `docker compose up -d` again, then **Settings → Connect Google Drive**.

Leave these blank and all media simply stays local — totally fine.

---

## Development / testing mode

For trying things out (or sharing with a tester) without the full lock:

```ini
DEARSAFE_DEV=true
```

This enables a shared dev password (**`dearsafe`**), no auto-lock, and seed data, with a
visible "DEV MODE" banner. **Never put real private entries in a dev instance**, and unset it
for real use.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `set JWT_SECRET in your .env file` on `up` | You skipped Step 2 — set `JWT_SECRET` in `.env`. |
| Port already in use | Change `PORT` in `.env` (e.g. `3601`) and restart. |
| Logins fail over HTTPS | Set `COOKIE_SECURE=true` **and** `APP_BASE_URL=https://…`. |
| "locked" / can't load entries | Your session locked — just unlock again with your password. |
| Forgot password | Use your recovery card on the unlock screen. No card = no recovery, by design. |
| Update to a new version | `git pull && docker compose up -d --build`. Your data volume is preserved. |

Your data lives in the `dearsafe-data` Docker volume (DB + encrypted media). Back it up to
keep your journal safe from disk failure — the recovery card protects access, backups protect
the data itself.
