import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "fs"; import { spawn } from "child_process";
const mode = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + process.cwd() + "/film.html");
await p.evaluate((k) => { K = k; }, JSON.parse(fs.readFileSync("karaoke.json", "utf8")));
await p.evaluate(async () => { await document.fonts.load('80px "Emo"', "👍"); await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
if (mode === "probe") {
  fs.mkdirSync("probe", { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) { await p.evaluate((t) => zeige(t), t); await p.screenshot({ path: `probe/t${t}.jpg`, type: "jpeg", quality: 80 }); }
} else {
  const fps = 30, n = Math.round(69 * fps);
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "bild.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < n; i++) { await p.evaluate((t) => zeige(t), i / fps); const buf = await p.screenshot({ type: "jpeg", quality: 92 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r)); if (i % 300 === 0) console.log("Bild", i, "/", n); }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
}
await b.close();
