// Fachliche Tests der Programmlogik: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logik.js");
const D = require("../daten.js");

const MITTWOCH = "2026-11-04";
const neu = () => D.demoDaten(MITTWOCH);
const pid = (s, vorname) => s.personen.find((p) => p.vorname === vorname).id;

test("Datum: Montag der Woche und Wochentag", () => {
  assert.equal(L.montag(MITTWOCH), "2026-11-02");
  assert.equal(L.wochentag("2026-11-08"), "so");
  assert.equal(L.plusTage("2026-12-31", 1), "2027-01-01");
});

test("Sonntag geschlossen: keine Schichten, kein Bedarf, keine Hygiene-Aufgaben", () => {
  const s = neu();
  const f = s.filialen[0];
  assert.equal(L.oeffnung(f, "2026-11-08"), null);
  assert.equal(L.bedarf(f, "2026-11-08", "frueh"), 0);
  assert.deepEqual(L.tagesliste(s, f.id, "2026-11-08", { datum: MITTWOCH, min: 600 }), []);
});

test("Springer: nur in Filialen mit Haken einsetzbar", () => {
  const s = neu();
  const jonas = s.personen.find((p) => p.vorname === "Jonas");
  assert.equal(L.darfInFiliale(jonas, "min"), true);
  assert.equal(L.darfInFiliale(jonas, "ess"), true);
  assert.equal(L.darfInFiliale(jonas, "obh"), false);
  jonas.springer = false;
  assert.equal(L.darfInFiliale(jonas, "ess"), false, "ohne Springer-Haken nur Stammfiliale");
  const lena = s.personen.find((p) => p.vorname === "Lena");
  assert.equal(L.kandidaten(s, "obh", MITTWOCH, "frueh").some((k) => k.person.id === lena.id), false);
});

test("Kandidaten: krank und 'kann nicht' sind nicht möglich, Überschneidung in anderer Filiale wird erkannt", () => {
  const s = neu();
  const lukas = pid(s, "Lukas");
  assert.equal(L.kandidaten(s, "obh", MITTWOCH, "frueh").find((k) => k.person.id === lukas).moeglich, false);
  const tag = "2026-11-10";
  s.wuensche.push({ id: "w1", personId: pid(s, "Paul"), datum: tag, art: "nicht", schicht: "egal" });
  assert.equal(L.kandidaten(s, "ess", tag, "frueh").find((k) => k.person.vorname === "Paul").moeglich, false);
  const jonas = pid(s, "Jonas");
  s.plan.push({ id: "x1", filiale: "min", datum: tag, schicht: "frueh", personId: jonas });
  const k = L.kandidaten(s, "ess", tag, "frueh").find((x) => x.person.id === jonas);
  assert.equal(k.moeglich, false);
  assert.ok(k.gruende.some((g) => g.includes("Minden")));
});

test("Planvorschlag: füllt nur bis zum Bedarf und plant niemanden doppelt", () => {
  const s = neu();
  s.plan = [];
  let n = 0;
  const mo = "2026-11-09";
  s.plan.push(...L.planVorschlag(s, "ess", mo, () => "t" + n++));
  for (const d of L.woche(mo)) for (const sch of L.SCHICHTEN) {
    const a = L.abdeckung(s, "ess", d, sch.id);
    assert.ok(a.ist <= a.soll, `${d} ${sch.id} überplant`);
    const ids = L.schichtenAm(s, d, (x) => x.schicht === sch.id).map((x) => x.personId);
    assert.equal(new Set(ids).size, ids.length);
  }
  assert.ok(n > 0);
});

test("Planvorschlag nurStamm: keine Springer", () => {
  const s = neu();
  s.plan = [];
  const neuS = L.planVorschlag(s, "ess", "2026-11-09", () => "q" + Math.random(), { nurStamm: true });
  assert.ok(neuS.every((x) => s.personen.find((p) => p.id === x.personId).stammfiliale === "ess"));
});

test("Abdeckung: krank gemeldete Person zählt nicht", () => {
  const s = neu();
  const lukas = pid(s, "Lukas");
  s.plan = [{ id: "a", filiale: "obh", datum: MITTWOCH, schicht: "frueh", personId: lukas }];
  assert.equal(L.abdeckung(s, "obh", MITTWOCH, "frueh").ist, 0);
});

test("Hygiene: Shop ohne Eismaschine bekommt keine Eismaschinen-Aufgabe, neues Gerät erzeugt sie", () => {
  const s = neu();
  const eis = s.hygiene.regeln.find((r) => r.geraetetyp === "eis");
  const hat = (fid) => L.tagesliste(s, fid, MITTWOCH, { datum: MITTWOCH, min: 600 }).some((a) => a.regel.id === eis.id);
  assert.equal(hat("obh"), false);
  assert.equal(hat("ess"), true);
  s.hygiene.geraete.push({ id: "gneu", filiale: "obh", typ: "eis", name: "Eismaschine neu", status: "aktiv" });
  assert.equal(hat("obh"), true);
});

test("Hygiene: zwei Kühlvitrinen ergeben doppelte Messaufgaben, gestörtes Gerät pausiert", () => {
  const s = neu();
  const r = s.hygiene.regeln.find((x) => x.titel === "Temperatur Kühlvitrine");
  const zahl = (fid) => L.tagesliste(s, fid, MITTWOCH, { datum: MITTWOCH, min: 600 }).filter((a) => a.regel.id === r.id).length;
  assert.equal(zahl("min"), 2 * zahl("ess"));
  s.hygiene.geraete.find((g) => g.filiale === "min" && g.typ === "vitrine").status = "gestoert";
  assert.equal(zahl("min"), zahl("ess"));
});

test("Hygiene: Zuteilung 'trifft nicht zu' entfernt die Regel nur in diesem Shop", () => {
  const s = neu();
  const r = s.hygiene.regeln.find((x) => x.titel === "Theke und Arbeitsflächen reinigen");
  s.hygiene.zuteilung[`${r.id}|min`] = { status: "nicht" };
  const hat = (fid) => L.tagesliste(s, fid, MITTWOCH, { datum: MITTWOCH, min: 600 }).some((a) => a.regel.id === r.id);
  assert.equal(hat("min"), false);
  assert.equal(hat("ess"), true);
});

test("Hygiene: ohne Durchführung nie erledigt (UNKNOWN ist nie OK)", () => {
  const s = neu();
  const liste = L.tagesliste(s, "min", "2026-11-03", { datum: MITTWOCH, min: 600 });
  assert.ok(liste.length > 0);
  assert.ok(liste.every((a) => a.status === "verpasst"));
  assert.equal(L.tagesSumme(liste).erledigt, 0);
});

test("Hygiene: Grenzwerte ok, Warnung, kritisch", () => {
  const pp = { art: "messwert", max: 7, krit: 8 };
  assert.equal(L.pruefeWert(pp, "6.9"), "ok");
  assert.equal(L.pruefeWert(pp, "7.5"), "warn");
  assert.equal(L.pruefeWert(pp, "8.1"), "kritisch");
  assert.equal(L.pruefeWert(pp, ""), "offen");
  const tk = { art: "messwert", max: -18, krit: -15 };
  assert.equal(L.pruefeWert(tk, "-20"), "ok");
  assert.equal(L.pruefeWert(tk, "-16"), "warn");
  assert.equal(L.pruefeWert(tk, "-12"), "kritisch");
});

test("Hygiene: Zuständigkeit Spätdienst kommt aus dem Einsatzplan, sonst Shopleitung", () => {
  const s = neu();
  const r = s.hygiene.regeln.find((x) => x.titel === "Boden und Abfall");
  const tag = "2026-11-10";
  s.plan = s.plan.filter((x) => x.datum !== tag);
  const ohne = L.zustaendig(s, r, "min", tag);
  assert.equal(ohne.ersatz, true);
  assert.deepEqual(ohne.ids, [pid(s, "Sandra")]);
  s.plan.push({ id: "z", filiale: "min", datum: tag, schicht: "spaet", personId: pid(s, "Lena") });
  assert.deepEqual(L.zustaendig(s, r, "min", tag).ids, [pid(s, "Lena")]);
});

test("Hygiene: Durchführung mit Abweichung zählt als Abweichung, nicht als grün", () => {
  const s = neu();
  const a = L.tagesliste(s, "min", MITTWOCH, { datum: MITTWOCH, min: 700 }).find((x) => x.regel.titel === "Temperatur Kühlvitrine");
  s.hygiene.durchfuehrungen.push({ key: a.key, personId: "p1", zeit: MITTWOCH + "T11:00:00", werte: { 0: "9" }, bewertung: "kritisch", ergebnis: "erledigt" });
  const b = L.tagesliste(s, "min", MITTWOCH, { datum: MITTWOCH, min: 700 }).find((x) => x.key === a.key);
  assert.equal(b.status, "abweichung");
});

test("Stechuhr: Arbeit und Pause, Hinweis bei fehlender Pause", () => {
  const e = [{ art: "kommen", zeit: "2026-11-04T08:00:00" }, { art: "gehen", zeit: "2026-11-04T15:00:00" }];
  const sum = L.stempelSumme(e);
  assert.deepEqual(sum, { arbeit: 420, pause: 0 });
  assert.equal(L.arbeitszeitHinweise(sum).length, 1);
  const mitPause = [{ art: "kommen", zeit: "2026-11-04T08:00:00" }, { art: "pause", zeit: "2026-11-04T11:00:00" }, { art: "weiter", zeit: "2026-11-04T11:30:00" }, { art: "gehen", zeit: "2026-11-04T15:30:00" }];
  assert.deepEqual(L.stempelSumme(mitPause), { arbeit: 420, pause: 30 });
  assert.equal(L.arbeitszeitHinweise(L.stempelSumme(mitPause)).length, 0);
  assert.equal(L.stempelStatus(mitPause), "aus");
});

test("Rezepte: Allergene aus Zutaten, Quiz mit eindeutiger richtiger Antwort", () => {
  const s = neu();
  const waffel = s.rezepte.rezepte.find((r) => r.name === "Waffel Classic");
  assert.deepEqual(L.allergeneVon(waffel), ["Ei", "Gluten", "Milch"]);
  const q = L.quiz(s.rezepte.rezepte, s.rezepte.warengruppen, 10, 7);
  assert.equal(q.length, 10);
  for (const f of q) {
    assert.equal(f.antworten.filter((x) => x === f.richtig).length, 1, f.frage);
    assert.ok(f.antworten.length >= 3);
  }
  assert.deepEqual(L.quiz(s.rezepte.rezepte, s.rezepte.warengruppen, 5, 3).map((x) => x.frage), L.quiz(s.rezepte.rezepte, s.rezepte.warengruppen, 5, 3).map((x) => x.frage));
});
