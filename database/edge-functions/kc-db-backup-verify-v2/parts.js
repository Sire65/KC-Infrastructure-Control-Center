// KICC-F-102 · Restore-Test in Teilpaketen, damit kein Aufruf das CPU-Limit der Edge Function erreicht.
// Reine Funktionen ohne Abhaengigkeiten: laufen in der Edge Function (Deno) und in den Node-Tests.

/** Teilt Tabellennamen in Pakete von hoechstens `size` (Reihenfolge bleibt erhalten, doppelte Namen entfallen). */
export function splitIntoParts(tables, size) {
  const n = Math.max(1, Math.floor(Number(size) || 1));
  const list = [...new Set((tables || []).map(String))];
  const parts = [];
  for (let i = 0; i < list.length; i += n) parts.push(list.slice(i, i + n));
  return parts;
}

/**
 * Fuehrt die Ergebnisse der Teilpakete zusammen. Jede Tabelle eines Pakets erscheint genau einmal.
 * Fehlt ein Ergebnis (Paket abgebrochen, Tabelle nicht gemeldet), zaehlt die Tabelle als Fehler –
 * ein abgebrochenes Paket darf den Test nie bestehen lassen.
 * @param {string[][]} parts
 * @param {Array<{checks?: any[]}|null|undefined>} results  gleiche Reihenfolge wie `parts`
 */
export function mergePartChecks(parts, results) {
  const checks = [];
  parts.forEach((part, i) => {
    const byTable = new Map();
    for (const c of results?.[i]?.checks || []) {
      if (c && part.includes(String(c.table)) && !byTable.has(String(c.table))) byTable.set(String(c.table), c);
    }
    for (const table of part) {
      checks.push(byTable.get(table) || { table, status: 'error', reason: 'part_failed' });
    }
  });
  return checks;
}
