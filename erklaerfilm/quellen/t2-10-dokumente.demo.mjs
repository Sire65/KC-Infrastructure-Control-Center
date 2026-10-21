// Demodaten für Kapitel 2.10: erfundene Protokolle, „Meine Daten“ von Max Mustermann und Änderungsmeldungen (merkt sich, was im Film gemeldet wird)
const T = (tage) => { const d = new Date(); d.setDate(d.getDate() + tage); return d.toISOString(); };
const tag = (tage) => T(tage).slice(0, 10);
const verf = (name) => ({ person_id: "P2", name });
const PROTOKOLLE = [
  { id: "PR3", titel: "Sitzung des Köcheclubs, 05.10.26", datum: tag(-16), ort: "Vereinsheim", status: "einspruch", einspruch_bis: T(3), gelesen: false, version: 1, verfasser: verf("Erika Beispiel"), anlagen: 0, aufgabenOffen: 1, einwaende: 0, darfBearbeiten: false },
  { id: "PR2", titel: "Sitzung des Köcheclubs, 07.09.26", datum: tag(-44), ort: "Vereinsheim", status: "genehmigt", gelesen: true, version: 1, verfasser: verf("Paul Probe"), anlagen: 1, aufgabenOffen: 0, einwaende: 0, darfBearbeiten: false },
  { id: "PR1", titel: "Sitzung des Köcheclubs, 03.08.26", datum: tag(-79), ort: "In der Gartenhütte bei Klara", status: "genehmigt", gelesen: true, version: 2, verfasser: verf("Erika Beispiel"), anlagen: 0, aufgabenOffen: 0, einwaende: 0, darfBearbeiten: false },
];
const leute = (l) => l.map((name, i) => ({ person_id: "P" + (i + 1), name }));
const LADEN = {
  protokoll: { id: "PR3", titel: "Sitzung des Köcheclubs, 05.10.26", datum: tag(-16), ort: "Vereinsheim", status: "einspruch", roh: "veroeffentlicht", einspruch_bis: T(3), version: 1,
    verfasser: verf("Erika Beispiel"), anwesend: leute(["Max Mustermann", "Erika Beispiel", "Paul Probe", "Otto Muster", "Uwe Winter"]), entschuldigt: leute(["Klara Koch", "Rita Sommer"]), gaeste: "",
    tagesordnung: ["Begrüßung", "Rückblick Sommerfest", "Planung Weihnachtsmarkt", "Verschiedenes"],
    beschluesse: ["Wir stehen wieder mit zwei Ständen auf dem Weihnachtsmarkt.", "Neue Schürzen werden bestellt."],
    kurzfassung: "Das Sommerfest war ein schöner Erfolg. Für den Weihnachtsmarkt tragen alle ihre Wunschzeiten in der App ein.", naechster_termin: "Clubabend am Montag, 19:30 Uhr" },
  anlagen: [], aufgaben: [{ id: "A1", text: "Schürzen-Größen sammeln", name: "Max Mustermann", faellig: tag(10), erledigt_am: null, meine: true, verwalten: false, mit: [] }],
  einwaende: [], gelesen: { von: ["Erika", "Paul", "Otto"], fehlt: ["Max", "Uwe"] }, fassungen: [], nachtraege: [], darfBearbeiten: false, darfLoeschen: false,
};
export default (antw) => {
  const meine = [];
  antw.protokolle_liste = { protokolle: PROTOKOLLE, aufgaben: [], treffenOhneProtokoll: [] };
  antw.protokoll_laden = () => { PROTOKOLLE[0].gelesen = true; return LADEN; };
  antw.meine_daten = {
    stand: T(0),
    person: { nummer: "0815", name: "Max Mustermann", vorname: "Max", nachname: "Mustermann", rufname: "Max", email: "max.mustermann@example.org", telefon: "0170 0000000",
      geburtstag: "1958-04-12", strasse: "Musterweg 1", plz: "59368", ort: "Werne", seit: "2024-05-01T10:00:00Z" },
    zugang: { aktiv: true, erstellt: "2026-06-23T10:00:00Z", erstmals: "2026-06-23T18:00:00Z", zuletzt: T(0), version: "2.553.0" },
    rollen: { admin: false, clubleitung: false, aemter: [], protokolle: true, kontakte: true, buero: null },
    benachrichtigung: [{ bereich: "termine", push: true, email: true }, { bereich: "nachrichten", push: true, email: false }],
    status: { status: "verfuegbar" }, einstellungen: [1, 2, 3, 4, 5, 6], geraete: [{ art: "Android-Handy", seit: "2026-06-23T10:00:00Z" }],
    anzahl: { nachrichten: 42, zettel: 3, fotos: 5, dokumente: 2, erstattungen: 1, aenderungen: 0, vorschlaege: 2, gemerkt: 1, protokoll: 12 },
  };
  const arten = [
    ["anschrift", "🏠", "Neue Anschrift", ["Clubsprecher", "Kassenwart", "Admin"], { gilt: true, alle: true, felder: [{ k: "strasse", t: "Straße und Hausnummer", pflicht: true }, { k: "plz", t: "PLZ", typ: "plz", pflicht: true }, { k: "ort", t: "Ort", pflicht: true }] }],
    ["name", "🪪", "Neuer Name", ["Clubsprecher", "Kassenwart", "Admin"], { gilt: true, felder: [{ k: "vorname", t: "Vorname" }, { k: "nachname", t: "Nachname" }] }],
    ["handy", "📱", "Neue Handynummer", ["Kassenwart", "Admin"], { alle: true, felder: [{ k: "nummer", t: "Handynummer", typ: "tel", pflicht: true }] }],
    ["festnetz", "☎️", "Neue Festnetznummer", ["Kassenwart", "Admin"], { alle: true, felder: [{ k: "nummer", t: "Festnetznummer", typ: "tel", pflicht: true }] }],
    ["mail", "✉️", "Neue E-Mail-Adresse", ["Admin"], { alle: true, felder: [{ k: "mail", t: "E-Mail-Adresse", typ: "email", pflicht: true }] }],
    ["kleidung", "👕", "Kleidergröße", ["Clubsprecher", "Kassenwart", "Admin"], { auto: true, felder: [{ k: "kochjacke", t: "Kochjacke", typ: "wahl", opt: ["S", "M", "L", "XL", "XXL"] }] }],
    ["sonstiges", "💬", "Sonstiges", ["Clubsprecher", "Kassenwart", "Admin"], { waehlbar: ["Clubsprecher", "Kassenwart", "admin"], felder: [{ k: "text", t: "Was hat sich geändert?", typ: "lang", pflicht: true }] }],
  ].map(([id, sym, t, anText, x]) => ({ id, sym, t, an: x.waehlbar ? [] : anText, anText, ...x }));
  const stand = { anschrift: { strasse: "Musterweg 1", plz: "59368", ort: "Werne" }, name: { vorname: "Max", nachname: "Mustermann" }, handy: { nummer: "0170 0000000" },
    festnetz: { nummer: "" }, mail: { mail: "max.mustermann@example.org" }, kleidung: { kochjacke: "L" } };
  antw.aenderung_start = () => ({ arten, anNamen: { Clubsprecher: "Clubsprecher", Kassenwart: "Kassenwart", admin: "Admin" }, stand, meine });
  antw.aenderung_senden = (q) => { meine.unshift({ id: "AE" + (meine.length + 1), art: q.art, neu: q.neu, gilt_ab: q.gilt_ab, status: "offen", erstellt_am: new Date().toISOString(), antwort: null, ansprech: null });
    return { ok: true, auto: false, an: arten.find((a) => a.id === q.art)?.anText || [], alle: null, abgelegt: false }; };
};
