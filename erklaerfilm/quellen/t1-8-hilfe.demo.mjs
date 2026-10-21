// Kapitel 1.8 Hilfe: die Lupe findet im Demo-Club den Clubabend (die Funktionen der App findet sie ohnehin ohne Server)
export default (antw) => {
  const tag = new Date(); tag.setDate(tag.getDate() + 5); tag.setHours(18, 30, 0, 0);
  antw.suche = () => ({ bereiche: [{ bereich: "termine", treffer: [{ id: "T1", titel: "Clubabend Oktober", text: "Planung Weihnachtsmarkt", datum: tag.toISOString() }] }] });
};
