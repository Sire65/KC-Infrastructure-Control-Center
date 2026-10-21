// Echte Club-App mit erfundenen Demodaten öffnen (wie KC-Clubapp/tools/anleitung/basis.mjs) – es geht nichts an den echten Server
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
export const CLUB = process.env.CLUB || "/home/user/sire65/kc-clubapp";
const { ANTWORTEN } = await import(CLUB + "/tools/anleitung/demo.mjs");
// Schein-Mikrofon/-Kamera: sonst zeigt die App das Mikrofon durchgestrichen (die Aufnahme hat kein echtes Gerät)
export const launch = () => chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--lang=de-DE", "--force-device-scale-factor=2"], // scharfe Bilder im Mitschnitt (sonst nur 390×844)
  env: { ...process.env, LANG: "de_DE.UTF-8", LANGUAGE: "de" } }); // Datum/Uhrzeit-Felder deutsch (sonst 10/22/2026, 06:00 PM)
export async function seite(b, opt = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin", permissions: ["microphone", "camera"] });
  const p = await ctx.newPage();
  p.fehler = []; p.on("pageerror", (e) => p.fehler.push(String(e).slice(0, 160)));
  // Einstellungen speichern: der Demo-Server gibt den gespeicherten Wert zurück wie der echte (sonst meldet die App einen Fehler)
  // … und merkt ihn sich: die App lädt alle 60 s neu – sonst spränge z. B. die Ansicht auf den Ausgangswert zurück
  const antw = { einstellung_setzen: (q) => { antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, [q.schluessel]: q.wert } }; return { ok: true, wert: q.wert }; }, ...ANTWORTEN };
  if (opt.demo) opt.demo(antw); // kapitelweise Demodaten (<kapitel>.demo.mjs), z. B. eine gesendete Nachricht erscheint danach in der Unterhaltung
  antw.init = { ...antw.init, einstellungen: { ...antw.init.einstellungen, ansicht: { art: opt.ansicht || "einfach", gewaehlt: true }, einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false } } };
  await p.route("**/functions/v1/kc-club*", async (r) => {
    let a = "", q = {}; try { q = JSON.parse(r.request().postData() || "{}"); a = q.action; } catch {}
    const body = typeof antw[a] === "function" ? antw[a](q) : antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(body) });
  });
  await p.route("**/notbetrieb.json*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"modus":"aus","url":""}' }));
  await p.addInitScript(() => { try { localStorage.setItem("kc_club_key", "a".repeat(32)); localStorage.setItem("kc_club_begruesst_P1", "1"); localStorage.setItem("kc_club_version_gesehen", "9.9.9"); sessionStorage.setItem("kc_buero_gefragt", "1"); sessionStorage.setItem("kc_club_start_gemeldet", "1"); localStorage.setItem("kc_club_kuckuck", "0"); } catch {} });
  if (opt.init) await p.addInitScript(opt.init);
  await p.goto("http://localhost:8765/index.html"); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll(".blatt").forEach((x) => x.classList.add("versteckt")); document.getElementById("updateBanner")?.remove(); });
  return p;
}
