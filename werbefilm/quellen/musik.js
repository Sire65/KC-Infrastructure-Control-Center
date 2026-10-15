const BWM = { ctx: null, aus: null, hall: null, rauschen: null };
const bwmSchlag = () => 60 / 124;
const bwHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function bwTon(typ, hz, t, dauer, laut, filterHz, hall) {
  const c = BWM.ctx, o = c.createOscillator(), g = c.createGain(); o.type = typ; o.frequency.setValueAtTime(hz, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(laut, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + dauer);
  let kette = o; if (filterHz) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterHz; o.connect(f); kette = f; }
  kette.connect(g); g.connect(BWM.aus); if (hall) g.connect(BWM.hall); o.start(t); o.stop(t + dauer + .02); return o;
}
function bwRauschen(t, dauer, laut, filterHz, art) {
  const c = BWM.ctx, q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); q.buffer = BWM.rauschen; f.type = art; f.frequency.value = filterHz;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(.0005, t + dauer); q.connect(f); f.connect(g); g.connect(BWM.aus); q.start(t); q.stop(t + dauer + .02);
}
const bwmKick = (t, v = 1) => { const o = bwTon("sine", 140, t, .26, v); o.frequency.exponentialRampToValueAtTime(44, t + .18); };
const bwmSnare = (t, v = .35) => { bwRauschen(t, .16, v, 1500, "bandpass"); bwTon("triangle", 190, t, .09, v * .6); };
const bwmRim = (t, v = .3) => { bwRauschen(t, .04, v, 3000, "bandpass"); bwTon("square", 820, t, .03, v * .12); };
const bwmHat = (t, offen, v = .05) => bwRauschen(t, offen ? .13 : .035, offen ? v * 3 : v, 8000, "highpass");
const bwmAkk = (akk, t, dauer, laut, typ = "square", filter = 2400, hall = false, okt = 0) => akk.forEach((m) => bwTon(typ, bwHz(m + okt), t, dauer, laut, filter, hall));
const bwmBass = (m, t, dauer = .24, laut = .3, filter = 600) => { bwTon("sine", bwHz(m), t, dauer, laut * .9); bwTon("triangle", bwHz(m), t, dauer, laut * .5, filter); };
function bwmDisco(im, t, voll, takt) { // Disco-Schlagzeug: Bass-Trommel auf jeden Schlag, offene Hi-Hat auf dem Nachschlag, Klatschen auf 2 und 4, Wirbel alle 8 Takte
  if (im % 4 === 0) bwmKick(t, 1); bwmHat(t, im % 4 === 2, im % 4 === 2 ? .045 : .03);
  if (voll && (im === 4 || im === 12)) { bwRauschen(t, .16, .4, 1500, "bandpass"); bwTon("triangle", 190, t, .09, .25); }
  if (takt % 8 === 7 && im >= 8) bwRauschen(t, .08, .1 + (im - 8) * .04, 1800, "bandpass");
}
const bwmFill = (im, t) => { if (im >= 8 && im % 2 === 0) bwmSnare(t, .1 + (im - 8) * .035); };
// Melodie: Schritt (0–31 über 2 Takte) → Ton; Teil A in Takt 0–1, Teil B in Takt 2–3 jedes 4-Takt-Blocks
const bwmMel = (a, b, takt, im) => (takt % 4 < 2 ? a : b)[(takt % 2) * 16 + im];
const KS_AKK = { C: [[60, 64, 67], 36], G: [[59, 62, 67], 43], Am: [[57, 60, 64], 45], F: [[57, 60, 65], 41], Em: [[59, 64, 67], 40], Dm: [[57, 62, 65], 38] };
const KS_HOOK = [67, 67, 69, 72, 72, 72, 71, 69, 67, 64]; // „Seit ein-und-neun-zig – Kö-che-club Wer-ne“: hoch zur „neun“, dann runter
// Schreibweise: Leerzeichen trennt Wörter, „-“ trennt Silben (jede Silbe bekommt einen Ton). Satzzeichen hängen an der Silbe.
const KS_TEXT = {
  s1: [["Im Mai ein-und-neun-zig, beim Ick-orn am Tisch,", [64, 64, 64, 62, 64, 67, 65, 64, 62, 64, 60]],
    ["da sa-ßen ein paar Kö-che – die I-dee war noch frisch.", [62, 62, 64, 65, 65, 67, 65, 64, 64, 62, 60, 62, 64]],
    ["Vom Kran-ken-haus, vom Al-ten-heim, mit Herz und mit Hand,", [64, 64, 64, 67, 67, 69, 69, 67, 65, 67, 65, 64, 62]],
    ["und kei-ner von uns ahn-te, was da gra-de ent-stand.", [60, 62, 64, 64, 65, 67, 67, 65, 64, 62, 64, 62, 60]]],
  s2: [["Dann kam fünf-und-neun-zig, der Weih-nachts-markt rief,", [64, 64, 64, 62, 64, 67, 65, 64, 62, 64, 60]],
    ["es duf-te-te nach Grün-kohl, und der Glüh-wein, der lief.", [62, 62, 64, 65, 65, 67, 65, 64, 64, 62, 60, 62, 64]],
    ["Am Frei-tag in Rot und un-ter der Wo-che in Weiß,", [64, 64, 64, 67, 67, 69, 69, 67, 65, 67, 65, 64, 62]],
    ["und was wir ver-die-nen, das ge-ben wir wei-ter – mit Fleiß.", [60, 62, 64, 64, 64, 65, 67, 67, 65, 64, 62, 64, 62, 60]]],
  pre: [["Ein Löf-fel, ein Topf und ein Traum –", [65, 65, 64, 65, 67, 69, 67, 72]],
    ["wer hät-te das ge-dacht? Man glaubt es kaum …", [65, 65, 64, 65, 67, 69, 72, 71, 69, 71]]],
  ref: [["Seit ein-und-neun-zig – Kö-che-club Wer-ne!", KS_HOOK, true],
    ["Wir ko-chen mit Herz, und das tun wir so ger-ne!", [64, 65, 67, 69, 69, 72, 72, 69, 67, 65, 67, 65]],
    ["Ob Grün-kohl, ob Punsch, ob die Ja-cke rot o-der weiß –", [67, 67, 69, 72, 72, 71, 69, 71, 72, 74, 72, 71, 72]],
    ["wir rüh-ren zu-sam-men, das ist un-ser Preis!", [69, 69, 69, 67, 65, 65, 67, 69, 71, 72, 74]],
    ["Seit ein-und-neun-zig – da brennt un-ser Herd,", KS_HOOK, true],
    ["weil Freund-schaft und Ko-chen für im-mer ge-hört!", [65, 65, 67, 69, 69, 72, 71, 69, 67, 64, 60]]],
  bridge: [["Man-che sind ge-gan-gen, doch sie sind noch da-bei,", [69, 69, 67, 65, 65, 64, 64, 65, 67, 69, 67, 65]],
    ["in je-dem Re-zept und in je-der Fei-e-rei.", [64, 64, 65, 67, 67, 64, 64, 65, 67, 69, 67, 64]],
    ["Und kommt mal ein Neu-er, dann rü-cken wir zu-samm' –", [69, 69, 69, 72, 72, 69, 67, 69, 71, 72, 74, 72]],
    ["ein Platz an der Ta-fel ist im-mer noch frei – na komm!", [72, 72, 71, 69, 71, 72, 74, 72, 71, 69, 71, 74, 76]]],
};
// Zeile → Silben (mit Leerzeichen am Wortende, für die Anzeige); „–“ und „…“ hängen am vorigen Wort
const ksSilben = (zeile) => zeile.replace(/ ([–…])/g, "\u00a0$1").split(" ").flatMap((w) => { const t = w.split("-"); t[t.length - 1] += " "; return t; });
KS_TEXT.refk = [KS_TEXT.ref[0], KS_TEXT.ref[1], KS_TEXT.ref[4], KS_TEXT.ref[5]];
// Werbefilm-Fassung: Intro, Strophen-Begleitung ohne Gesang (Sprecher), Pre-Chorus und Refrain gesungen, Schlussakkord
const KS_ABLAUF = [["intro", ["C", "G", "Am", "F"], null, 0],
  ["s1", ["Am", "F", "C", "G", "Am", "F", "C", "G"], null, 0], ["s1", ["Am", "F", "C", "G", "Am", "F", "C", "G"], null, 0],
  ["pre", ["F", "G", "F", "G"], "pre", 0], ["ref", ["C", "G", "Am", "F", "C", "G", "F", "C"], "refk", 0], ["outro", ["C", "C"], null, 0]];
const KS_TAKTE = KS_ABLAUF.flatMap(([teil, akk, text, hoch], a) => akk.map((name, k) => {
  const z = text && k % 2 === 0 ? KS_TEXT[text][k / 2] : null;
  return { teil, name, hoch, neu: k === 0, abschnitt: a, letzter: k === akk.length - 1, zeile: z ? { silben: ksSilben(z[0]), noten: z[1], klatsch: !!z[2] } : null };
}));
function ksSpiel(g, t) {
  const im = g % 16, b = Math.floor(g / 16), T = KS_TAKTE[b]; if (!T) return; // Liedende: Stille, dann geht es zum nächsten Stück
  const [akk0, root] = KS_AKK[T.name], tr = T.hoch, akk = akk0.map((m) => m + tr), sanft = T.teil === "bridge" || T.teil === "intro" && b < 2;
  if (T.teil === "outro") { if (b === KS_TAKTE.length - 2 && im === 0) { bwmAkk(akk, t, 3.2, .03, "sawtooth", 2400, true); bwmBass(root + tr, t, 2.4, .35, 500); bwmKick(t, 1); bwRauschen(t, 2.2, .3, 5000, "highpass"); } return; }
  bwmDisco(im, t, !sanft, b); // Disco-Fox: Bass-Trommel auf jeden Schlag, offene Hi-Hat auf dem Nachschlag, Klatschen auf 2 und 4
  if (im % 2 === 0) bwmBass(root + tr + (im % 4 === 2 ? 12 : 0), t, .15, .3, 800); // Oktav-Bass
  if (im === 0) bwmAkk(akk, t, 1.9, sanft ? .014 : .02, "sawtooth", 2600, true); // Streicher-Fläche
  if (!sanft && im % 4 === 2) bwmAkk(akk, t, .08, .02, "square", 2400); // Akkord-Stoß auf dem Nachschlag
  if (T.neu && im === 0 && T.teil === "ref") bwRauschen(t, 1.6, .28, 5000, "highpass"); // Becken zum Refrain
  if (T.letzter && (T.teil === "pre" || T.teil === "bridge" || T.teil === "ref" && KS_TAKTE[b + 1]?.hoch !== T.hoch) && im >= 8 && im % 2 === 0) bwmSnare(t, .12 + (im - 8) * .04); // Wirbel vor dem Refrain / der Rückung
  if (T.teil === "intro" && im === 0 && b % 2 === 0) ksSingen(b === 0 ? KS_TEXT.ref[0] : KS_TEXT.ref[5], t, 0, true); // Intro: die Melodie vom Refrain, ohne Text
  if (T.zeile && im === 0) ksSingen(T.zeile, t, tr, false, b);
}
const KS = { zeilen: [] }; // gesungene Zeilen (mit Zeiten) für die Karaoke-Anzeige
function ksSingen(z, t, tr, nurMelodie, takt) {
  const silben = Array.isArray(z) ? ksSilben(z[0]) : z.silben, noten = Array.isArray(z) ? z[1] : z.noten, n = silben.length, sech = bwmSchlag() / 4, zeiten = [];
  for (let k = 0; k < n; k++) {
    const st = k * 2, dauer = (k === n - 1 ? Math.max(4, 30 - st) : 2) * sech * .92, hz = bwHz(noten[Math.min(k, noten.length - 1)] + tr), tt = t + st * sech; zeiten.push(tt);
    bwTon("sawtooth", hz, tt, dauer, nurMelodie ? .03 : .04, 2000, true); bwTon("sine", hz, tt, dauer, nurMelodie ? .05 : .07); bwTon("triangle", hz * 2, tt, dauer * .6, .01); // „Stimme“: warm, mit Hall
  }
  if (!nurMelodie && (z.klatsch || (Array.isArray(z) && z[2]))) [24, 26].forEach((st) => bwmSnare(t + st * sech, .38)); // 👏👏 nach „Köcheclub Werne!“
  if (!nurMelodie) { KS.zeilen.push({ silben, zeiten, ende: t + 32 * sech, takt }); KS.zeilen = KS.zeilen.slice(-4); }
}
async function render(sek, start) {
  const sr = 44100, c = new OfflineAudioContext(2, sr * sek, sr); BWM.ctx = c;
  BWM.aus = c.createGain(); BWM.aus.gain.value = .75;
  const komp = c.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 6; komp.attack.value = .01; komp.release.value = .2;
  const voll = c.createGain(); voll.gain.value = 1.2; const grenze = c.createDynamicsCompressor(); grenze.threshold.value = -2; grenze.knee.value = 0; grenze.ratio.value = 20; grenze.attack.value = .002; grenze.release.value = .1;
  BWM.aus.connect(komp); komp.connect(voll); voll.connect(grenze); grenze.connect(c.destination);
  BWM.hall = c.createDelay(1); BWM.hall.delayTime.value = .375; const fb = c.createGain(); fb.gain.value = .28; const hg = c.createGain(); hg.gain.value = .35;
  BWM.hall.connect(fb); fb.connect(BWM.hall); BWM.hall.connect(hg); hg.connect(BWM.aus);
  const n = sr, buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; BWM.rauschen = buf;
  const sech = bwmSchlag() / 4; for (let g = 0; g < KS_TAKTE.length * 16; g++) ksSpiel(g, start + g * sech);
  const out = await c.startRendering(); const L = out.getChannelData(0), R = out.getChannelData(1);
  const pcm = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  const u8 = new Uint8Array(pcm.buffer); let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return { pcm: btoa(s), takte: KS_TAKTE.map((T, b) => T.zeile ? { b, silben: T.zeile.silben } : null).filter(Boolean), takt: 4 * bwmSchlag() };
}
