# Audit 2026-10-14: KC-Datenbank-Backup unvollstaendig (Statement-Timeout)

## Befund
- Seit 2026-10-11 wurden die taeglichen Backup-Saetze (`kc_db_backup_daily()` → `kc-db-backup-worker` → Neon `kc_backup_sets`) nicht mehr vollstaendig. Letzter vollstaendiger Satz vor der Korrektur: 2026-10-12 00:12 UTC.
- Betroffene Tabellen: `kc_club_protokoll`, `kc_communication_requests`, zeitweise `kc_communication_delivery_events` (je ca. 1–2,8 MB, wachsend).
- Ursache: Der Worker liest Snapshots ueber PostgREST (`rpc/kc_db_mirror_snapshot`). Dort galt das 8-s-Limit der Rolle `authenticator`, weil `service_role` kein eigenes Limit hatte. Bei 11 parallelen Worker-Anfragen ueberschritten die groessten Tabellen das Limit (`57014 canceling statement due to statement timeout`). Einzeln dauert der Snapshot nur 0,1–0,4 s.
- Fehlende Tabellen → Satz bleibt `running`/`error` (korrektes Verhalten des Workers).

## Ausfuehrung (vom Betreiber freigegeben)
- Recovery-Punkt: Konfigurationsaenderung, Ruecknahme jederzeit mit `alter role service_role reset statement_timeout; notify pgrst, 'reload config';`
- `alter role service_role set statement_timeout = '60s'; notify pgrst, 'reload config';`
- Auswirkung: nur serverseitige Aufrufe mit Service-Key; `anon` (3 s) und `authenticated` (8 s) unveraendert.
- Audit-Eintrag in `kc_db_mirror_audit` (`service_role_statement_timeout`).

## Verifikation
- Nachgeholter Lauf ueber `kc_neon_low_compute_backup_cycle()`: Satz `b2e4bccd-b693-40eb-a054-b5f6829d5b17`, 253/253 Tabellen, Status `ok`, abgeschlossen 2026-10-14 05:19:39 UTC.
- Restore-Read-Test: 253 geprueft, 0 Fehler.
- Alle 11 Worker-Anfragen HTTP 200, keine Statement-Timeouts in den Postgres-Logs.

## Offen
- ~~Der Restore-Test (`kc-db-backup-verify-v2`, Cron 00:15) meldet „passed“ auch fuer unvollstaendige Saetze.~~ Behoben mit KICC-F-100 (`docs/KICC-F-100-BACKUP-RESTORE-COMPLETENESS.md`).
- Optional: Worker-Anfragen zeitversetzt statt parallel dispatchen.
- PC Backup Vault: letztes Backup 2026-09-18, nur manuelle Laeufe; Warnung FS-003 (`Permission denied` auf `.pc-backup-vault\.preflight-*.tmp`) am PC pruefen.
