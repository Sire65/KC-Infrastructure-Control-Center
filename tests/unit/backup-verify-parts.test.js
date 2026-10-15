// KICC-F-102 · Restore-Test in Teilpaketen: abgebrochene Pakete duerfen nie als bestanden zaehlen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitIntoParts, mergePartChecks } from '../../database/edge-functions/kc-db-backup-verify-v2/parts.js';

test('PARTS_SPLIT: 256 Tabellen in Pakete zu 40', () => {
  const names = Array.from({ length: 256 }, (_, i) => `t${i}`);
  const parts = splitIntoParts(names, 40);
  assert.equal(parts.length, 7);
  assert.equal(parts[6].length, 16);
  assert.deepEqual(parts.flat(), names);
});

test('PARTS_SPLIT: doppelte Namen und ungueltige Groesse', () => {
  assert.deepEqual(splitIntoParts(['a', 'b', 'a'], 0), [['a'], ['b']]);
  assert.deepEqual(splitIntoParts([], 40), []);
});

test('PARTS_MERGE_OK: alle Pakete gemeldet', () => {
  const parts = [['a', 'b'], ['c']];
  const checks = mergePartChecks(parts, [
    { checks: [{ table: 'a', status: 'ok' }, { table: 'b', status: 'ok' }] },
    { checks: [{ table: 'c', status: 'ok' }] },
  ]);
  assert.deepEqual(checks.map((c) => c.status), ['ok', 'ok', 'ok']);
});

test('PARTS_MERGE_ABORT: abgebrochenes Paket ergibt Fehler je Tabelle', () => {
  const parts = [['a', 'b'], ['c', 'd']];
  const checks = mergePartChecks(parts, [{ checks: [{ table: 'a', status: 'ok' }, { table: 'b', status: 'ok' }] }, null]);
  assert.equal(checks.length, 4);
  assert.deepEqual(checks.filter((c) => c.status !== 'ok').map((c) => [c.table, c.reason]), [['c', 'part_failed'], ['d', 'part_failed']]);
});

test('PARTS_MERGE_PARTIAL: fehlende, fremde und doppelte Meldungen', () => {
  const parts = [['a', 'b']];
  const checks = mergePartChecks(parts, [{ checks: [
    { table: 'a', status: 'ok' }, { table: 'a', status: 'error' }, { table: 'x', status: 'ok' },
  ] }]);
  assert.deepEqual(checks, [{ table: 'a', status: 'ok' }, { table: 'b', status: 'error', reason: 'part_failed' }]);
});
