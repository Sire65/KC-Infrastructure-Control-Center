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

## Audit: Heartbeat-Bereinigung (2026-10-08, vom Betreiber freigegeben)
- Analyse: `kicc_program_heartbeats` (KC Core Mirror, `purple-hat-23047492`) enthielt 86 Zeilen, davon 66 aelter als 7 Tage. Keine Fremdschluessel, keine Trigger.
- Auswirkung: Es wurden nur veraltete Instanzen geloescht. Pro `program_id` bleibt der neueste Eintrag erhalten, damit „zuletzt gesehen“ fuer Programme ohne frischen Heartbeat (`kicc`, `kc-dp2`, `kc-pc-manager`) nachweisbar bleibt.
- Recovery-Punkt: Neon-Branch `recovery-2026-10-08-heartbeat-cleanup` (`br-plain-shadow-zaop286i`, Parent-LSN `1/19CE99A8`, ohne Compute).
- Ausfuehrung: ein `DELETE` in einer Transaktion, 63 Zeilen geloescht.
- Verifikation: 23 Zeilen verbleiben; kc-clubapp 19, kc-system-check 1, kc-pc-manager 1, kc-dp2 1, kicc 1.
- Nicht betroffen: `kicc_program_flow_events`, `kicc_backup_telemetry` und alle anderen Tabellen.

### Korrektur: Bereinigung an der Quelle (Regel 2/3)
- Die Loeschung oben erfolgte zunaechst nur im Spiegel (Neon). Quelle ist jedoch Supabase (`ptblnpiroqftcvlsrhac`); der Spiegel `kc-db-mirror` arbeitet mit `write_mode=replace` und haette den Neon-Stand beim naechsten Lauf wieder an die Quelle angeglichen.
- An der Quelle wurde daher die bestehende Funktion `public.kc_lebenszeichen_aufraeumen(7)` ausgefuehrt: 63 Zeilen geloescht, 25 verbleiben (inkl. neuer Heartbeats seit der Analyse). Kein neuer Parallel-Mechanismus.
- Recovery: verschluesseltes Tabellen-Backup des Spiegels vom 2026-10-08 00:12 UTC sowie Neon-Branch `recovery-2026-10-08-heartbeat-cleanup`.

## Automatische Bereinigung
- Bestehender pg_cron-Job `kc-lebenszeichen-aufraeumen-daily` (jobid 39, Supabase, taeglich 03:40 UTC) war bereits aktiv, mit 30 Tagen Aufbewahrung.
- Auf Wunsch des Betreibers auf 7 Tage umgestellt: `select public.kc_lebenszeichen_aufraeumen(7);` (Funktionsuntergrenze ist 7 Tage).
- Regel: Instanzen ohne Meldung seit mehr als 7 Tagen werden entfernt; der neueste Eintrag je Programm bleibt immer erhalten. Der Spiegel uebernimmt den Stand automatisch nach Neon.
- Ruecknahme: `select cron.alter_job(job_id := 39, command := 'select public.kc_lebenszeichen_aufraeumen(30);');`

### Abschluss Recovery-Punkt (2026-10-08)
- Spiegel-Lauf 12:10 UTC fuer `kicc_program_heartbeats`: „source and target identical“, 0 Abweichungen.
- Abgleich Supabase ↔ Neon: je 25 Zeilen, identischer Schluessel-Hash (`9c205805…`).
- Neon-Branch `recovery-2026-10-08-heartbeat-cleanup` (`br-plain-shadow-zaop286i`) danach geloescht (12:26 UTC, Operation `delete_timeline`).
