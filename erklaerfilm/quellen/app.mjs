// Echte Club-App mit erfundenen Demodaten öffnen (wie KC-Clubapp/tools/anleitung/basis.mjs) – es geht nichts an den echten Server
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
export const CLUB = process.env.CLUB || "/home/user/sire65/kc-clubapp";
const { ANTWORTEN } = await import(CLUB + "/tools/anleitung/demo.mjs");
export const launch = () => chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
export async function seite(b, opt = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin" });
  const p = await ctx.newPage();
  p.fehler = []; p.on("pageerror", (e) => p.fehler.push(String(e).slice(0, 160)));
  // Einstellungen speichern: der Demo-Server gibt den gespeicherten Wert zurück wie der echte (sonst meldet die App einen Fehler)
  const antw = { einstellung_setzen: (q) => ({ ok: true, wert: q.wert }), ...ANTWORTEN };
  antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, ansicht: { art: opt.ansicht || "einfach", gewaehlt: true }, einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false } } };
  await p.route("**/functions/v1/kc-club*", async (r) => {
    let a = "", q = {}; try { q = JSON.parse(r.request().postData() || "{}"); a = q.action; } catch {}
    const body = typeof antw[a] === "function" ? antw[a](q) : antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(body) });
  });
  await p.route("**/notbetrieb.json*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"modus":"aus","url":""}' }));
  await p.addInitScript(() => { try { localStorage.setItem("kc_club_key", "a".repeat(32)); localStorage.setItem("kc_club_begruesst_P1", "1"); localStorage.setItem("kc_club_version_gesehen", "9.9.9"); sessionStorage.setItem("kc_buero_gefragt", "1"); sessionStorage.setItem("kc_club_start_gemeldet", "1"); } catch {} });
  if (opt.init) await p.addInitScript(opt.init);
  await p.goto("http://localhost:8765/index.html"); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll(".blatt").forEach((x) => x.classList.add("versteckt")); document.getElementById("updateBanner")?.remove(); });
  return p;
}
