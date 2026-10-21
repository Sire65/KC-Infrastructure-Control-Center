// Film zusammenbauen: Aufnahme + Rahmen/Untertitel + Sprecher + Küchen-Disco → film/<id>-hoch.mp4 (9:16) und film/<id>-quer.mp4 (16:9, Beamer)
// Aufruf: node bau.mjs voreinstellungen.json [hoch|quer]
import fs from "fs"; import { execFileSync } from "child_process";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const K = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const FORMATE = process.argv[3] ? [process.argv[3]] : ["hoch", "quer"];
const CLUB = process.env.CLUB || "/home/user/sire65/kc-clubapp";
const A = `aufnahme/${K.id}`, Z = JSON.parse(fs.readFileSync(`${A}/zeiten.json`, "utf8")), DAUER = JSON.parse(fs.readFileSync(`vo/${K.id}/dauer.json`, "utf8"));
const LANG = Z.ende, W = `arbeit/${K.id}`; fs.rmSync(W, { recursive: true, force: true }); fs.mkdirSync(W, { recursive: true }); fs.mkdirSync("film", { recursive: true });
const ff = (...a) => execFileSync("ffmpeg", ["-y", "-v", "error", ...a], { stdio: "inherit" });

// ---------- Zeitplan der Einblendungen ----------
// Untertitel: Text in Stücke (Satzende, Doppelpunkt, Gedankenstrich), Dauer nach Buchstaben verteilt
function stuecke(t) {
  const roh = t.match(/[^.!?:–]+[.!?:–]?/g).map((x) => x.trim()).filter(Boolean), aus = [];
  for (const r of roh) { if (aus.length && (aus.at(-1) + " " + r).length <= 70 && !/[.!?]$/.test(aus.at(-1))) aus[aus.length - 1] += " " + r; else aus.push(r); }
  return aus;
}
const plan = []; // { von, bis, z }
const basis = { teil: K.teil, kapKurz: K.kapKurz, kap1: K.kap1, kap2: K.kap2, naechstes: K.naechstes, schritte: K.schritte };
let schritt = null, alleFertig = false;
K.szenen.forEach((s, i) => {
  const zs = Z.szenen[i]; if (s.schritt != null) schritt = s.schritt;
  if (s.art === "merke") { schritt = null; alleFertig = true; }
  const z0 = { ...basis, art: s.art, schritt: s.art === "tafel" ? null : schritt, alleFertig };
  if (s.art === "merke") { plan.push({ von: zs.start, bis: zs.ende, z: { ...z0, merke: s.text.replace(/^Merke:\s*/, "") } }); return; }
  const st = stuecke(s.text), n = st.reduce((a, x) => a + x.length, 0); let t = zs.sprechAb;
  if (zs.sprechAb > zs.start) plan.push({ von: zs.start, bis: zs.sprechAb, z: z0 });
  const sprechEnde = zs.sprechAb + DAUER[s.id];
  st.forEach((x, k) => { const d = DAUER[s.id] * x.length / n, bis = k === st.length - 1 ? (s.endtafel ? sprechEnde + 0.4 : zs.ende) : t + d; plan.push({ von: t, bis, z: { ...z0, ut: x } }); t += d; });
  if (s.endtafel) plan.push({ von: sprechEnde + 0.4, bis: zs.ende, z: { ...basis, art: "ende" } });
});

// ---------- Ton: Sprecher an ihre Stellen, Musik darunter (leiser, solange gesprochen wird) ----------
function ton() {
  execFileSync("node", ["musik.mjs", String(Math.ceil(LANG) + 2)], { stdio: "inherit" });
  const ein = [], f = [];
  K.szenen.forEach((s, i) => { ein.push("-i", `vo/${K.id}/${s.id}.wav`); const ms = Math.round(Z.szenen[i].sprechAb * 1000); f.push(`[${i + 1}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay=${ms}|${ms}[v${i}]`); });
  const n = K.szenen.length, titelEnde = Z.szenen[0].sprechAb, endeAb = Z.szenen.at(-1).sprechAb + DAUER[K.szenen.at(-1).id];
  // Musik: im Vorspann und auf der Schlusstafel voll, unter den Erklärungen leise (Teppich), dazu Absenken beim Sprechen
  const laut = `volume='if(lt(t,${titelEnde.toFixed(2)}),0.85,if(gt(t,${endeAb.toFixed(2)}),0.85,0.30))':eval=frame`;
  f.push(`${Array.from({ length: n }, (_, i) => `[v${i}]`).join("")}amix=inputs=${n}:normalize=0,highpass=f=70,equalizer=f=3000:t=q:w=1:g=3,volume=1.7,apad=whole_dur=${LANG.toFixed(2)},asplit=2[vo][sc]`);
  f.push(`[0:a]${laut}[m0];[m0][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=500[md]`);
  f.push(`[md][vo]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:${LANG.toFixed(2)},afade=t=in:d=0.6,afade=t=out:st=${(LANG - 2).toFixed(2)}:d=2[out]`);
  ff("-i", "musik.wav", ...ein, "-filter_complex", f.join(";"), "-map", "[out]", "-ar", "44100", "-c:a", "pcm_s16le", `${W}/ton.wav`);
}

// ---------- Handy-Aufnahme: Bilder mit echten Zeitstempeln → gleichmäßige 30 Bilder/s ----------
function handyListe() {
  const b = [...Z.bilder].sort((x, y) => x.t - y.t), z = []; // unter Last kommen Bilder manchmal in falscher Reihenfolge an
  for (let i = 0; i < b.length; i++) { const von = Math.max(0, b[i].t), bis = i + 1 < b.length ? Math.max(0, b[i + 1].t) : LANG; if (bis <= von && i + 1 < b.length) continue;
    z.push(`file '${process.cwd()}/${A}/${b[i].name}'`, `duration ${(bis - von).toFixed(4)}`); }
  z.push(`file '${process.cwd()}/${A}/${b.at(-1).name}'`);
  fs.writeFileSync(`${W}/handy.txt`, z.join("\n"));
}

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
ton(); handyListe();
for (const form of FORMATE) {
  const F = form === "hoch" ? { w: 1080, h: 1920, loch: [205, 196, 670, 1450] } : { w: 1920, h: 1080, loch: [738, 60, 444, 960] };
  const p = await b.newPage({ viewport: { width: F.w, height: F.h } });
  fs.writeFileSync(`${W}/rahmen.html`, fs.readFileSync("rahmen.html", "utf8").replace("LOGO_PFAD", `file://${CLUB}/kc-kochmuetze-weiss.webp`));
  await p.goto(`file://${process.cwd()}/${W}/rahmen.html`);
  const liste = [];
  for (let i = 0; i < plan.length; i++) {
    const name = `${W}/${form}-${String(i).padStart(3, "0")}.png`;
    await p.evaluate(([form, z]) => zeige(form, z), [form, plan[i].z]);
    await p.screenshot({ path: name, omitBackground: true });
    liste.push(`file '${process.cwd()}/${name}'`, `duration ${(plan[i].bis - plan[i].von).toFixed(4)}`);
  }
  liste.push(liste.at(-2)); fs.writeFileSync(`${W}/${form}-rahmen.txt`, liste.join("\n")); await p.close();
  const [lx, ly, lw, lh] = F.loch;
  ff("-f", "concat", "-safe", "0", "-i", `${W}/handy.txt`, "-f", "concat", "-safe", "0", "-i", `${W}/${form}-rahmen.txt`, "-i", `${W}/ton.wav`,
    "-filter_complex", `color=c=0xf3e9dc:s=${F.w}x${F.h}:r=30:d=${LANG.toFixed(2)}[bg];[0:v]fps=30,scale=${lw}:${lh}:flags=lanczos,setsar=1[h];[1:v]fps=30,format=rgba[r];[bg][h]overlay=${lx}:${ly}:shortest=1[a];[a][r]overlay=0:0:shortest=1,format=yuv420p[v]`,
    "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", LANG.toFixed(2), `film/${K.id}-${form}.mp4`);
  console.log("fertig:", `film/${K.id}-${form}.mp4`);
}
await b.close();
