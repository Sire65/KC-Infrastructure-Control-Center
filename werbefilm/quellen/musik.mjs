import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "fs";
const b = await chromium.launch(); const p = await b.newPage();
await p.addScriptTag({ content: fs.readFileSync("musik.js", "utf8") });
const r = await p.evaluate(() => render(113, 0.05));
fs.writeFileSync("musik.raw", Buffer.from(r.pcm, "base64"));
fs.writeFileSync("karaoke.json", JSON.stringify({ takte: r.takte, takt: r.takt, start: 0.05 }));
await b.close();
