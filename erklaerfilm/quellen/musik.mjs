// Küchen-Disco als WAV rendern: node musik.mjs <sekunden> → musik.wav
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "fs"; import { execFileSync } from "child_process";
const sek = Number(process.argv[2] || 120);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); const p = await b.newPage();
await p.addScriptTag({ content: fs.readFileSync("musik.js", "utf8") });
fs.writeFileSync("musik.raw", Buffer.from(await p.evaluate((s) => render(s, 116, 8), sek), "base64"));
await b.close();
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", "44100", "-ac", "2", "-i", "musik.raw", "musik.wav"]); fs.rmSync("musik.raw");
