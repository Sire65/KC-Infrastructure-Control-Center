// Demodaten für Kapitel 2.1: gesendete Nachrichten erscheinen danach im Chat (wie beim echten Server), Gruppe Küchenteam als eigener Chat
import { msg } from "/home/user/sire65/kc-clubapp/tools/anleitung/demo.mjs";
export default (antw) => {
  const basis = antw.unterhaltung, neu = {}; let n = 0;
  const kueche = { ...basis, id: "C2", gruppe: { name: "Küchenteam", symbol: "🍳" }, partnerDa: null,
    teilnehmer: [{ person_id: "P1", name: "Max Mustermann" }, { person_id: "P2", name: "Erika Beispiel" }, { person_id: "P3", name: "Paul Probe" }, { person_id: "P5", name: "Otto Muster" }],
    nachrichten: [msg("K1", false, "Paul Probe", "Einkaufsliste steht 👍", 55), msg("K2", false, "Erika Beispiel", "Super, danke Paul!", 50)] };
  const otto = { ...basis, id: "C3", teilnehmer: [{ person_id: "P1", name: "Max Mustermann" }, { person_id: "P5", name: "Otto Muster" }],
    nachrichten: [msg("O1", false, "Otto Muster", "Ich hab die Töpfe gespült.", 310), msg("O2", true, "Du", "Danke dir!", 300, { haken: "gelesen", gelesenAlle: true, gelesenVon: ["Otto"] })] };
  // Erika fragt noch etwas – darauf antwortet der Film
  const erika = { ...basis, nachrichten: [...basis.nachrichten, msg("M6", false, "Erika Beispiel", "Bringst du auch deinen Apfelkuchen mit? 🍰", 0.5)] };
  const chats = { C1: erika, C2: kueche, C3: otto };
  antw.unterhaltung = (q) => { const c = chats[q.id] || basis; return { ...c, nachrichten: [...c.nachrichten, ...(neu[q.id] || [])] }; };
  antw.nachricht_senden = (q) => { const id = q.id || "C3"; (neu[id] ||= []).push(msg("N" + ++n, true, "Du", q.text, 0, { haken: "gesendet" })); return { ok: true, id, mid: "N" + n }; };
};
