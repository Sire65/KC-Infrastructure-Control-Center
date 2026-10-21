// Demodaten Fotoalbum: freie Bilder, die schon in der Club-App liegen (raetsel/, Wikimedia Commons, Bildnachweise in raetsel/QUELLEN.md)
const B = (n) => `raetsel/${n}.webp`;
const LISTE = [
  ["altes-rathaus", "Ausflug Werne", "2026-09-12", "Altes Rathaus am Markt"], ["kirchhof", "Ausflug Werne", "2026-09-12", "Am Kirchhof"],
  ["stadtmuseum", "Ausflug Werne", "2026-09-12", "Stadtmuseum"], ["moormann", "Ausflug Werne", "2026-09-12", "Moormann-Brunnen"],
  ["sprichwort", "Ausflug Werne", "2026-09-12", "Sprichwörterbrunnen"], ["kloster", "Ausflug Werne", "2026-09-12", "Kapuzinerkloster"],
  ["kochloeffel", "Kochabend", "2026-10-08", "Unser Kochlöffel"], ["artischocke", "Kochabend", "2026-10-08", "Artischocken"],
  ["romanesco", "Kochabend", "2026-10-08", "Romanesco"], ["zitrone", "Kochabend", "2026-10-08", "Zitronen"], ["paprika", "Kochabend", "2026-10-08", "Paprika für die Suppe"],
];
const PERS = [{ person_id: "P2", name: "Erika Beispiel" }, { person_id: "P1", name: "Max Mustermann" }, { person_id: "P3", name: "Paul Probe" }];
const fotos = LISTE.map(([n, thema, datum, beschreibung], i) => ({ id: `00000000-0000-4000-8000-0000000000${String(i).padStart(2, "0")}`, thema, datum, beschreibung, bezug_art: null, bezug_id: null,
  von: PERS[i % 3], vorschau: B(n), darfAendern: PERS[i % 3].person_id === "P1", meta: null, hochgeladen: datum + "T18:00:00Z" })).reverse();
const alben = [
  { id: "a0000000-0000-4000-8000-000000000001", name: "Ausflug Werne", jahr: 2026, sichtbar: "alle", eigen: false, von: "Erika Beispiel", darfAendern: false, anzahl: 6, titelfoto: null, deckel: B("altes-rathaus") },
  { id: "a0000000-0000-4000-8000-000000000002", name: "Kochabend Oktober", jahr: 2026, sichtbar: "alle", eigen: true, von: "Max Mustermann", darfAendern: true, anzahl: 5, titelfoto: null, deckel: B("paprika") },
];
const url = Object.fromEntries(fotos.map((f) => [f.id, f.vorschau]));
export default function (antw) {
  antw.fotos_liste = (q) => {
    const album = alben.find((a) => a.id === q.album_id) || null;
    let f = fotos;
    if (album) f = fotos.filter((x) => x.thema === (album.name.startsWith("Ausflug") ? "Ausflug Werne" : "Kochabend"));
    if (q.thema) f = f.filter((x) => x.thema === q.thema);
    return { fotos: f, themen: [{ thema: "Ausflug Werne", anzahl: 6 }, { thema: "Kochabend", anzahl: 5 }], jahre: [{ jahr: "2026", anzahl: 11 }], anlaesse: [],
      speicher: { belegt: 50e6, grenze: 1073741824, prozent: 4.7, fotosMoeglich: 3000 }, papierkorb: 0, alben, albenKorb: 0, album };
  };
  antw.foto_album_fotos = (q) => antw.fotos_liste(q);
  antw.foto_oeffnen = (q) => ({ url: url[q.id], name: "foto.webp" });
  antw.fotos_neueste = () => ({ fotos: fotos.slice(0, 4) });
}
