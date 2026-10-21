// Demodaten für Kapitel 1.3: eine geöffnete Unterhaltung gilt danach als gelesen – die Zahlen auf Kachel, Leiste und Kopf werden kleiner (wie beim echten Server)
import { msg } from "/home/user/sire65/kc-clubapp/tools/anleitung/demo.mjs";
export default (antw) => {
  const gelesen = new Set(), basis = antw.unterhaltung, liste = antw.unterhaltungen.unterhaltungen, init = antw.init;
  const kueche = { ...basis, id: "C2", gruppe: { name: "Küchenteam", symbol: "🍳" }, partnerDa: null,
    teilnehmer: [{ person_id: "P1", name: "Max Mustermann" }, { person_id: "P2", name: "Erika Beispiel" }, { person_id: "P3", name: "Paul Probe" }, { person_id: "P5", name: "Otto Muster" }],
    nachrichten: [msg("K1", false, "Erika Beispiel", "Wer kauft die Zwiebeln?", 70), msg("K2", false, "Paul Probe", "Einkaufsliste steht 👍", 55)] };
  const offen = () => liste.reduce((n, c) => n + (gelesen.has(c.id) ? 0 : c.ungelesen), 0);
  antw.unterhaltung = (q) => { gelesen.add(q.id); return q.id === "C2" ? kueche : basis; };
  antw.unterhaltungen = () => ({ unterhaltungen: liste.map((c) => gelesen.has(c.id) ? { ...c, ungelesen: 0, wichtigNeu: 0 } : c) });
  Object.defineProperty(antw, "init", { configurable: true, enumerable: true, get: () => ({ ...init, ungelesen: offen(), ungelesenLaut: offen() }), set: (v) => { Object.assign(init, v); } });
};
