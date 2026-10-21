// Demodaten für Kapitel 2.11 „Mitmachen“: Vorschläge mit offener Abstimmung, Helfen & Leihen, Erstattung, Feedback.
// Erfundene Namen aus demo.mjs. Die Antworten merken sich, was im Film angetippt wird (Stimme, 👍, neues Thema, Zusage).
const T = (tage, h = 18, m = 0) => { const d = new Date(); d.setDate(d.getDate() + tage); d.setHours(h, m, 0, 0); return d.toISOString(); };
const tag = (tage) => { const d = new Date(); d.setDate(d.getDate() + tage); return d.toISOString().slice(0, 10); };
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
export default function (antw) {
  const treffen = { id: "T1", titel: "Clubabend Oktober", beginn: T(5, 19, 30) };
  const V = [
    { id: "V1", art: "abstimmung", status: "offen", titel: "Wohin geht unser Sommerausflug?", beschreibung: "Bitte stimmt bis zum Clubabend ab.", von: { name: "Erika Beispiel" },
      erstellt_am: vor(2880), frist: T(5, 18, 0), geheim: false, optionen: ["Münsterland", "Sauerland", "Ruhrgebiet"], stimmen: 9, berechtigt: 18, meine: null, abgestimmt: false, treffen: null,
      ergebnis: [{ option: "Münsterland", anzahl: 4, namen: ["Erika", "Paul", "Otto", "Uwe"] }, { option: "Sauerland", anzahl: 3, namen: ["Klara", "Rita", "Lena"] }, { option: "Ruhrgebiet", anzahl: 2, namen: ["Anna", "Kurt"] }] },
    { id: "V2", art: "thema", status: "offen", titel: "Neue Schürzen für alle", beschreibung: "Unsere Schürzen sind in die Jahre gekommen.", von: { name: "Paul Probe" }, erstellt_am: vor(1440),
      ergebnis: [{ option: "dafuer", anzahl: 3, namen: ["Paul", "Erika", "Otto"] }], meine: null, treffen },
    { id: "V3", art: "thema", status: "offen", titel: "Kochkurs für Kinder im Frühjahr", von: { name: "Klara Koch" }, erstellt_am: vor(700),
      ergebnis: [{ option: "dafuer", anzahl: 5, namen: ["Klara", "Rita", "Uwe", "Lena", "Paul"] }], meine: null, treffen },
  ];
  antw.vorschlaege_liste = () => ({ vorschlaege: V, treffen: [treffen], spenden: null });
  antw.vorschlag_stimme = (q) => {
    const v = V.find((x) => x.id === q.id); if (!v) return { ok: true };
    if (v.art === "abstimmung") {
      if (v.meine) { const e = v.ergebnis.find((x) => x.option === v.meine); e.anzahl--; e.namen = e.namen.filter((n) => n !== "Max"); v.stimmen--; }
      v.meine = q.wahl; v.abgestimmt = !!q.wahl;
      if (q.wahl) { const e = v.ergebnis.find((x) => x.option === q.wahl); e.anzahl++; e.namen.push("Max"); v.stimmen++; }
    } else {
      const e = v.ergebnis[0]; if (q.wahl && !v.meine) { e.anzahl++; e.namen.push("Max"); } if (!q.wahl && v.meine) { e.anzahl--; e.namen = e.namen.filter((n) => n !== "Max"); }
      v.meine = q.wahl ? "dafuer" : null;
    }
    return { ok: true };
  };
  antw.vorschlag_speichern = (q) => {
    V.push({ id: "V" + (V.length + 1), art: q.art || "thema", status: "offen", titel: q.titel || "Neuer Vorschlag", beschreibung: q.beschreibung || "", von: { name: "Max Mustermann" },
      erstellt_am: new Date().toISOString(), ergebnis: [{ option: "dafuer", anzahl: 0, namen: [] }], meine: null, treffen: q.treffen_id ? treffen : null, darfBearbeiten: true, darfZurueckziehen: true });
    return { ok: true, versand: { gesendet: 2 } };
  };
  // Helfen & Leihen: ein offener Aufruf, ein Angebot
  const H = { aufrufe: [
      { id: "H1", art: "aufbau", datum: tag(3), slot: "vormittag", anzahl: 4, komme: ["Otto Muster"], offen: true, eigen: false, von: { name: "Erika Beispiel", vorname: "Erika" },
        ort: "Marktplatz", notiz: "Wobei: Aufbau der Weihnachtsmarkt-Hütte\nBitte Arbeitshandschuhe mitbringen.", meine: null, nachAbsprache: false } ],
    angebote: [{ id: "A1", sym: "🔪", titel: "Messer schleifen", text: "Ich schleife eure Küchenmesser – einfach anfragen.", von: { name: "Uwe Winter", vorname: "Uwe" }, eigen: false }],
    arten: { aufbau: "🎪 Aufbau", einkauf: "🛒 Einkauf", kochen: "🍳 Kochen" }, zeitfenster: { vormittag: "🌅 Vormittag (9–12 Uhr)", nachmittag: "☀️ Nachmittag" }, orte: ["Marktplatz", "Vereinsheim"] };
  antw.hilfe_liste = () => H;
  antw.hilfe_antwort = (q) => {
    const a = H.aufrufe.find((x) => x.id === q.id); if (!a) return { ok: true };
    a.komme = a.komme.filter((n) => n !== "Max Mustermann"); if (q.antwort === "komme") a.komme.push("Max Mustermann"); a.meine = q.antwort || null;
    return { ok: true };
  };
  antw.leihen_liste = () => ({ sachen: [], reservierungen: [] });
  antw.boerse_liste = () => ({ eintraege: [] });
  // Erstattung: Kilometer-Pauschale und Gründe
  antw.erstattung_meine = () => ({ kmSatz: 0.3, standard: 0.3, saetze: [], gruende: ["Clubabend", "Einkauf für den Club", "Weihnachtsmarkt", "Kochen in Dortmund"], arten: null,
    antraege: [], besucheAbgerechnet: [], sondereinsaetze: [], empfaengerDa: true });
  // Feedback: drei Fragen in Schritt 1
  antw.feedback_meins = () => ({ antwort: null, umgesetzt: [], fragen: [
    { id: "gesamt", schritt: 1, art: "eins", t: "Wie gefällt dir die Club-App?", optionen: ["😍 Sehr gut", "🙂 Gut", "😐 Geht so", "🙁 Nicht gut"] },
    { id: "bedienung", schritt: 1, art: "eins", t: "Kommst du mit der Bedienung zurecht?", optionen: ["👍 Ja, gut", "🤏 Meistens", "🤔 Eher schwer"] },
    { id: "wunsch", schritt: 2, art: "mehr", t: "Was nutzt du am meisten?", optionen: ["💬 Nachrichten", "📅 Termine", "📌 Pinnwand", "🗓️ Dienstplan"] } ] });
  antw.suche = () => ({ bereiche: [] }); // Lupe: nur die Funktionen der App (ohne Server-Treffer)
  antw.feedback_senden = () => ({ ok: true, geaendert_am: new Date().toISOString() });
}
