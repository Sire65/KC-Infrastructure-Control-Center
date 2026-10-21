// Erfundene Dienstdaten für Kapitel 2.5 (Max Mustermann, Erika Beispiel, Paul Probe – wie demo.mjs) – keine echten Mitgliederdaten.
// Weihnachtsmarkt 2.–14.12.2026 wie in DP2s Grundeinstellung. Nach „Angaben speichern“ zeigt Mein Dienst „abgegeben“.
export default (antw) => {
  let abgegeben = false;
  const WM = "Weihnachtsmarkt 2026";
  const PERSONEN = [{ person_id: "P1", name: "Max Mustermann", vorname: "Max", ich: true }, { person_id: "P2", name: "Erika Beispiel", vorname: "Erika", ich: false }, { person_id: "P3", name: "Paul Probe", vorname: "Paul", ich: false }];
  const DIENSTE = [
    { person_id: "P1", datum: "2026-12-04", start: "16:00", ende: "22:00", bereich: "Vorne", pause: 30 }, { person_id: "P1", datum: "2026-12-06", start: "11:00", ende: "17:00", bereich: "Hinten", pause: 30 },
    { person_id: "P1", datum: "2026-12-11", start: "17:00", ende: "23:00", bereich: "Vorne", pause: 30 },
    { person_id: "P2", datum: "2026-12-04", start: "14:00", ende: "20:00", bereich: "Vorne", pause: 30 }, { person_id: "P2", datum: "2026-12-11", start: "18:00", ende: "23:00", bereich: "Vorne", pause: 0 },
    { person_id: "P3", datum: "2026-12-05", start: "12:00", ende: "18:00", bereich: "Hinten", pause: 30 }, { person_id: "P3", datum: "2026-12-12", start: "11:00", ende: "17:00", bereich: "Hinten", pause: 30 },
  ];
  antw.dienstwunsch_laden = { ich: { personId: "P1", name: "Max Mustermann" }, wunschphase: { status: "open" }, veranstaltung: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026",
    meine: { entries: [], standby: {} }, kollegen: [], teilen: [], schichten: [], tage: [], mitglieder: [] };
  antw.dienstwunsch_speichern = () => { abgegeben = true; return { ok: true }; };
  antw.eingaben_bestaetigen = { ok: true };
  antw.mein_dienst = () => ({
    wunsch: abgegeben ? { status: "offen", tage: 1, veranstaltung: WM, abgegeben: new Date().toISOString(), phase: "offen", schluss: "2026-11-15T18:00:00Z" } : { veranstaltung: WM, phase: "offen", schluss: "2026-11-15T18:00:00Z" },
    soll: { anzahl: 3, monat: 0, naechste: DIENSTE.filter((d) => d.person_id === "P1").map(({ datum, start, ende, bereich }) => ({ datum, start, ende, bereich })) },
    ist: { anzahl: 0 },
  });
  antw.dienste = (q) => {
    const gewaehlt = q.personen?.length ? q.personen : ["P1"];
    return { personen: PERSONEN, gewaehlt, freigabe: false, veranstaltung: WM, stand: "2026-11-20T10:00:00Z", wuensche: [], wunschTage: null, wunschPersonen: [],
      dienste: DIENSTE.filter((d) => gewaehlt.includes(d.person_id) && d.datum >= q.von && d.datum <= q.bis) };
  };
  const e = (d, t, s, en) => ({ d: `2026-12-${String(d).padStart(2, "0")}`, t, s, e: en });
  antw.dienst_uebersicht = { veranstaltung: WM, nurFreigegeben: true, personen: [
    { id: "P1", name: "Max Mustermann", eintraege: [e(4, "available", 16, 22), e(4, "preferred", 16, 22), e(6, "available", 11, 18), e(11, "available", 16, 23), e(13, "unavailable", 8, 24)] },
    { id: "P2", name: "Erika Beispiel", eintraege: [e(2, "available", 8, 18), e(4, "available", 12, 20), e(4, "preferred", 14, 20), e(5, "if_needed", 14, 20), e(11, "available", 17, 23), e(12, "available", 11, 19)] },
    { id: "P3", name: "Paul Probe", eintraege: [e(3, "available", 8, 18), e(5, "available", 11, 19), e(5, "preferred", 12, 18), e(7, "unavailable", 8, 24), e(12, "available", 11, 17), e(14, "available", 8, 15)] },
  ] };
};
