// Kapitel 2.4: der gesetzte Status kommt wie beim echten Server zurück (Kopf, Mein Status, eigene Mitglieder-Kachel)
export default (antw) => {
  antw.mitglieder = structuredClone(antw.mitglieder);
  antw.status_setzen = (q) => {
    const st = { status: q.status, hinweis: q.status === "verfuegbar" ? null : q.hinweis || null, bis: q.status === "verfuegbar" ? null : q.bis || null };
    antw.init = { ...antw.init, status: st };
    const ich = antw.mitglieder.mitglieder.find((m) => m.person_id === "P1"); if (ich) ich.status = st;
    return { ok: true };
  };
};
