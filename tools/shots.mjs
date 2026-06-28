// Capture DearSafe UI screenshots for self-verification + the README gallery.
// Usage: node shots.mjs   (dev server must be running; set BASE to override)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3600';
const DEV_PASSWORD = process.env.DEV_PASSWORD || 'dearsafe';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots');
const PHONE = { width: 414, height: 896 };

const SHOTS = [
  { name: 'lock', path: '/', theme: 'light' },
  { name: 'editor', path: '/today', theme: 'light' },
  { name: 'editor-dark', path: '/today', theme: 'dark' },
  { name: 'calendar', path: '/calendar', theme: 'light' },
  { name: 'calendar-dark', path: '/calendar', theme: 'dark' },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const s of SHOTS) {
  const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2 });
  await ctx.addInitScript((theme) => localStorage.setItem('dearsafe-theme', theme), s.theme);
  // In-app pages need an unlocked session; the lock screen must stay locked.
  if (s.path !== '/') {
    await ctx.request.post(BASE + '/api/auth/unlock', { data: { password: DEV_PASSWORD } });
  }
  const page = await ctx.newPage();
  await page.goto(BASE + s.path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500); // let fonts/gradients settle
  const file = join(OUT, `${s.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('saved', file);
  await ctx.close();
}

await browser.close();
console.log('done');
