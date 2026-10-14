// KICC-F-100 · Ein Backup-Satz gilt nur als wiederherstellbar, wenn er vollstaendig ist.
// Reine Funktion ohne Abhaengigkeiten: laeuft in der Edge Function (Deno) und in den Node-Tests.

const names = (list) => [...new Set((list || []).map((t) => String(t)))];

/**
 * @param {object} input
 * @param {string[]} input.snapshotTables  Tabellen, die im Satz tatsaechlich liegen
 * @param {number|null} [input.dispatchedCount]  Tabellenzahl laut Dispatch-Audit des Satzes
 * @param {string[]} [input.registryTables]  aktuelle Backup-Registry (Fallback und Namensliste)
 * @param {string[]} [input.deferredTables]  beim Dispatch bewusst zurueckgestellte Tabellen
 */
export function assessBackupCompleteness({ snapshotTables, dispatchedCount = null, registryTables = [], deferredTables = [] }) {
  const present = names(snapshotTables);
  const deferred = new Set(names(deferredTables));
  const expectedNames = names(registryTables).filter((t) => !deferred.has(t));
  const fromDispatch = Number.isInteger(dispatchedCount) && dispatchedCount > 0;
  const expected = fromDispatch ? dispatchedCount : expectedNames.length;
  const have = new Set(present);
  const missing = expectedNames.filter((t) => !have.has(t)).sort();

  if (expected <= 0) {
    return { complete: false, reason: 'expected_unknown', expected: null, present: present.length, missing };
  }
  if (present.length < expected) {
    return { complete: false, reason: 'incomplete', expected, present: present.length, missing };
  }
  // Ohne Dispatch-Audit ist die Registry die einzige Referenz: dann muss jede Tabelle vorhanden sein.
  if (!fromDispatch && missing.length) {
    return { complete: false, reason: 'incomplete', expected, present: present.length, missing };
  }
  return { complete: true, reason: 'complete', expected, present: present.length, missing: [] };
}
