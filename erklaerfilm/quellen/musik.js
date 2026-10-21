// Twinkeys „Küchen-Disco“ (Trainingsmusik der Bühne, 116 Schläge/Min.) – Auszug aus KC-Clubapp/app.js, automatisch übernommen
// von musik-auszug.py (bwTon, bwRauschen, bwRiser, bwMusikSchritt). Offline gerendert, kein Internet, kostenlos.
const BWM = { ctx: null, aus: null, hall: null, rauschen: null, stufe: 1 };
const bwKuechenTakt = () => {}; // Küchen-Geräusche nur beim Training
const BWM_AKKORDE = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]; // Am – F – C – G
const BWM_BASS = [45, 41, 48, 43];
const BWM_HOOK = { 0: 76, 3: 74, 6: 72, 8: 69, 10: 72, 12: 74, 16: 79, 19: 76, 22: 74, 24: 72, 26: 74, 28: 76, 30: 72 }; // 2 Takte, A-Moll-Pentatonik
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
function bwRiser(t, dauer) { // Rauschen, das ansteigt – Spannung vor „Los!“
  const c = BWM.ctx, q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); q.buffer = BWM.rauschen; q.loop = true; f.type = "bandpass"; f.Q.value = 3;
  f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(6000, t + dauer); g.gain.setValueAtTime(.0005, t); g.gain.exponentialRampToValueAtTime(.18, t + dauer); g.gain.linearRampToValueAtTime(0, t + dauer + .05);
  q.connect(f); f.connect(g); g.connect(BWM.aus); q.start(t); q.stop(t + dauer + .1);
}
function bwMusikSchritt(s, t) {
  const im = s % 16, takt = Math.floor(s / 16), akk = BWM_AKKORDE[takt % 4], voll = BWM.stufe >= 2, fill = takt === 7 && im >= 8;
  if (im % 4 === 0) { const o = bwTon("sine", 140, t, .26, 1); o.frequency.exponentialRampToValueAtTime(44, t + .18); } // Bass-Trommel auf jeden Schlag
  bwRauschen(t, im % 4 === 2 ? .13 : .035, im % 4 === 2 ? .16 : .05, 8000, "highpass"); // Hi-Hats: 16tel, offen auf dem Off-Beat
  if (voll && (im === 4 || im === 12)) { bwRauschen(t, .16, .4, 1500, "bandpass"); bwTon("triangle", 190, t, .09, .25); } // Klatschen auf 2 und 4
  if (fill) bwRauschen(t, .08, .1 + (im - 8) * .04, 1800, "bandpass"); // Trommelwirbel am Ende von 8 Takten
  if (im % 2 === 0) bwTon("sawtooth", bwHz(BWM_BASS[takt % 4] + (im % 4 === 2 ? 12 : 0)), t, .16, .22, 700); // Disco-Bass (Oktaven)
  if (im === 0) akk.forEach((m) => bwTon("sawtooth", bwHz(m - 12), t, 1.7, .025, 900)); // Fläche
  if (voll && im % 4 === 2) akk.forEach((m) => bwTon("square", bwHz(m), t, .14, .035, 2400)); // Akkord-Stöße auf dem Off-Beat
  if (voll && takt % 4 < 2) { const n = BWM_HOOK[(takt % 2) * 16 + im]; if (n) bwTon("square", bwHz(n), t, .22, .06, 3200, true); } // Hook-Melodie mit Echo
  if (voll && takt % 4 >= 2 && im % 2 === 0) bwTon("triangle", bwHz(akk[(im / 2) % 3] + 24), t, .1, .03, 0, true); // Glitzer-Arpeggio
  bwKuechenTakt(im, t);
}
async function render(sek, bpm, intro) {
  const sr = 44100, c = new OfflineAudioContext(2, sr * sek, sr); BWM.ctx = c;
  BWM.aus = c.createGain(); BWM.aus.gain.value = .75;
  const komp = c.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 6; komp.attack.value = .01; komp.release.value = .2;
  const grenze = c.createDynamicsCompressor(); grenze.threshold.value = -2; grenze.knee.value = 0; grenze.ratio.value = 20; grenze.attack.value = .002; grenze.release.value = .1;
  BWM.aus.connect(komp); komp.connect(grenze); grenze.connect(c.destination);
  BWM.hall = c.createDelay(1); BWM.hall.delayTime.value = .375; const fb = c.createGain(); fb.gain.value = .28; const hg = c.createGain(); hg.gain.value = .35;
  BWM.hall.connect(fb); fb.connect(BWM.hall); BWM.hall.connect(hg); hg.connect(BWM.aus);
  const buf = c.createBuffer(1, sr, sr), d = buf.getChannelData(0); for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1; BWM.rauschen = buf;
  const sech = 60 / bpm / 4, n = Math.ceil(sek / sech);
  for (let s = 0; s < n; s++) { BWM.stufe = s < intro * 16 ? 1 : 2; bwMusikSchritt(s % 128, .05 + s * sech); } // erst schlank, dann voll
  const out = await c.startRendering(); const L = out.getChannelData(0), R = out.getChannelData(1);
  const pcm = new Int16Array(L.length * 2); for (let i = 0; i < L.length; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  const u8 = new Uint8Array(pcm.buffer); let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(s);
}
