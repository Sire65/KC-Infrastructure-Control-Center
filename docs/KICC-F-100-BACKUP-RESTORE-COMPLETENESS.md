# KICC-F-100 – Restore-Test prueft Vollstaendigkeit des Backup-Satzes

Feature-ID: **KICC-F-100** · 2026-10-14 · Komponente: Supabase Edge Function `kc-db-backup-verify-v2` Version 7

## Anlass
Am 2026-10-14 meldete der Restore-Test um 00:15 UTC „restore-read test passed“ fuer einen Satz mit nur 250 von 253 Tabellen. Geprueft wurde nur, was im Satz lag, nicht, ob er vollstaendig ist. Ein unvollstaendiges Backup wirkte dadurch gruen (Verstoss gegen AGENTS.md Regel 11). Hintergrund: `docs/AUDIT-2026-10-14-KC-DB-BACKUP-TIMEOUT.md`.

## Aenderung
- Neue reine Funktion `assessBackupCompleteness` in `database/edge-functions/kc-db-backup-verify-v2/completeness.js`.
- Erwartete Tabellenzahl: `tables` aus dem Audit `immutable_backup_dispatched` des Satzes. Fehlt das Audit, gilt die Backup-Registry (`kc_db_mirror_table_rules`, wie im Backup-Worker) ohne zurueckgestellte Tabellen; dann muss jede Tabelle vorhanden sein.
- Weniger Tabellen als erwartet → `status=error`, HTTP 500, Meldung „restore-read test failed (incomplete x/y tables)“.
- Keine Erwartung ermittelbar → `reason=expected_unknown`, nie ok.
- Neue Felder in Antwort, `kc_backup_verifications.detail.completeness` und `kc_db_mirror_runs.metrics`: `complete`, `reason`, `expected_tables`, `present_tables`, `missing_tables`.
- Unveraendert: Authentifizierung, Entschluesselung, Zeilen-/Hash-Pruefung je Tabelle, `checked_tables`/`failed_tables` (der Backup-Worker prueft diese Felder beim Abschluss).
- Quelle liegt jetzt im Repo: `database/edge-functions/kc-db-backup-verify-v2/`. Recovery-Punkt: `recovery/index.v6.ts` (bisherige Version 6).

## Tests
- `npm run test:unit` (`tests/unit/backup-completeness.test.js`, 8 Faelle): vollstaendig, 250/253-Fall, leerer Satz, unbekannte Erwartung, zurueckgestellte Tabellen, nach dem Dispatch gewachsene Registry, Registry-Fallback, doppelte Namen.
- `deno check` (Deno 2.1.4 wie die Edge-Runtime) ohne Fehler; ESLint gruen.
- Live 2026-10-14: Satz `2ddd444d…` (250/253) → HTTP 500, fehlend `kc_club_protokoll`, `kc_communication_delivery_events`, `kc_communication_requests`. Satz `b2e4bccd…` (253/253) → HTTP 200.

## Definition of Done
- [x] Unvollstaendiger Satz wird nie als bestanden gemeldet.
- [x] Fehlende Tabellen werden namentlich ausgewiesen.
- [x] Unbekannte Erwartung ergibt nie ok.
- [x] Unit-Tests, Typpruefung, Live-Verifikation.
- [x] Funktionsversion 6 → 7 (`X-KC-Function-Version`); KICC-Oberflaeche unveraendert, daher keine neue App-Version.
- [x] Doku und Recovery-Punkt im Repo.

## Ruecknahme
`recovery/index.v6.ts` als `index.ts` deployen (verify_jwt=false).
