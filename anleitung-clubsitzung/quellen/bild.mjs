// Film-Bild: film.html Bild für Bild aufnehmen → bild.mp4 (30 fps). Aufruf: node bild.mjs [probe t1 t2 …]
import fs from "node:fs"; import { spawn } from "node:child_process"; import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const Z = JSON.parse(fs.readFileSync("zeiten.json", "utf8"));
const R = Object.fromEntries([...JSON.parse(fs.readFileSync("szenen-1.json", "utf8")), ...JSON.parse(fs.readFileSync("szenen-2.json", "utf8"))].map((s) => [s.name, s.ringe]));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + process.cwd() + "/film.html");
await p.evaluate(([z, r]) => { Z = z; R = r; }, [Z, R]);
const laden = () => p.evaluate(() => Promise.all([...document.images].filter((i) => i.getAttribute("src")).map((i) => i.decode().catch(() => {}))));
const ende = Z.at(-1).ab + Z.at(-1).dauer;
if (process.argv[2] === "probe") {
  fs.mkdirSync("probe", { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) { await p.evaluate((t) => zeige(t), t); await laden(); await p.screenshot({ path: `probe/f${t}.jpg`, type: "jpeg", quality: 80 }); }
} else {
  const fps = 30, n = Math.ceil(ende * fps);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "bild.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) { await p.evaluate((t) => zeige(t), i / fps); await laden(); const buf = await p.screenshot({ type: "jpeg", quality: 90 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); if (i % 900 === 0) console.log("Bild", i, "/", n); }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
}
await b.close();
