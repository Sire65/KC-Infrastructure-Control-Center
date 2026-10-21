// Aufnahme eines Kapitels: echte Club-App (Demodaten), Klickhand führt vor, Bildschirm wird mitgeschnitten.
// Aufruf: node aufnahme.mjs voreinstellungen.json   → aufnahme/<id>/bild-*.jpg, zeiten.json (Szenen-Startzeiten, Bildzeiten)
// Handgriffe je Szene („tun“, nacheinander; „bei“ = Wort im Sprechertext oder Sekunden, ohne „bei“ gleich nach dem vorigen):
//   tipp: Wähler – hinfahren, Tipp-Ring, echter Klick · zeig: Wähler – nur hinzeigen · puls: Wähler – kurz pulsieren · weg: true – Hand weg
//   schreib: { sel, text } – ins Feld tippen und Buchstabe für Buchstabe schreiben · lang: Wähler – lange drücken
//   wisch: { sel, dx, dy } – mit der Hand über das Element wischen · zu: Wähler – sanft dorthin blättern · warte: Sekunden · js: Seitencode als Ausdruck oder „(() => { … })()“ (nur Vorbereitung, z. B. Ansicht öffnen)
// Kapitel: „ansicht“ (einfach|erweitert), „vorher“ (Handgriffe vor dem Mitschnitt, ohne Hand), <kapitel>.demo.mjs (eigene Demodaten)
// Die Klickhand nutzt das Aussehen der Erklär-Videos der App (.rg-finger, .rg-tippring, .rg-puls aus index.html).
// Getippt wird mit echten Maus-Ereignissen – der Server ist durch Demodaten ersetzt, es geht nichts an den Club.
import fs from "fs";
import { launch, seite } from "./app.mjs";

const K = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const DEMO = process.argv[2].replace(/\.json$/, ".demo.mjs"), demo = fs.existsSync(DEMO) ? (await import("./" + DEMO)).default : null;
const DAUER = JSON.parse(fs.readFileSync(`vo/${K.id}/dauer.json`, "utf8"));
const OUT = `aufnahme/${K.id}`; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const PAUSE = 0.9, FAHRT = 0.75; // Ruhe nach jeder Szene, Fahrzeit der Hand

const b = await launch();
const p = await seite(b, {
  ansicht: K.ansicht, demo,
  init: () => { // Mitteilungen im Film „erlaubt“ (sonst fragt das echte Browserfenster – das zeigt der Film als Standbild)
    try { Object.defineProperty(Notification, "permission", { get: () => "granted" }); } catch {}
    try { Object.defineProperty(navigator.serviceWorker, "ready", { get: () => Promise.resolve({ pushManager: { getSubscription: async () => ({ endpoint: "demo" }) } }) }); } catch {}
    try { delete window.speechSynthesis; } catch {} // die App spricht im Film nicht selbst – der Sprecher kommt aus vo.py
  },
});
// Twinkeys Bewegungs-Einladung (kommt nach 12 s) und die einmalige „Warum diese App?“-Karte gehören nicht ins Kapitel
// … ebenso die Kuckucksuhr zur vollen Stunde (schiebt sich über den Kopf und fängt Tipps ab)
await p.evaluate(() => { try { bwEinSetzen({ aus: true }); } catch {} try { kuckuckPruefen = () => {}; } catch {} document.head.insertAdjacentHTML("beforeend", "<style>.kuckuck { display: none !important; }</style>"); document.head.insertAdjacentHTML("beforeend", "<style>.rg-hinweis { display: none !important; }</style>"); });
await p.evaluate(() => { document.querySelectorAll(".meldung").forEach((m) => m.remove()); document.querySelectorAll(".rg-hinweis").forEach((e) => e.closest("[id]")?.id !== "app" && e.remove()); });

// ---------- Klickhand im Bild ----------
await p.evaluate(() => {
  const f = document.createElement("div"); f.id = "filmFinger"; f.className = "rg-finger"; f.innerHTML = "<span>👆</span>";
  f.style.transition = "opacity .3s, transform .75s cubic-bezier(.4,.1,.2,1)"; f.style.transform = `translate(${innerWidth * 0.75}px,${innerHeight + 60}px)`;
  document.body.appendChild(f);
  window.__hand = (x, y, an = true) => { f.classList.toggle("an", an); f.style.transform = `translate(${x}px,${y}px)`; };
  window.__ring = (x, y) => { const k = document.createElement("div"); k.className = "rg-tippring"; k.style.left = x + "px"; k.style.top = y + "px"; document.body.appendChild(k);
    k.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: .95 }, { transform: "translate(-50%,-50%) scale(2.2)", opacity: 0 }], { duration: 650, easing: "ease-out" }); setTimeout(() => k.remove(), 700);
    f.classList.add("drueckt"); setTimeout(() => f.classList.remove("drueckt"), 180); };
  window.__weg = () => { f.classList.remove("an"); f.style.transform = `translate(${innerWidth * 0.75}px,${innerHeight + 60}px)`; };
});
const warte = (s) => new Promise((r) => setTimeout(r, s * 1000));
async function ziel(sel) {
  const l = p.locator(sel).filter({ visible: true }).first();
  await l.waitFor({ state: "visible", timeout: 2000 });
  const imBild = await l.evaluate((e) => { const r = e.getBoundingClientRect(); return r.top > 90 && r.bottom < innerHeight - 150; });
  if (!imBild) { await l.evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" })); await warte(0.7); }
  const r = await l.boundingBox(); return { l, x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
const hin = async (z) => { await p.evaluate(([x, y]) => __hand(x, y), [z.x, z.y]); await warte(FAHRT + 0.15); };
const puls = (sel) => p.locator(sel).filter({ visible: true }).first().evaluate((e) => { e.classList.remove("rg-puls"); void e.offsetWidth; e.classList.add("rg-puls"); setTimeout(() => e.classList.remove("rg-puls"), 2300); }, null, { timeout: 2000 }).catch(() => {});
async function tu(a) {
  if (a.weg) { await p.evaluate(() => __weg()); return; }
  if (a.js) { await p.evaluate(a.js); await warte(0.3); }
  if (a.warte) await warte(a.warte);
  if (a.zu) { await p.locator(a.zu).filter({ visible: true }).first().evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" }), null, { timeout: 2000 }); await warte(0.8); }
  if (a.lang) { const z = await ziel(a.lang); await hin(z); await p.mouse.move(z.x, z.y); await p.mouse.down(); await p.evaluate(([x, y]) => __ring(x, y), [z.x, z.y]); await warte(0.9); await p.mouse.up(); await warte(0.4); }
  if (a.wisch) { const z = await ziel(a.wisch.sel); await hin(z); const dx = a.wisch.dx || 0, dy = a.wisch.dy || 0;
    await p.mouse.move(z.x, z.y); await p.mouse.down(); for (let i = 1; i <= 15; i++) { await p.mouse.move(z.x + dx * i / 15, z.y + dy * i / 15); await p.evaluate(([x, y]) => { const f = document.getElementById("filmFinger"); f.style.transition = "opacity .3s"; __hand(x, y); }, [z.x + dx * i / 15, z.y + dy * i / 15]); await warte(0.03); }
    await p.mouse.up(); await p.evaluate(() => { document.getElementById("filmFinger").style.transition = "opacity .3s, transform .75s cubic-bezier(.4,.1,.2,1)"; }); await warte(0.4); }
  if (a.schreib) { const z = await ziel(a.schreib.sel); await hin(z); await p.evaluate(([x, y]) => __ring(x, y), [z.x, z.y]); await p.mouse.click(z.x, z.y); await warte(0.3);
    await p.evaluate(() => __weg()); await p.keyboard.type(a.schreib.text, { delay: 85 }); await warte(0.3); }
  if (a.puls) await puls(a.puls);
  if (a.zeig) await hin(await ziel(a.zeig));
  if (a.tipp) { const z = await ziel(a.tipp); await hin(z); await p.evaluate(([x, y]) => __ring(x, y), [z.x, z.y]); await p.mouse.click(z.x, z.y); await warte(0.5);
    await p.evaluate(() => document.querySelectorAll(".meldung").forEach((m) => { m.style.top = ""; })); }
}
// Zeitpunkt eines Worts in der Szene: Anteil der Buchstaben bis zum Wort × Sprechdauer (Hand kommt kurz vorher an)
const wortZeit = (s, bei) => typeof bei === "number" ? bei : Math.max(0, (s.text.indexOf(bei) / s.text.length) * DAUER[s.id] - (bei ? 0.2 : 0));

for (const a of K.vorher || []) await tu(a).catch((e) => console.log("⚠️ vorher", JSON.stringify(a), String(e).slice(0, 120)));
await p.evaluate(() => { __weg(); document.querySelectorAll(".meldung").forEach((m) => m.remove()); }); await warte(0.5);

// ---------- Mitschnitt (Bildschirm-Übertragung von Chromium, Bilder mit Zeitstempel) ----------
const cdp = await p.context().newCDPSession(p);
const bilder = []; let nr = 0;
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const name = `bild-${String(nr++).padStart(5, "0")}.jpg`; fs.writeFileSync(`${OUT}/${name}`, Buffer.from(data, "base64"));
  bilder.push({ name, t: metadata.timestamp }); cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, everyNthFrame: 1, maxWidth: 780, maxHeight: 1688 }); // volle Auflösung (Bildpunktdichte 2), sonst nur 390×844
// Stillstand erzeugt keine Bilder – ein unsichtbarer Takt hält die Übertragung am Laufen
await p.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;z-index:99999;pointer-events:none"; document.body.appendChild(d); let i = 0; setInterval(() => { d.style.background = (i++ % 2) ? "#000" : "#111"; }, 33); });
await warte(0.5);

const t0 = Date.now() / 1000, szenen = [];
for (const s of K.szenen) {
  const start = Date.now() / 1000 - t0, sprechAb = start + (s.vor || 0);
  szenen.push({ id: s.id, start, sprechAb });
  const plan = (s.tun || []).map((a) => ({ a, t: (s.vor || 0) + wortZeit(s, a.bei) - (a.tipp || a.zeig || a.lang || a.wisch || a.schreib ? FAHRT + 0.15 : 0) }));
  for (const { a, t } of plan) { const jetzt = Date.now() / 1000 - t0 - start; if (t > jetzt) await warte(t - jetzt); await tu(a).catch((e) => console.log("⚠️", s.id, JSON.stringify(a), String(e).slice(0, 120))); }
  const ende = start + (s.vor || 0) + DAUER[s.id] + PAUSE + (s.nach || 0), jetzt = Date.now() / 1000 - t0;
  if (ende > jetzt) await warte(ende - jetzt);
  szenen[szenen.length - 1].ende = Date.now() / 1000 - t0;
  console.log("Szene", s.id, szenen.at(-1).start.toFixed(1), "–", szenen.at(-1).ende.toFixed(1));
}
await cdp.send("Page.stopScreencast"); await warte(0.3);
fs.writeFileSync(`${OUT}/zeiten.json`, JSON.stringify({ szenen, bilder: bilder.map((x) => ({ ...x, t: x.t - t0 })), ende: szenen.at(-1).ende }, null, 1));
if (p.fehler.length) console.log("Fehler in der Seite:", p.fehler);
console.log(bilder.length, "Bilder");
await b.close();
