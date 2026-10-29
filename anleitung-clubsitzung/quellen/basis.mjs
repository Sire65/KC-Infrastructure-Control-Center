// Echte Club-App im Browser mit Demodaten bedienen (Muster: KC-Clubapp/tools/anleitung/basis.mjs).
// Club-App-Checkout: KC_CLUBAPP (Standard /home/user/kc-clubapp), dort `python3 -m http.server 8765` starten.
import fs from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // global installiert (NODE_PATH)
import { ANTWORTEN } from "./demo.mjs";
export const BILD = new URL("./bild/", import.meta.url).pathname;
fs.mkdirSync(BILD, { recursive: true });
export const launch = () => chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--lang=de-DE"], env: { ...process.env, LANG: "de_DE.UTF-8", LANGUAGE: "de" } });

// opt.antworten: { action: Antwort | (anfrage) => Antwort }, opt.zeit: ISO-Zeitpunkt (Uhr steht still), opt.treffen: naechstesTreffen
export async function seite(b, opt) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin" });
  const p = await ctx.newPage();
  p.fehler = []; p.on("pageerror", (e) => p.fehler.push(String(e).slice(0, 200)));
  if (opt.zeit) await p.clock.setFixedTime(new Date(opt.zeit));
  const antw = { ...ANTWORTEN, ...opt.antworten };
  const init0 = { ...ANTWORTEN.init, naechstesTreffen: opt.treffen === undefined ? ANTWORTEN.init.naechstesTreffen : opt.treffen, ungelesen: 0, ungelesenLaut: 0, offeneAbstimmungen: 0, protokolleUngelesen: 0,
    einstellungen: { ...ANTWORTEN.init.einstellungen, ansicht: { art: opt.ansicht || "erweitert", gewaehlt: true }, einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, effekte: { an: false }, filme: Object.fromEntries(["clubsitzung", "clubsitzungneu", "clubsitzungfrist"].map((id) => [id, { wie: "angesehen", z: "2026-10-28T12:00:00.000Z" }])) } }; // Film-Hinweis (2.738.0) nicht im Bild
  antw.init = typeof opt.antworten?.init === "function" ? opt.antworten.init(init0) : init0;
  await p.route("**/functions/v1/kc-club*", async (r) => {
    let a = "", q = {}; try { q = JSON.parse(r.request().postData() || "{}"); a = q.action; } catch {}
    const body = typeof antw[a] === "function" ? antw[a](q) : antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(body) });
  });
  await p.route("**/notbetrieb.json*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"modus":"aus","url":""}' }));
  await p.addInitScript(() => { try { localStorage.setItem("kc_club_key", "a".repeat(32)); localStorage.setItem("kc_club_version_gesehen", "9.9.9");
    for (const id of ["P1", "P2"]) localStorage.setItem("kc_club_begruesst_" + id, "1");
    sessionStorage.setItem("kc_buero_gefragt", "1"); sessionStorage.setItem("kc_club_start_gemeldet", "1"); } catch {} });
  // KC-CLUB-SITZUNG-AUFGABE-START (2.750.0): die Frage beim Start nur in den Szenen, die sie zeigen (opt.aufgabe)
  if (!opt.aufgabe) await p.addInitScript(() => { try { sessionStorage.setItem("kc_bu_aufgabe_gezeigt", "1"); } catch {} });
  await p.goto("http://localhost:8765/index.html"); await p.waitForTimeout(2500);
  await ruhig(p);
  return p;
}
// Störende Startfenster/Banner weg (gehören nicht zum gezeigten Ablauf)
export async function ruhig(p) {
  await p.evaluate(() => { document.getElementById("updateBanner")?.remove(); document.querySelectorAll(".tipp-blase,.tw-blase,.einweisung").forEach((x) => x.remove()); });
}
// Lage eines Elements (CSS-Pixel der 390×844-Ansicht) für den Tipp-Kreis im Film
export async function lage(p, sel) {
  const r = await p.locator(sel).first().boundingBox({ timeout: 3000 }).catch(() => null);
  if (!r) throw new Error("nicht gefunden: " + sel);
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}
// Bild aufnehmen; ring = Selektor (oder Liste), der im Film markiert wird
export const SZENEN = [];
export async function bild(p, name, ring) {
  await p.waitForTimeout(450);
  const ringe = [];
  for (const s of [].concat(ring || [])) { await p.locator(s).first().scrollIntoViewIfNeeded().catch(() => {}); }
  for (const s of [].concat(ring || [])) ringe.push(await lage(p, s));
  await p.screenshot({ path: BILD + name + ".png" });
  SZENEN.push({ name, ringe });
  if (p.fehler.length) console.log("Fehler auf der Seite:", p.fehler.splice(0));
  console.log("📸", name, ringe.length ? JSON.stringify(ringe.map((r) => [Math.round(r.x), Math.round(r.y)])) : "");
}
export const tipp = async (p, sel) => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().click(); await p.waitForTimeout(700); };
export function speichern(datei = "szenen.json") { fs.writeFileSync(new URL("./" + datei, import.meta.url), JSON.stringify(SZENEN, null, 1)); }
