// Kapitel 2.3 Pinnwand: Demo-Pinnwand merkt sich, was im Film passiert (Erledigt, neuer Zettel, Antwort, Abnehmen) – nur im Browser des Films
export default function (antw) {
  const P = JSON.parse(JSON.stringify(antw.pinnwand)); let n = 0;
  const jetzt = () => new Date().toISOString();
  antw.pinnwand = () => ({ ...P, meine: P.zettel.filter((z) => z.vonMir).length });
  antw.pinnwand_erledigt = (q) => { const z = P.zettel.find((x) => x.id === q.id); if (z) z.erledigt = q.zurueck ? null : jetzt(); return { ok: true }; };
  antw.pinnwand_anheften = (q) => {
    const an = q.antwort_auf ? P.zettel.find((x) => x.id === q.antwort_auf) : null;
    P.zettel.push({ id: "N" + ++n, text: q.text, wichtig: !!q.wichtig, fuer: q.fuer, erstellt_am: jetzt(), vonMir: true, farbe: 4, von: { person_id: "P1", vorname: "Max" },
      empfaenger: q.fuer === "personen" ? [an ? (an.von.person_id === "P2" ? "Erika Beispiel" : "Paul Probe") : "Erika Beispiel"] : [], erledigt: null, antworten: q.antworten,
      ...(q.fuer !== "ich" ? { leser: [], offen: [], anzahl: q.fuer === "alle" ? 17 : 1 } : {}) });
    return { ok: true };
  };
  antw.pinnwand_abnehmen = (q) => { P.zettel = P.zettel.filter((x) => x.id !== q.id); return { ok: true }; };
}
