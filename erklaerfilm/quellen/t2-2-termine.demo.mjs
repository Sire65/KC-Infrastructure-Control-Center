// Kapitel 2.2 Termine: Max hat beim Clubabend noch nicht geantwortet; Antwort, Mitfahrt und privater Termin erscheinen danach wie beim echten Server
export default function (antw) {
  const liste = structuredClone(antw.treffen_liste), t = liste.treffen[0];
  t.meine = null; t.ja = 6; t.teilnahme = t.teilnahme.filter((x) => x.person_id !== "P1");
  const privat = [];
  antw.treffen_liste = () => liste;
  antw.init = { ...antw.init, naechstesTreffen: { ...antw.init.naechstesTreffen, meine: null, ja: 6, teilnahme: t.teilnahme } };
  antw.treffen_antwort = (q) => {
    const x = liste.treffen.find((y) => y.id === q.id), alt = x.meine;
    if (alt === "ja") x.ja--; else if (alt === "vielleicht") x.vielleicht--; else if (alt === "nein") x.nein--;
    x.teilnahme = x.teilnahme.filter((y) => y.person_id !== "P1");
    if (q.antwort !== "keine") { x[q.antwort]++; x.teilnahme.push({ person_id: "P1", name: "Max Mustermann", antwort: q.antwort, notiz: q.notiz || null }); x.meine = q.antwort; } else x.meine = null;
    return { ok: true };
  };
  antw.mitfahrt_anbieten = (q) => {
    const x = liste.treffen.find((y) => y.id === q.bezug_id);
    x.mitfahrten = [{ id: "MF1", plaetze: q.plaetze, frei: q.plaetze, mitfahrer: [], eigen: true, dabei: false, fahrer: { person_id: "P1", name: "Max Mustermann" }, treffpunkt: q.treffpunkt || null }];
    return { ok: true };
  };
  antw.privattermin_speichern = (q) => { privat.push({ ...q, id: "PT" + (privat.length + 1) }); return { ok: true }; };
  antw.privattermine_liste = () => ({ privat });
}
