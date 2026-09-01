import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openKicc(page) {
  await page.route('http://127.0.0.1:8765/**', route => route.abort('connectionrefused'));
  await page.goto('/?e2e=1#dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

test.describe('KICC Tiefenprüfung · 50 Tests', () => {
  test.beforeEach(async ({ page }) => { await openKicc(page); });

  // 01–10 · Grundstruktur
  test('01 Titel ist KICC', async ({ page }) => { await expect(page).toHaveTitle(/KC (?:Infrastructure Control Center|INFRA LEITSTAND)/i); });
  test('02 Versionsanzeige ist vorhanden', async ({ page }) => { await expect(page.locator('#version')).not.toHaveText(''); });
  test('03 genau 15 Fachregister vorhanden', async ({ page }) => { await expect(page.locator('[data-kicc-tab]')).toHaveCount(15); });
  test('04 genau ein Fachregister ist sichtbar', async ({ page }) => { await expect(page.locator('[data-kicc-panel]:not([hidden])')).toHaveCount(1); });
  test('05 Dashboard ist initial sichtbar', async ({ page }) => { await expect(page.locator('[data-kicc-panel="dashboard"]')).toBeVisible(); });
  test('06 Gesamtstatus-Anzeige vorhanden', async ({ page }) => { await expect(page.locator('#systemState')).toBeVisible(); });
  test('07 KPI-Bereich vorhanden', async ({ page }) => { await expect(page.locator('#kpis')).toBeAttached(); });
  test('08 Topologie-Bereich vorhanden', async ({ page }) => { await expect(page.locator('#topology')).toBeAttached(); });
  test('09 Handlungsbedarf-Bereich vorhanden', async ({ page }) => { await expect(page.locator('#actions')).toBeAttached(); });
  test('10 Dashboard-Instrumente vorhanden', async ({ page }) => { await expect(page.locator('#dashboardInstruments')).toBeAttached(); });

  // 11–20 · Navigation
  const navCases = [
    ['11','live','Live-Leitwarte'],['12','programs','Programme'],['13','explorer','Git / Explorer'],['14','internet','Internet & Netzwerk'],
    ['15','databases','Datenbanken'],['16','security','Security'],['17','backup','Backup & Failover'],['18','migration','Migration'],
    ['19','tests','TÜV & Tests'],['20','admin','Administration']
  ];
  for (const [n,key,label] of navCases) {
    test(`${n} Navigation ${label}`, async ({ page }) => {
      await page.locator(`[data-kicc-tab="${key}"]`).click();
      await expect(page.locator(`[data-kicc-panel="${key}"]`)).toBeVisible();
      await expect(page.locator('[data-kicc-panel]:not([hidden])')).toHaveCount(1);
    });
  }

  // 21–30 · Runtime / Truthfulness
  test('21 KICC Runtime ist geladen', async ({ page }) => { expect(await page.evaluate(() => Boolean(globalThis.KICC))).toBe(true); });
  test('22 Heartbeat Runtime ist geladen', async ({ page }) => { expect(await page.evaluate(() => Boolean(globalThis.KICC_PROGRAM_HEARTBEATS))).toBe(true); });
  test('23 alter Heartbeat wird verworfen', async ({ page }) => { expect(await page.evaluate(() => globalThis.KICC_PROGRAM_HEARTBEATS.fresh({ measuredAt:new Date(Date.now()-91000).toISOString() }))).toBe(false); });
  test('24 Zukunfts-Heartbeat wird verworfen', async ({ page }) => { expect(await page.evaluate(() => globalThis.KICC_PROGRAM_HEARTBEATS.fresh({ measuredAt:new Date(Date.now()+20000).toISOString() }))).toBe(false); });
  test('25 Flow Runtime ist geladen', async ({ page }) => { expect(await page.evaluate(() => Boolean(globalThis.KICC_PROGRAM_FLOWS))).toBe(true); });
  test('26 alter Flow wird verworfen', async ({ page }) => { expect(await page.evaluate(() => globalThis.KICC_PROGRAM_FLOWS.fresh({ measuredAt:new Date(Date.now()-121000).toISOString() }))).toBe(false); });
  test('27 Zukunfts-Flow wird verworfen', async ({ page }) => { expect(await page.evaluate(() => globalThis.KICC_PROGRAM_FLOWS.fresh({ measuredAt:new Date(Date.now()+20000).toISOString() }))).toBe(false); });
  test('28 Programm ohne Evidenz bleibt UNKNOWN', async ({ page }) => { expect(await page.evaluate(() => globalThis.KICC_DASHBOARD_INSTRUMENTS?.programStatus?.({id:'__pw_missing__'}))).toBe('UNKNOWN'); });
  test('29 Failover-ready verlangt OBSERVED_REMOTE', async ({ page }) => { const x=await page.evaluate(() => { const h=globalThis.KICC_MIRROR?.health?.(); const f=globalThis.KICC_MIRROR?.flow; return !h?.readyForFailover || f?.trust==='OBSERVED_REMOTE'; }); expect(x).toBe(true); });
  test('30 finale interne Regression ist aufrufbar', async ({ page }) => { const r=await page.evaluate(async () => { const m=await import('/tests/final-regression.js'); return await m.runFinalRegression(); }); expect(r.profile).toBe('KICC_FINAL_REGRESSION_TUEV'); expect(r.total).toBeGreaterThanOrEqual(15); });

  // 31–40 · Assets / Module
  const assets = [['31','/manifest.webmanifest'],['32','/sw.js'],['33','/app.js'],['34','/network/internet-monitor-shell.js'],['35','/network/internet-instrument-strip.js'],['36','/sync/mirror-monitor.js'],['37','/sync/mirror-morning-report.js'],['38','/tests/runtime-smoke.js'],['39','/tests/final-regression.js'],['40','/runtime/startup-readiness.js']];
  for (const [n,path] of assets) test(`${n} Asset ${path} ist auslieferbar`, async ({ request }) => { const r=await request.get(path); expect(r.ok(), `${path} HTTP ${r.status()}`).toBe(true); });

  // 41–50 · Robustheit, UI, Accessibility
  test('41 keine doppelten DOM-IDs', async ({ page }) => { const dups=await page.evaluate(() => { const a=[...document.querySelectorAll('[id]')].map(x=>x.id); return a.filter((x,i)=>a.indexOf(x)!==i); }); expect([...new Set(dups)]).toEqual([]); });
  test('42 genau 15 Tabpanels vorhanden', async ({ page }) => { await expect(page.locator('[data-kicc-panel]')).toHaveCount(15); });
  test('43 nur ein Panel hat hidden=false', async ({ page }) => { await expect(page.locator('[data-kicc-panel]:not([hidden])')).toHaveCount(1); });
  test('44 alle 15 Navigationselemente haben role=tab', async ({ page }) => { await expect(page.locator('[data-kicc-tab][role="tab"]')).toHaveCount(15); });
  test('45 jedes Register besitzt ein passendes Panel', async ({ page }) => { const ok=await page.evaluate(() => [...document.querySelectorAll('[data-kicc-tab]')].every(t=>document.querySelector(`[data-kicc-panel="${t.dataset.kiccTab}"]`))); expect(ok).toBe(true); });
  test('46 Internetbereich rendert vier Rundinstrumente', async ({ page }) => { await page.locator('[data-kicc-tab="internet"]').click(); await page.waitForTimeout(800); await expect(page.locator('#internetInstrumentStrip .internet-instrument')).toHaveCount(4); });
  test('47 Morgenreport hat sichtbaren Zustand', async ({ page }) => { const body=page.locator('#mirrorMorningReport [data-mmr-body]'); await expect(body).toBeAttached(); await expect(body).not.toHaveText(''); });
  test('48 Runtime-Smoke liefert ein Prüfprofil', async ({ page }) => { const r=await page.evaluate(async () => await globalThis.KICC_RUNTIME_SMOKE?.run?.()); expect(r?.profile).toBe('KICC_RUNTIME_SMOKE_FINAL'); expect(r?.total).toBeGreaterThan(20); });
  test('49 Axe findet keine kritischen Accessibility-Verstöße', async ({ page }) => { const result=await new AxeBuilder({page}).analyze(); const critical=result.violations.filter(v=>v.impact==='critical'); expect(critical.map(v=>v.id)).toEqual([]); });
  test('50 Mobile-Viewport erzeugt keinen starken horizontalen Überlauf', async ({ page }) => { await page.setViewportSize({width:390,height:844}); await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(800); const dims=await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})); expect(dims.scroll-dims.client).toBeLessThanOrEqual(8); });
});
