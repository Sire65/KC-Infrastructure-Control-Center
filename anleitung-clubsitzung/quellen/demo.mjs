// Beispieldaten für den Anleitungsfilm „Clubsitzung vorbereiten“ – erfundene Mitglieder, keine echten Mitgliederdaten.
// Klaus (Clubsprecher) und Hansi (Admin) sind die beiden Personen aus dem Auftrag; alle anderen Namen sind erfunden.
// Antworten im Format des Club-Servers (supabase/functions/kc-club/index.ts der Club-App), damit die echte Oberfläche sie zeigt.
export const SITZUNG = "2026-10-30T19:00:00+01:00"; // Freitag, 30.10.2026, 19 Uhr
export const MITTAG = "2026-10-30T12:15:00+01:00";
export const ABEND = "2026-10-30T19:05:00+01:00";
const ICH_KLAUS = { person_id: "P1", name: "Klaus Clubsprecher", vorname: "Klaus", admin: false, vorstand: true, aemter: ["Clubsprecher"], protokolle: true, kontakte: true, buero: "schreiben" };
const ICH_ERIKA = { person_id: "P2", name: "Erika Beispiel", vorname: "Erika", admin: false, vorstand: false, aemter: [], protokolle: true, kontakte: true, buero: null };
// [id, Name, Antwort auf die Einladung, Notiz]
const LEUTE = [
  ["P1", "Klaus Clubsprecher", "ja"], ["P2", "Erika Beispiel", "ja"], ["P3", "Paul Probe", "ja"], ["P4", "Klara Koch", "vielleicht", "komme später"],
  ["P5", "Otto Muster", "nein", "Urlaub"], ["P6", "Rita Sommer", null], ["P7", "Uwe Winter", "ja"], ["P8", "Lena Herbst", null],
  ["P9", "Hans-Joachim Koch", "ja"], ["P10", "Bernd Brot", "ja"], ["P11", "Gabi Gans", "nein", "krank"], ["P12", "Jens Jung", null], ["P13", "Moni Mehl", "vielleicht"],
];
const treffen = { id: "T1", titel: "Clubsitzung November", beginn: SITZUNG, ende: null, ort: "Vereinsheim", beschreibung: null, status: "geplant", art: "treffen", ganztaegig: false, gastgeber: null,
  teilnahme: LEUTE.filter((l) => l[2]).map(([id, name, antwort, notiz]) => ({ person_id: id, name, antwort, notiz: notiz || null })), ja: 6, nein: 2, vielleicht: 2, meine: "ja", mitfahrten: [], mitfahrtSuche: [] };
const VORSCHLAEGE = [
  { id: "V1", art: "thema", titel: "Planung Weihnachtsmarkt", text: "Planung Weihnachtsmarkt: Dienstplan und Einkauf", fuerDiese: true, dringend: null, status: "offen", unterstuetzt: 6, von: "Erika" },
  { id: "V2", art: "thema", titel: "Neue Schürzen", text: "Neue Schürzen mit Club-Logo", fuerDiese: true, dringend: null, status: "offen", unterstuetzt: 4, von: "Paul" },
  { id: "V3", art: "thema", titel: "Ausflug", text: "Ausflug im Frühjahr: Spargelhof", fuerDiese: false, dringend: null, status: "offen", unterstuetzt: 3, von: "Uwe" },
  { id: "V4", art: "spende", titel: "Spende", text: "Spende an die Tafel Werne", fuerDiese: false, dringend: null, status: "offen", unterstuetzt: 5, von: "Klara" },
];
const AUFGABEN = [{ wer: "Paul Probe", text: "Angebot für Schürzen einholen", faellig: "2026-10-30", erledigt: false }, { wer: "Erika Beispiel", text: "Standplatz Weihnachtsmarkt bestätigen", faellig: null, erledigt: false }];
const TOP_STANDARD = [{ t: "Begrüßung", art: "fest" }, { t: "Genehmigung des letzten Protokolls", art: "fest" }, { t: "Bericht des Kassenwarts", art: "fest" },
  { t: VORSCHLAEGE[0].text, art: "vorschlag", id: "V1" }, { t: VORSCHLAEGE[1].text, art: "vorschlag", id: "V2" }, { t: "Verschiedenes", art: "fest" }];
const mitglieder = (zusage) => LEUTE.map(([id, name, antwort, notiz]) => ({ person_id: id, name, ...(zusage ? { zusage: antwort } : { antwort, notiz: notiz || null }) }));

// Zustand, den die Aufnahme verändert (Speichern, Packen, Abhaken …) – wie der echte Server, nur im Speicher
export function zustand() {
  const S = { vorbereitung: null, einladung_am: null, tasche: null, ca: { anwesend: new Set(["P1", "P2", "P3", "P7", "P9", "P10"]), erledigt: new Set() }, live: null };
  const sitzung = () => ({ treffen: { id: "T1", titel: treffen.titel, beginn: SITZUNG, ort: "Vereinsheim" }, mitglieder: mitglieder(false), vorschlaege: VORSCHLAEGE,
    anmerkungVorschlag: "Protokoll vom 25.09.2026 ist genehmigt (keine Einsprüche).", letztes: { titel: "Clubsitzung Oktober", datum: "2026-09-25", status: "veroeffentlicht" }, aufgaben: AUFGABEN,
    vorbereitung: S.vorbereitung ? { ...S.vorbereitung, einladung_am: S.einladung_am, erinnerung_am: null } : null,
    standard: { anwesend: LEUTE.filter((l) => l[2] === "ja").map((l) => l[0]), tagesordnung: TOP_STANDARD, zeilen: 5 }, protokoll: S.vorbereitung ? { id: "PR1", status: "entwurf" } : null, zeilenWahl: [0, 3, 5, 8, 12] });
  const top = () => (S.vorbereitung?.tagesordnung || TOP_STANDARD);
  const vorschlag = () => [
    { k: "tagesordnung", reg: "einladung", art: "tagesordnung", ref: "T1", titel: "Tagesordnung & Einladung", vor: true, grund: S.einladung_am ? "Einladung verschickt am Fr. 30.10. 12:20" : "Tagesordnung ist vorbereitet" },
    { k: "protokoll:PR1", reg: "protokolle", art: "protokoll", ref: "PR1", titel: "Protokollentwurf für diesen Abend", grund: "wird an diesem Abend geschrieben", vor: true },
    { k: "protokoll:PR0", reg: "protokolle", art: "protokoll", ref: "PR0", titel: "Letztes Protokoll vom 25.09.2026", grund: "zum Nachlesen und Genehmigen", vor: true },
    { k: "vorschlag:V1", reg: "vorschlaege", art: "vorschlag", ref: "V1", titel: VORSCHLAEGE[0].text, grund: "Thema für diesen Termin", vor: true },
    { k: "vorschlag:V2", reg: "vorschlaege", art: "vorschlag", ref: "V2", titel: VORSCHLAEGE[1].text, grund: "Thema für diesen Termin", vor: true },
    { k: "teilnehmer", reg: "mitglieder", art: "teilnehmer", ref: "T1", titel: "Zusagen & Absagen – Liste zum Abhaken", grund: "6 zugesagt", vor: true },
    { k: "aufgaben", reg: "aufgaben", art: "aufgaben", ref: "T1", titel: "Offene Aufgaben aus dem letzten Protokoll (2)", grund: "nachfragen, was erledigt ist", vor: true },
  ];
  const tasche = () => S.tasche ? { ...S.tasche, inhalt: S.tasche.inhalt.map((i) => ({ ...i })) } : null;
  const ca = (leitung) => ({ aktiv: true, leitung, treffen: { id: "T1", titel: treffen.titel, beginn: SITZUNG, ort: "Vereinsheim" },
    tagesordnung: top().map((x, i) => ({ k: "top" + i, t: x.t, erledigt: S.ca.erledigt.has("top" + i), vorschlag: x.art === "vorschlag", von: VORSCHLAEGE.find((v) => v.id === x.id)?.von || null, stimmen: VORSCHLAEGE.find((v) => v.id === x.id)?.unterstuetzt || 0 })),
    anwesend: LEUTE.filter((l) => S.ca.anwesend.has(l[0])).map(([id, name]) => ({ person_id: id, name })), mitglieder: mitglieder(true),
    aktentasche: S.tasche ? { anzahl: S.tasche.inhalt.length, vorlaeufig: S.tasche.status === "vorlaeufig" } : null, album: null,
    geburtstage: [{ name: "Klara Koch", tag: "2026-10-12", heute: false }], aufgaben: AUFGABEN.map((a) => ({ wer: a.wer, text: a.text, faellig: a.faellig })), protokoll: { id: "PR1" }, letztesProtokoll: true });
  const live = (leiter, meine) => S.live ? { ...S.live, leiter, meine: meine ?? null, kalender: [] } : null;
  const antworten = (rolle) => ({
    init: (b) => ({ ...b, ich: rolle === "erika" ? ICH_ERIKA : ICH_KLAUS }),
    mitglieder: { aemter: ["Clubsprecher", "Kassenwart"], onlineSichtbar: true, mitglieder: LEUTE.map(([id, name], i) => ({ person_id: id, name, vorname: name.split(" ")[0], vorstand: id === "P1" || id === "P3", aemter: id === "P1" ? ["Clubsprecher"] : id === "P3" ? ["Kassenwart"] : [], admin: id === "P9",
      status: null, online: id === "P9", zuletztDa: { online: id === "P9" }, verborgen: false, heute: true, wege: { push: true, mail: true, whatsapp: i % 2 === 0 }, aktiv: true })) },
    mitglied_details: { kontakt: { mail: "hansi@example.de", handy: "0170 0000009" } },
    buero_start: () => ({ sitzungen: [{ ...treffen, vorbereitet: !!S.vorbereitung, einladung_am: S.einladung_am, erinnerung_am: null, ja: 6, nein: 2, ohne: 3 }], eingang: { vorschlaege: 2 } }),
    buero_nachher: { sitzungen: [] }, eingang_korb: { posten: [] },
    buero_sitzung: () => sitzung(),
    buero_speichern: (q) => { S.vorbereitung = { anwesend: q.anwesend, anmerkung: q.anmerkung, tagesordnung: q.tagesordnung, zeilen: q.zeilen }; return { ok: true, protokoll_id: "PR1", protokollStand: "angelegt" }; },
    buero_einladung: (q) => { S.einladung_am = MITTAG; return { ok: true, empfaenger: q.ziel ? q.ziel.ids.length : LEUTE.length - 1 }; },
    aktentasche_termine: () => ({ termine: [{ id: "T1", titel: treffen.titel, beginn: SITZUNG, ort: "Vereinsheim", art: "treffen", tasche: S.tasche ? { status: S.tasche.status, anzahl: S.tasche.inhalt.length } : null },
      { id: "T2", titel: "Weihnachtsmarkt Aufbau", beginn: "2026-11-27T09:00:00+01:00", ort: "Marktplatz", art: "veranstaltung", tasche: null }], frueher: [] }),
    aktentasche_holen: () => ({ treffen: { id: "T1", titel: treffen.titel, beginn: SITZUNG, ort: "Vereinsheim", art: "treffen" }, tasche: tasche(), vorschlag: vorschlag(), blatt: {}, register: ["einladung", "protokolle", "vorschlaege", "mitglieder", "aufgaben", "sonstiges"] }),
    aktentasche_aendern: (q) => {
      if (!S.tasche) S.tasche = { inhalt: [], notiz: "", status: "offen", geaendert: null, gepackt: null };
      if (q.op === "packen") for (const i of vorschlag().filter((v) => q.keys.includes(v.k))) { const { vor: _v, grund: _g, ...rest } = i; S.tasche.inhalt.push({ ...rest, dabei: false, vonName: "Klaus", neu: false }); }
      if (q.op === "dabei") { const i = S.tasche.inhalt.find((x) => x.k === q.k); if (i) i.dabei = q.an; }
      if (q.op === "status") { S.tasche.status = q.status; S.tasche.gepackt = "Klaus"; }
      if (q.op === "notiz") { S.tasche.notiz = q.notiz; S.tasche.geaendert = "Klaus"; }
      return { tasche: tasche() };
    },
    clubabend: () => ca(rolle !== "erika"),
    clubabend_setzen: (q) => { if (q.anwesend) q.an ? S.ca.anwesend.add(q.anwesend) : S.ca.anwesend.delete(q.anwesend); if (q.erledigt) q.an ? S.ca.erledigt.add(q.erledigt) : S.ca.erledigt.delete(q.erledigt); return ca(true); },
    live_termin_vorschlag: { titel: "Clubsitzung Dezember", beginn: "2026-11-27T19:00:00+01:00", ort: "Vereinsheim" },
    live_termin_start: (q) => { S.live = { id: "U1", status: "offen", titel: q.titel, ort: q.ort, von: "Klaus", option: { id: "O1", beginn: q.beginn }, zahlen: { ja: 0, vielleicht: 0, nein: 0 }, namen: { ja: [], vielleicht: [], nein: [] }, alternativen: 0 }; return { ok: true }; },
    live_termin_holen: () => ({ live: live(rolle !== "erika", rolle === "erika" ? S.erikaWahl : "ja") }),
    terminumfrage_antwort: (q) => { if (rolle === "erika") S.erikaWahl = q.antwort || null; return { ok: true }; },
    terminumfrage_festlegen: () => { S.live = { ...S.live, status: "festgelegt", treffen: { id: "T3", titel: S.live.titel, beginn: S.live.option.beginn, ort: S.live.ort } }; return { ok: true }; },
    unterhaltungen: { unterhaltungen: [{ id: "G1", betreff: "", teilnehmer: [], anzahl: 5, gruppe: { name: "Küchenteam", symbol: "🍳" }, personen: ["P1", "P2", "P3", "P7", "P10"], letzte: null, ungelesen: 0, aktualisiert: MITTAG }] },
  });
  return { S, antworten };
}

// Grundantworten (Start der App) – Form wie KC-Clubapp/tools/anleitung/demo.mjs
export const ANTWORTEN = {
  init: { ich: ICH_KLAUS, status: { status: "verfuegbar", hinweis: null, bis: null }, server: "1.59.0", ungelesen: 0, ungelesenLaut: 0, offeneAbstimmungen: 0, naechsterDienst: null,
    benachrichtigung: { termine: { push: true, email: true }, nachrichten: { push: true, email: false }, vorschlaege: { push: true, email: false }, dienste: { push: true, email: false }, geburtstage: { push: true, email: false }, pinnwand: { push: true, email: false } },
    hatMail: true, geburtstageHeute: [], geburtstagFreigabe: false, runderGeburtstagFreigabe: false, hatGeburtstag: false, kontaktFreigabe: { handy: true, festnetz: false, mail: true, adresse: false },
    terminfindungOffen: [], wartung: { an: false, hinweis: null, seit: null }, communicator: { farbe: "gruen", text: "KC Communicator: läuft" }, notfall: null,
    einstellungen: { ansicht: { art: "erweitert", gewaehlt: true }, begruessung: { gesehen: true }, tipps: { an: false }, design: { design: "klassik", modus: "tag" } },
    kalenderAbo: null, meineAufgaben: [], protokolleUngelesen: 0, naechstesTreffen: treffen, mitgliederAnzahl: LEUTE.length, vapidPublicKey: null,
    pinnwandFristen: { erinnernTage: 3, pauseTage: 7, geaendertAm: null }, anrufAntworten: { texte: ["⏳ Bin gerade beschäftigt"], geaendertAm: null } },
  online: { zeigen: true, online: [], verpasst: [], klopfen: [], antworten: [], anrufe: [] },
  treffen_liste: { treffen: [treffen], geburtstage: [] }, terminumfragen_liste: { umfragen: [] }, terminanfragen_liste: { anfragen: [] }, privattermine_liste: { privat: [] },
  pinnwand: { max: 4, zeichen: 200, meine: 0, zettel: [] }, pinnwand_neu: { neu: [] },
  kalender: { treffen: [treffen], dienste: [], fristen: [], geburtstage: [], aktionen: [], anfragen: [], privat: [] },
  lebenszeichen: { ok: true, grund: null }, standort_liste: { standorte: [] }, wetter: { daten: null, fehler: "Testmodus" },
  ping: { ok: true, server: "1.59.0", zeit: new Date().toISOString(), dbMs: 5, wartung: { an: false } },
};
export const TREFFEN = treffen;
