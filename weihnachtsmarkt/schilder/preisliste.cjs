// Preisliste fuer den Stand (Weihnachtsmarkt) erzeugen:
//   node weihnachtsmarkt/schilder/preisliste.cjs [--kasse=PFAD_ZUM_KASSE_CHECKOUT] [--bis=10]
// KC-SCHILD-PREISLISTE (30.10.2026, Betreiber: "Preisliste im Stand mit Menge ... oben Skala 1 2 3 4 5 usw.,
// darunter der Preis fuer diese Anzahl inkl. Pfand ... jede zweite Reihe farbig und nach Warengruppe:
// erst Alkohol-Getraenke, dann alkoholfreie Getraenke, dann Speisen").
//
// Preise kommen NICHT aus dieser Datei, sondern aus dem Artikelstamm der Kasse (pos/app.js -> PRODUCTS,
// inkl. Pfandbestandteile und Artikelinformation) - dieselbe Quelle wie Kasse, PC-Manager und Kesselschild.
// Aendert sich ein Preis in der Kasse, Liste einfach neu erzeugen.
// Einordnung Alkohol / alkoholfrei aus info.important der Kasse. Fehlt die Angabe, wird der Artikel NICHT
// geraten, sondern rot markiert (UNKNOWN darf nie als OK erscheinen).
//
// Gestaltung = KC-Schilderfamilie (siehe KONZEPT.md): Kochmuetze + "Koecheclub Werne" in #173765, Schrift Carlito.
const fs = require('fs'), path = require('path'), http = require('http'); const pw = require('playwright');
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || d;
const KASSE = path.resolve(arg('kasse', process.env.KC_KASSE_DIR || path.join(__dirname, '..', '..', '..', 'Kasse')));
const BIS = Math.max(1, Math.min(12, Number(arg('bis', 10))));
const ZIEL = path.join(__dirname, 'ausgabe'); fs.mkdirSync(ZIEL, {recursive: true});
const T = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const euro = (b) => (Math.round(b * 100) / 100).toFixed(2).replace('.', ',');
const HUT = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'hut.png')).toString('base64');

// Warengruppen der Preisliste in fester Reihenfolge (Betreibervorgabe). Farbe = Band, Hell = jede zweite Zeile.
const GRUPPEN = [
  {id: 'alkohol', titel: 'Getränke mit Alkohol', farbe: '#8b1e24', hell: '#f6e4e5'},
  {id: 'alkoholfrei', titel: 'Alkoholfreie Getränke', farbe: '#2e7d32', hell: '#e3f1e4'},
  {id: 'speisen', titel: 'Speisen', farbe: '#173765', hell: '#e3e9f3'},
];

(async () => {
  if (!fs.existsSync(path.join(KASSE, 'pos', 'index.html'))) throw new Error(`Kasse nicht gefunden: ${KASSE} (Pfad mit --kasse=... angeben)`);
  const s = http.createServer((q, r) => { const p = path.join(KASSE, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'Content-Type': T[path.extname(p)] || 'application/octet-stream'}); r.end(d); }); });
  await new Promise((r) => s.listen(0, r));
  const b = await pw.chromium.launch();
  try {
    // 1. Artikelstamm aus der Kasse lesen (wie er am Stand gilt)
    const ctx = await b.newContext({serviceWorkers: 'block'}); const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('kc_master_v040', JSON.stringify({registerId: 'PREISLISTE', pinLockEnabled: false})));
    await p.goto(`http://127.0.0.1:${s.address().port}/pos/index.html`); await p.waitForFunction(() => typeof PRODUCTS !== 'undefined' && PRODUCTS.length, null, {timeout: 20000});
    const roh = await p.evaluate(() => PRODUCTS.filter((x) => x.active !== false && Number(x.price) > 0 && ['Getränke', 'Speisen'].includes(x.category))
      .map((x) => ({id: x.id, name: x.name, kat: x.category, preis: Number(x.price), sort: Number(x.sortOrder) || 999,
        pfand: (x.depositComponents || []).filter((k) => Number(k?.price) > 0).map((k) => ({name: k.name || 'Pfand', betrag: Number(k.price)})),
        hinweis: String(x.info?.important || '') + ' ' + String(x.info?.shortDescription || '')})));
    await ctx.close();

    // 2. Zeilen bilden und Warengruppen zuordnen
    const zeilen = []; const zuschlag = [];
    for (const a of roh.sort((x, y) => x.sort - y.sort)) {
      const pfand = a.pfand.reduce((n, k) => n + k.betrag, 0);
      if (a.kat === 'Speisen') { zeilen.push({...a, gruppe: 'speisen', stueck: a.preis + pfand, pfandSumme: pfand}); continue; }
      // Getraenk ohne eigenes Glas = Zuschlag (Schuss Rum/Amaretto): wird nur zu einem Glas dazu verkauft
      if (!a.pfand.length) { zuschlag.push(a); continue; }
      const gruppe = /alkoholfrei/i.test(a.hinweis) ? 'alkoholfrei' : /alkohol/i.test(a.hinweis) ? 'alkohol' : null;
      zeilen.push({...a, gruppe: gruppe || 'alkohol', unbekannt: !gruppe, stueck: a.preis + pfand, pfandSumme: pfand});
    }
    // Zuschlaege mit gleichem Preis zu einer Zeile zusammenfassen ("Schuss Rum / Amaretto")
    const nachPreis = {}; zuschlag.forEach((a) => (nachPreis[a.preis] ||= []).push(a));
    Object.values(nachPreis).forEach((liste) => {
      const name = liste.length > 1 ? liste[0].name.split(' ')[0] + ' ' + liste.map((a) => a.name.split(' ').slice(1).join(' ')).join(' / ') : liste[0].name;
      zeilen.push({id: liste.map((a) => a.id).join('+'), name: '+ ' + name, gruppe: 'alkohol', stueck: liste[0].preis, pfandSumme: 0, zuschlag: true, pfand: []});
    });

    const unter = (z) => z.zuschlag ? 'Zuschlag je Glas – ohne Pfand'
      : z.pfandSumme > 0 ? `inkl. ${euro(z.pfandSumme)} € ${z.pfand.length > 1 ? 'Pfand (' + z.pfand.map((k) => k.name.replace(/n?pfand$/i, '')).join(' + ') + ')' : esc(z.pfand[0].name)}` : '';
    const spalten = Array.from({length: BIS}, (_, i) => i + 1);
    const koerper = GRUPPEN.map((g) => {
      const liste = zeilen.filter((z) => z.gruppe === g.id); if (!liste.length) return '';
      return `<tbody style="--g:${g.farbe};--h:${g.hell}"><tr class="band"><th colspan="${BIS + 1}">${esc(g.titel)}</th></tr>
        ${liste.map((z, i) => `<tr class="${i % 2 ? 'farbig' : ''}${z.zuschlag ? ' zuschlag' : ''}">
          <th class="artikel"><span class="name">${esc(z.name)}</span>${unter(z) ? `<span class="unter">${unter(z)}</span>` : ''}${z.unbekannt ? '<span class="fehlt">⚠ Alkohol-Angabe fehlt im Artikelstamm</span>' : ''}</th>
          ${spalten.map((n) => `<td>${euro(z.stueck * n)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }).join('');

    const pfandTexte = [...new Map(zeilen.flatMap((z) => z.pfand).map((k) => [k.name, k])).values()];
    const stand = new Date().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
    const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Preisliste Weihnachtsmarkt</title><style>
      @page { size: A4 landscape; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Carlito, Calibri, 'Liberation Sans', Arial, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .blatt { width: 297mm; height: 210mm; padding: 7mm 10mm 6mm; display: flex; flex-direction: column; overflow: hidden; }
      .kopf { display: flex; align-items: center; gap: 3mm; border-bottom: 0.9mm solid #173765; padding-bottom: 2.5mm; }
      .kopf img { height: 12mm; }
      .kopf .club { font-size: 6.2mm; font-weight: 700; color: #173765; line-height: 1; }
      .kopf .club small { display: block; font-size: 3.4mm; color: #5b6572; font-weight: 700; margin-top: 1mm; }
      .kopf h1 { margin-left: auto; font-size: 10mm; font-weight: 900; color: #173765; line-height: 1; letter-spacing: -0.1mm; }
      table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 2.5mm; table-layout: fixed; }
      col.a { width: 76mm; }
      thead th { font-size: 3.2mm; color: #5b6572; font-weight: 700; padding: 0 0 1mm; }
      thead .skala th { background: #173765; color: #fff; font-size: 6.2mm; font-weight: 900; padding: 1mm 0 .9mm; text-align: center; }
      thead .skala th:first-child { text-align: left; font-size: 4.2mm; padding-left: 3mm; border-radius: 2mm 0 0 0; }
      thead .skala th:last-child { border-radius: 0 2mm 0 0; }
      thead .skala th small { display: block; font-size: 2.6mm; font-weight: 700; opacity: .8; margin-top: .4mm; }
      .band th { background: var(--g); color: #fff; text-align: left; font-size: 4.2mm; font-weight: 800; padding: .8mm 3mm; letter-spacing: .1mm; }
      tbody tr td, tbody tr .artikel { border-bottom: 0.25mm solid #d6dae0; }
      tbody tr.farbig td, tbody tr.farbig .artikel { background: var(--h); }
      .artikel { text-align: left; padding: .7mm 2mm .7mm 3mm; border-left: 1.6mm solid var(--g); }
      .artikel .name { display: block; font-size: 4.6mm; font-weight: 800; color: #111; line-height: 1.05; }
      .artikel .unter { display: block; font-size: 2.6mm; font-weight: 700; color: var(--g); margin-top: .1mm; }
      .zuschlag .name { font-size: 4mm; color: #333; }
      td { text-align: center; font-size: 4.6mm; font-weight: 700; font-variant-numeric: tabular-nums; padding: .6mm 0; border-left: 0.25mm solid #e5e7eb; }
      tr td:nth-child(2) { font-size: 5.4mm; font-weight: 900; }
      .zuschlag td { font-size: 4.2mm; color: #333; } .zuschlag td:nth-child(2) { font-size: 4.6mm; }
      .fehlt { display: block; color: #b91c1c; font-weight: 800; font-size: 2.8mm; border: 0.3mm dashed #b91c1c; border-radius: .8mm; padding: 0 .6mm; margin-top: .4mm; }
      .fuss { margin-top: auto; display: flex; align-items: center; gap: 4mm; padding-top: 2.5mm; }
      .fuss .pfand { font-size: 3.4mm; line-height: 1.35; color: #333; }
      .fuss .pfand b { color: #173765; }
      .bar { margin-left: auto; flex: 0 0 auto; display: flex; align-items: center; gap: 2mm; background: #173765; color: #fff; border-radius: 2mm; padding: 1.8mm 4mm; font-size: 5mm; font-weight: 900; }
      .bar svg { height: 6.5mm; }
      .stand { font-size: 2.4mm; color: #8a94a3; margin-top: 1mm; }
    </style></head><body><div class="blatt">
      <div class="kopf"><img src="${HUT}" alt=""><div class="club">Köcheclub Werne<small>Weihnachtsmarkt</small></div><h1>Preisliste</h1></div>
      <table><colgroup><col class="a">${spalten.map(() => '<col>').join('')}</colgroup>
        <thead><tr class="skala"><th>Anzahl&nbsp;→<small>Preise in € · Getränke inkl. Pfand</small></th>${spalten.map((n) => `<th>${n}</th>`).join('')}</tr></thead>
        ${koerper}
      </table>
      <div class="fuss">
        <div class="pfand"><b>Pfand</b> ist in den Getränkepreisen schon enthalten: ${pfandTexte.map((k) => `${esc(k.name)} ${euro(k.betrag)} €`).join(' · ')}.<br>
          Pfand gibt es bei Rückgabe von Glas bzw. Feuerzange zurück.
          <div class="stand">Stand ${stand} · Preise aus dem Artikelstamm der KC MarktKasse</div></div>
        <div class="bar"><svg viewBox="0 0 34 20"><rect x="1" y="2" width="32" height="16" rx="2" fill="#2e7d32" stroke="#fff" stroke-width="1.5"/><circle cx="17" cy="10" r="4.5" fill="none" stroke="#fff" stroke-width="1.5"/></svg>Nur Barzahlung</div>
      </div>
    </div></body></html>`;

    const name = 'Preisliste_Stand';
    const seite = await (await b.newContext({deviceScaleFactor: 2})).newPage();
    await seite.setContent(html, {waitUntil: 'load'}); await seite.waitForTimeout(200);
    await seite.pdf({path: path.join(ZIEL, name + '.pdf'), width: '297mm', height: '210mm', printBackground: true, margin: {top: 0, right: 0, bottom: 0, left: 0}});
    await seite.setViewportSize({width: 1123, height: 794});
    await (await seite.$('.blatt')).screenshot({path: path.join(ZIEL, name + '_Vorschau.png')});
    const ueberlauf = await seite.evaluate(() => { const bl = document.querySelector('.blatt'); return bl.scrollHeight > bl.clientHeight + 1; });
    if (ueberlauf) throw new Error('Preisliste passt nicht auf eine Seite - weniger Spalten (--bis=) oder Artikel pruefen');
    const unbekannt = zeilen.filter((z) => z.unbekannt).map((z) => z.name);
    console.log(`fertig: ${zeilen.length} Zeilen, Anzahl 1-${BIS} -> ${path.join(ZIEL, name + '.pdf')}`);
    if (unbekannt.length) console.log('Alkohol-Angabe fehlt im Artikelstamm: ' + unbekannt.join(', '));
  } finally { await b.close(); s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
