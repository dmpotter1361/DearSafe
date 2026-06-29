import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3600;
const DEV = process.env.DEARSAFE_DEV === 'true';

// App version (from package.json) — surfaced to the client.
const pkg = JSON.parse(await readFile(join(__dirname, '..', 'package.json'), 'utf8'));

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// --- API ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) =>
  res.json({ version: pkg.version, dev: DEV, name: 'DearSafe' })
);

// Feature routes
import setupRoutes from './routes/setup.js';
import authRoutes from './routes/auth.js';
import entryRoutes from './routes/entries.js';
import mediaRoutes from './routes/media.js';
import calendarRoutes from './routes/calendar.js';
import settingsRoutes from './routes/settings.js';
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/settings', settingsRoutes);

// Dev mode: auto-create the keyring (shared password) + seed sample entries.
if (DEV) {
  const { devSeed } = await import('./seed.js');
  try { devSeed(); } catch (e) { console.warn('[dev] seed skipped:', e.message); }
}

// --- Static client (built into ./public by the Docker image) ---
const PUBLIC_DIR = join(__dirname, '..', 'public');
if (existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback: send index.html for any non-API GET.
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(PUBLIC_DIR, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`DearSafe v${pkg.version} listening on :${PORT}${DEV ? '  [DEV MODE — not secure]' : ''}`);
});
