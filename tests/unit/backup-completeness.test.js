// KICC-F-100 · Restore-Test darf unvollstaendige Backup-Saetze nie als bestanden melden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessBackupCompleteness } from '../../database/edge-functions/kc-db-backup-verify-v2/completeness.js';

const reg = ['a', 'b', 'c', 'd'];

test('BACKUP_COMPLETE_OK: alle dispatchten Tabellen vorhanden', () => {
  const r = assessBackupCompleteness({ snapshotTables: reg, dispatchedCount: 4, registryTables: reg });
  assert.equal(r.complete, true);
  assert.deepEqual(r.missing, []);
});

test('BACKUP_INCOMPLETE_ERROR: 250/253-Fall wird nicht bestanden', () => {
  const r = assessBackupCompleteness({ snapshotTables: ['a', 'c'], dispatchedCount: 4, registryTables: reg });
  assert.equal(r.complete, false);
  assert.equal(r.reason, 'incomplete');
  assert.equal(r.expected, 4);
  assert.equal(r.present, 2);
  assert.deepEqual(r.missing, ['b', 'd']);
});

test('BACKUP_EMPTY_ERROR: Satz ohne Snapshots ist nie ok', () => {
  const r = assessBackupCompleteness({ snapshotTables: [], dispatchedCount: 4, registryTables: reg });
  assert.equal(r.complete, false);
});

test('BACKUP_EXPECTED_UNKNOWN: ohne Audit und Registry bleibt das Ergebnis UNKNOWN, nie ok', () => {
  const r = assessBackupCompleteness({ snapshotTables: ['a'], dispatchedCount: null, registryTables: [] });
  assert.equal(r.complete, false);
  assert.equal(r.reason, 'expected_unknown');
  assert.equal(r.expected, null);
});

test('BACKUP_DEFERRED_EXCLUDED: zurueckgestellte Tabellen zaehlen nicht als fehlend', () => {
  const r = assessBackupCompleteness({ snapshotTables: ['a', 'b', 'c'], dispatchedCount: null, registryTables: reg, deferredTables: ['d'] });
  assert.equal(r.complete, true);
});

test('BACKUP_REGISTRY_GREW_AFTER_DISPATCH: neue Registry-Tabelle nach Dispatch macht den Satz nicht ungueltig', () => {
  const r = assessBackupCompleteness({ snapshotTables: reg, dispatchedCount: 4, registryTables: [...reg, 'e'] });
  assert.equal(r.complete, true);
});

test('BACKUP_FALLBACK_REGISTRY: ohne Dispatch-Audit muss jede Registry-Tabelle vorhanden sein', () => {
  const r = assessBackupCompleteness({ snapshotTables: ['a', 'b', 'c', 'x'], dispatchedCount: null, registryTables: reg });
  assert.equal(r.complete, false);
  assert.deepEqual(r.missing, ['d']);
});

test('BACKUP_DUPLICATES_IGNORED: doppelte Namen zaehlen nur einmal', () => {
  const r = assessBackupCompleteness({ snapshotTables: ['a', 'a', 'b', 'b'], dispatchedCount: 4, registryTables: reg });
  assert.equal(r.complete, false);
  assert.equal(r.present, 2);
});
