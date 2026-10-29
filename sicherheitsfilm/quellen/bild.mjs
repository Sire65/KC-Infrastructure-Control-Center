// Bild: film.html Bild für Bild mit Chromium abfotografieren → bild.mp4 (25 fps). Zeitplan aus zeiten.json (Sprechdauer je Satz) → plan.json
// node bild.mjs probe 3 12 40   → Probebilder probe/t<sek>.jpg   ·   node bild.mjs voll   → bild.mp4
import { createRequire } from "module"; import { execSync, spawn } from "child_process"; import fs from "fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/");
const { chromium } = require("playwright");
const texte = JSON.parse(fs.readFileSync("texte.json", "utf8")), zeiten = JSON.parse(fs.readFileSync("zeiten.json", "utf8"));
const VOR = 0.6, NACH = 0.9, SCHLUSS = 1.8;
let t = 0; const plan = texte.map((s, i) => { const start = t, sprache = start + VOR, ende = sprache + zeiten[s.id] + (i === texte.length - 1 ? SCHLUSS : NACH); t = ende - 0.2; return { id: s.id, start: +start.toFixed(3), sprache: +sprache.toFixed(3), ende: +ende.toFixed(3) }; });
const DAUER = +(plan.at(-1).ende).toFixed(3);
fs.writeFileSync("plan.json", JSON.stringify({ dauer: DAUER, plan }, null, 1));
const mode = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + process.cwd() + "/film.html");
await p.evaluate(([pl, tx]) => { PLAN = pl; TEXTE = tx; }, [plan, Object.fromEntries(texte.map((s) => [s.id, s.t]))]);
await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
if (mode === "probe") {
  fs.mkdirSync("probe", { recursive: true });
  for (const s of process.argv.slice(3).map(Number)) { await p.evaluate((s) => zeige(s), s); await p.screenshot({ path: `probe/t${s}.jpg`, type: "jpeg", quality: 80 }); }
} else {
  const fps = 25, n = Math.round(DAUER * fps);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "bild.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) { await p.evaluate((t) => zeige(t), i / fps); const buf = await p.screenshot({ type: "jpeg", quality: 90 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); if (i % 500 === 0) console.log("Bild", i, "/", n); }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
}
console.log("Dauer", DAUER, "s");
await b.close();
