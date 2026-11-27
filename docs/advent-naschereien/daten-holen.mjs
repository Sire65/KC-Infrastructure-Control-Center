// KICC-ADVENT-NASCHHEFT: holt die Anleitungen aus dem Adventskalender der Club-App (app.js: AK_NASCH, AK_TUERCHEN)
// und schreibt sie als Schnappschuss nach daten/club-app-advent.json. Aufruf: node daten-holen.mjs <pfad/zur/kc-clubapp/app.js>
// Nur Bastelanleitungen – keine Mitglieder-Daten, keine Chats (AGENTS.md Regel 19).
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const quelle = process.argv[2];
if (!quelle) { console.error("Pfad zu kc-clubapp/app.js fehlt"); process.exit(1); }
const js = readFileSync(quelle, "utf8");
const von = js.indexOf("const AK_NASCH = ["), bis = js.indexOf("const AK_ARTEN");
if (von < 0 || bis < 0) { console.error("AK_NASCH/AK_ARTEN nicht gefunden"); process.exit(1); }
const ctx = {};
vm.runInNewContext(js.slice(von, bis) + "\n;globalThis.__n = AK_NASCH; globalThis.__t = AK_TUERCHEN;", ctx);
const nasch = ctx.__n.map((x) => ({ quelle: "club-nasch", sym: x.sym, t: x.t, z: x.z, s: x.s, tipp: x.tipp || "" }));
const tage = {};
ctx.__t.forEach((x, i) => { if (x.t) tage[x.t] = i + 1; });
const links = {};
ctx.__t.forEach((x) => { if (x.t && x.link) links[x.t] = x.link; });
const bastel = ctx.__t.filter((x) => (x.art === "basteln" || x.art === "deko") && !nasch.some((n) => n.t === x.t))
  .map((x) => ({ quelle: "club-" + x.art, sym: x.sym, t: x.t, z: x.z, s: x.s, tipp: x.tipp || "", dauer: x.dauer || "", kinder: x.kinder ?? null }));
for (const e of [...nasch, ...bastel]) { if (tage[e.t]) e.tuerchen = tage[e.t]; if (links[e.t]) e.link = links[e.t]; }
const engel = nasch.find((x) => x.t.startsWith("Engel aus Nudeln")); const ek = ctx.__t.find((x) => x.t === engel?.t);
if (engel && ek) { engel.dauer = ek.dauer; engel.kinder = ek.kinder; }
writeFileSync(new URL("./daten/club-app-advent.json", import.meta.url), JSON.stringify({ stand: new Date().toISOString().slice(0, 10), nasch, bastel }, null, 1));
console.log(`nasch ${nasch.length}, basteln/deko ${bastel.length}`);
