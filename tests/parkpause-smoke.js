// KICC-PARKPAUSE-PROTOTYP: Smoke-Test des ParkPause-Prototyps (parkpause/index.html)
// Aufruf: node tests/parkpause-smoke.js
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../parkpause/index.html');
const fail = (m) => { console.error('FEHLER:', m); process.exitCode = 1; };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + file);
await page.waitForSelector('.spot');

const total = await page.evaluate(() => {
  let n = 0; document.querySelectorAll('[data-act=level]').forEach(() => n++); return n;
});
if (total !== 2) fail('Erwartet 2 Ebenen, gefunden ' + total);
const level1 = await page.$$eval('.spot', (e) => e.length);
if (level1 !== 44) fail('Ebene -1 sollte 44 Plätze haben, hat ' + level1);
if (await page.$$eval('.spot.fest', (e) => e.length) !== 6) fail('6 Festplätze erwartet');
if (await page.$$eval('.spot.frei', (e) => e.length) < 1) fail('Mindestens ein grüner Platz erwartet');

// Reservieren: ganzer Zeitraum
await page.click('.spot.frei');
await page.fill('[name=kennz]', 'S-TT 1');
await page.click('[data-form=reserve] button[type=submit]');
if (!(await page.textContent('nav [aria-current]')).includes('Meine Reservierungen')) fail('Nach Anfrage nicht in „Meine Reservierungen“');
if (await page.$$eval('.chip.angefragt', (e) => e.length) < 1) fail('Anfrage nicht als offen gelistet');

// Inhaber schaltet frei
await page.click('[data-act=as][data-id=p24]');
await page.click('[data-act=approve]');
if (await page.$$eval('[data-act=approve]', (e) => e.length) !== 0) fail('Anfrage wurde nicht freigeschaltet');

// Admin: Besitzerwechsel planen
await page.click('[data-act=as][data-id=padmin]');
await page.click('[data-act=atab][data-id=plaetze]');
await page.click('[data-act=change]');
await page.selectOption('[name=p]', 'p85');
const ab = new Date(Date.now() + 5 * 864e5); const iso = ab.getFullYear() + '-' + String(ab.getMonth() + 1).padStart(2, '0') + '-' + String(ab.getDate()).padStart(2, '0');
await page.fill('[name=ab]', iso);
await page.click('[data-form=change] button[type=submit]');
if (await page.$$eval('[data-act=undoChange]', (e) => e.length) < 2) fail('Geplanter Besitzerwechsel fehlt');

// Handy-Breite: kein seitliches Scrollen der Seite
await page.setViewportSize({ width: 400, height: 800 });
await page.click('[data-act=tab][data-id=plan]');
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
if (sw > 400) fail('Seite scrollt seitlich (' + sw + ' px)');

if (errors.length) fail('Skriptfehler: ' + errors.join(' | '));
await browser.close();
console.log(process.exitCode ? 'ParkPause-Smoke-Test fehlgeschlagen' : 'ParkPause-Smoke-Test bestanden');
