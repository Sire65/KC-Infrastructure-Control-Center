// KICC-PARKPAUSE-APP: Oberflaechentest der echten App (parkpause/app) gegen eine Supabase-Attrappe.
// Prueft Anmeldung, Lageplan, Reservieren, alle Reiter und Admin-Bereiche, Platz eintragen, Handy-Breite.
// Aufruf: node tests/parkpause-app-smoke.js
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../parkpause/app/index.html');
const mock = fs.readFileSync(path.resolve(here, 'fixtures/parkpause-supabase-mock.js'), 'utf8');
const fail = (m) => { console.error('FEHLER:', m); process.exitCode = 1; };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/supabase.js', (r) => r.fulfill({ body: mock, contentType: 'text/javascript' }));
await page.route('**/config.js', (r) => r.fulfill({ body: 'window.PP_CONFIG={supabaseUrl:"https://x.supabase.co",supabaseKey:"k",vapidPublic:"BAAA"}', contentType: 'text/javascript' }));
await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
await page.goto('file://' + app);

await page.click('[data-act=authmode][data-id=reg]');
if (!(await page.$('[name=code]'))) fail('Registrierung ohne Einladungscode-Feld');
await page.click('[data-act=authmode][data-id=login]');
await page.fill('[name=pseudonym]', 'Blauer Golf');
await page.fill('[name=password]', 'geheim123');
await page.click('[data-form=login] [type=submit]');
await page.waitForSelector('.spot');
if ((await page.$$eval('.spot', (e) => e.length)) !== 12) fail('Ebene −1 sollte 12 Plätze zeigen');
if ((await page.$$eval('.spot.frei', (e) => e.length)) !== 1) fail('Ein grüner Platz erwartet');

await page.click('.spot.frei');
await page.click('[data-form=reserve] [type=submit]');
await page.waitForTimeout(200);
for (const t of ['frei', 'meine', 'mein', 'inbox', 'profil', 'admin']) { await page.click(`nav [data-act=tab][data-id=${t}]`); await page.waitForTimeout(80); }
for (const t of ['garage', 'plaetze', 'leute', 'einladung', 'design', 'regeln']) { await page.click(`[data-act=atab][data-id=${t}]`); await page.waitForTimeout(120); }
await page.click('nav [data-act=tab][data-id=profil]');
await page.click('[data-act=claimStart]');
await page.click('.spot.claimable');
await page.click('[data-form=claim] [type=submit]');
await page.waitForTimeout(150);

await page.setViewportSize({ width: 390, height: 800 });
await page.click('nav [data-act=tab][data-id=plan]');
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
if (sw > 390) fail('Seite scrollt seitlich (' + sw + ' px)');

const calls = await page.evaluate(() => window.__calls.map((c) => c[0] + ':' + c[1]));
for (const need of ['rpc:pp_request', 'fn:pp-push', 'rpc:pp_admin_invite', 'rpc:pp_claim_spot', 'rpc:pp_notes_read'])
  if (!calls.includes(need)) fail('Aufruf fehlt: ' + need);
if (!calls.some((c) => /^login:pp-[0-9a-f]{32}@parkpause\.invalid$/.test(c))) fail('Anmeldename wird nicht korrekt umgesetzt');
if (errors.length) fail('Skriptfehler: ' + errors.join(' | '));
await browser.close();
console.log(process.exitCode ? 'ParkPause-App-Test fehlgeschlagen' : 'ParkPause-App-Test bestanden');
