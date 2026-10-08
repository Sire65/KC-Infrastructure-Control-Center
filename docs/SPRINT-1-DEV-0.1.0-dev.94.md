# KICC 0.1.0-dev.94 – Veraltete Backup-Nachweise sichtbar machen

Feature-ID: **KICC-F-094**

## Anlass
Neon-Pruefung am 2026-10-08: `kicc_backup_telemetry` meldet `HEALTHY` / `SUCCESS` / `PASS`, die Vault-Meldung ist aber vom 01.10. und das letzte Backup vom 18.09. Der PC Backup Vault (Neon `restless-lake-98349332`) ist seit 02.10. archiviert. Das Recovery-Gate stand bereits auf `PRÜFEN`, die Einzelkarten zeigten aber weiterhin gruen (Verstoss gegen AGENTS.md Regel 11).

Zusaetzlich war der Versionsvertrag inkonsistent: `VERSION` = dev.93, Laufzeit/Service-Worker/HTML = dev.92 (Regel 8/16).

## Aenderungen
- `storage/recovery-policy.js`: neue Pruefung „Vault-Meldung“ auf `measured_at` (Policy-Feld `telemetryMaxAgeHours`, Standard 24 h). Jede Pruefung traegt eine stabile `id` (`telemetry`, `backup`, `integrity`, `restore`, `rto`) und bei Ueberalterung `stale:true`. Bestehende Felder und Zustaende bleiben unveraendert.
- `storage/backup-telemetry-monitor.js`: Status-Chips nutzen die Gate-Pruefung; veralteter Erfolg erscheint gelb mit „· veraltet“. Anzeige von Abrufzeit und Alter der Vault-Meldung getrennt.
- Version einheitlich auf `0.1.0-dev.94` (`VERSION`, `runtime/build-version.js`, `index.html`, `sw.js`-Cache).
- `docs/NEON-TELEMETRY-BRIDGE.md` auf den realen Provisionierungsstand gebracht.

## Tests
`tests/final-regression.js`:
- `RECOVERY_FRESH_READY` – frische Nachweise ergeben `READY`.
- `RECOVERY_STALE_VAULT_REPORT_NOT_READY` – 7 Tage alte Vault-Meldung ergibt `WARNING`.
- `RECOVERY_MISSING_REPORT_TS_NOT_READY` – fehlender Zeitstempel ist nie `READY`.
- `RECOVERY_STALE_BACKUP_MARKED` – 20 Tage altes Backup wird als `stale` markiert.

## Definition of Done
- [x] Veralteter Erfolg wird nirgends gruen angezeigt.
- [x] Fehlender Zeitstempel ergibt UNBEKANNT, nie BEREIT.
- [x] Regressionstests ergaenzt, ESLint und Playwright-Suite gruen.
- [x] Version konsistent erhoeht.
- [x] Doku aktualisiert.

## Nicht geaendert
- Keine Neon-/Supabase-Ressource veraendert, kein Branch reaktiviert, keine Daten geloescht.
- Bereinigung alter Heartbeat-Instanzen in `kicc_program_heartbeats` (ca. 85 Zeilen) bleibt offen und braucht eine eigene Freigabe.
