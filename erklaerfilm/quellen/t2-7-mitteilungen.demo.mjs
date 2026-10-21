// Demodaten für Kapitel 2.7 Mitteilungen: zwei erfundene Geräte für „Meine Geräte“ (keine echten Daten)
export default (antw) => {
  const vor = (tage) => new Date(Date.now() - tage * 86400000).toISOString();
  antw.geraete_liste = { geraete: [
    { id: "G1", ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141.0 Mobile Safari/537.36", seit: vor(120), zuletztZugestellt: vor(0.02), diesesGeraet: true, fehler: null },
    { id: "G2", ua: "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/141.0 Safari/537.36", seit: vor(40), zuletztZugestellt: vor(1), diesesGeraet: false, fehler: null },
  ] };
  antw.push_test = { ok: true };
};
