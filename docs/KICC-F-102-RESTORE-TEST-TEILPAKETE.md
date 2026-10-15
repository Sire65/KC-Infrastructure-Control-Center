# KICC-F-102 – Restore-Test in Teilpaketen

Feature-ID: **KICC-F-102** · 2026-10-15 · Komponente: Supabase Edge Function `kc-db-backup-verify-v2` Version 8, SQL `kc_db_backup_verify_latest()`

## Anlass
Am 2026-10-15 brach der Restore-Test-Cron um 06:30 UTC mit HTTP 546 `WORKER_RESOURCE_LIMIT` („CPU Time exceeded“) ab: ein Aufruf entschluesselte alle 256 Tabellen. Um 04:40 und 05:00 UTC lief derselbe Test knapp durch. Mit wachsender Datenbank haette auch der Test direkt nach dem Backup das Limit erreicht; der Satz waere dann trotz aller Tabellen auf `running` geblieben.

## Aenderung
- `kc-db-backup-verify-v2` v8: Der Hauptaufruf liest nur die Tabellennamen des Satzes, teilt sie in Pakete zu 40 (`parts.js`) und ruft sich je Paket selbst auf (`part_tables`, hoechstens 3 gleichzeitig, ein Wiederholungsversuch). Jedes Paket hat sein eigenes CPU-Budget. Teilaufrufe pruefen nur und schreiben nichts.
- Ein abgebrochenes oder unvollstaendig gemeldetes Paket zaehlt je Tabelle als Fehler (`reason=part_failed`), nie als bestanden.
- `JSON.parse` des Klartexts nur noch fuer `kc_dp_pilot_testers` (bisher fuer jede Tabelle, ohne Verwendung).
- Antwortformat und Schreibvorgaenge unveraendert (`checked_tables`, `failed_tables`, `completeness`); neu ist `parts` in `detail`/`metrics`.
- `kc_db_backup_verify_latest()` (Cron 06:30 UTC): prueft nur noch, wenn der neueste Satz keinen bestandenen Restore-Test hat (sonst Rueckgabe `null`). pg_net-Zeitlimit 150 s.

## Tests
- `npm run test:unit`: 13 Faelle gruen (neu `tests/unit/backup-verify-parts.test.js`, 5 Faelle: Aufteilung, abgebrochenes Paket, fehlende/fremde/doppelte Meldungen).
- `deno check` (Deno 2.1.4) ohne Fehler.
- Live: Satz `03f574e8…` → 7 Pakete, 256 geprueft, 0 Fehler, 0 `part_failed`, 6,2 s. `kc_db_backup_verify_latest()` → `null` (bereits bestanden).

## Ruecknahme
`recovery/index.v7.ts` als `index.ts` deployen (verify_jwt=false); `kc_db_backup_verify_latest()` aus `database/sql/kc-db-backup-verify-latest.sql` ohne den Block „bereits bestanden“ einspielen.
