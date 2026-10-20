# KICC Neon Telemetry Bridge

Status: provisioned (read-only Bridge aktiv). Stand: 2026-10-08, KICC 0.1.0-dev.94.

## Purpose
KICC shall receive read-only technical telemetry from Neon without storing database passwords, connection strings or admin credentials in the browser or repository.

## Covered resources
- Neon KC Core Mirror, currently aws-eu-west-2 London.
- Neon PC Backup Vault, currently aws-us-west-2.

## Browser contract
The existing telemetry-bridge adapter may consume a configured HTTPS endpoint from `KICC_BRIDGE_ENDPOINTS[resourceId]`. Authentication is supplied at runtime through `KICC_AUTH.getNeonBridgeAuth(resourceId)`.

## Allowed telemetry
Health, measured timestamp, latency, PostgreSQL version, database size, table/schema fingerprint, integrity status, sync lag, backup/recovery metadata and failover readiness. Business payloads are not part of this interface.

## Security requirements
- No Neon connection string, password or admin token in app.js, IndexedDB, service worker cache or Git repository.
- Endpoint must require authenticated access.
- Read-only database role for telemetry where possible.
- Response fields must be whitelisted and timestamped.
- Stale data becomes UNKNOWN.
- Mutation, failover, migration and restore actions use separate capability-gated endpoints and explicit authorization.

## Provisioning state
Historisch (bis dev.29) war die Bridge nur vorbereitet. Aktueller, am 2026-10-08 gepruefter Stand:

- Endpunkt `db-neon-core-mirror` ist in `telemetry/neon-runtime-config.js` eingetragen und zeigt auf die Supabase Edge Function `kicc-neon-telemetry`. Die Funktion ist deployt (ACTIVE) und verlangt JWT (`verify_jwt=true`).
- Backup-Nachweise kommen ueber `kicc-backup-telemetry` aus der Tabelle `kicc_backup_telemetry` (KC Core Mirror).
- Keine Neon Data API und kein Neon Auth aktiviert; keine Connection-Strings im Repository.

Neon-Projekte, zuletzt geprueft am 2026-10-20 (Organisation `org-fragrant-hall-59385873`, Free-Plan, Kontingent-Reset 2026-11-01):

| Projekt | Neon-ID | Region | PG | Zustand 2026-10-20 | Zum Vergleich 2026-10-08 |
|---|---|---|---|---|---|
| KC Core Mirror | `purple-hat-23047492` | aws-eu-west-2 | 18 | Branch `production` bereit, Compute im Leerlauf (Scale-to-Zero), ca. **376 MB von 1 GiB** | ca. 154 MB |
| PC Backup Vault | `restless-lake-98349332` | aws-us-west-2 | 18 | Branch `main` **archiviert** seit 2026-10-16; zuletzt aktiv 2026-10-15 | archiviert seit 2026-10-02 |
| KC Archiv Kopie | `dry-waterfall-32306741` | aws-eu-central-1 | 18 | Branch `main` bereit, ca. 32 MB, noch nie aktiv (angelegt 2026-10-11) | – (noch nicht erfasst) |

Offene Verbindungen im KC Core Mirror (`pg_stat_activity`, 2026-10-20): nur Neons interne Verbindungen (`compute_ctl`, `pgbouncer`); keine haengenden Client-Verbindungen.

## Speicherbelegung KC Core Mirror (Stand 2026-10-20)
Die Free-Grenze liegt bei 1 GiB pro Branch. Fast der gesamte Zuwachs stammt aus den Backup-Saetzen:

| Tabelle | Groesse | Anteil |
|---|---|---|
| `kc_backup_snapshots` | 290 MB (4.333 Zeilen) | ca. 77 % |
| alle uebrigen Tabellen zusammen | ca. 86 MB | ca. 23 % (groesste: `kc_dp_sync_operations`, `kc_communication_requests`, `kc_club_protokoll` mit je ca. 4–5 MB) |

Befund:
- Jeder Backup-Satz (`backup_set`) ist eine **eigenstaendige Vollkopie** aller gespiegelten Tabellen (verschluesselt als JSONB, zuletzt 273 Tabellen, ca. 21 MB Payload). Seit `kc-db-backup-worker` Version 20 (KICC-F-107, deployt 2026-10-18 15:40 UTC) werden unveraenderte Tabellen innerhalb von Neon aus dem letzten geprueften Satz kopiert. Das spart Supabase-Egress, aber **keinen Neon-Speicher**: Die Payload liegt weiterhin je Satz einmal vor.
- **Aufbewahrung ist aktiv** (KICC-F-103, seit 2026-10-16, laeuft im Backup-Zyklus ca. 00:50 UTC): `kc_backup_retention_policy` = alle Saetze der letzten **7 Tage**, dazu **4 Wochen-** und **3 Monatssaetze** sowie immer der neueste gepruefte Satz. Unvollstaendige Saetze aelter als 7 Tage werden entfernt. Loeschen ist nur ueber `kc_backup_retention_anwenden()` moeglich; der Trigger `kc_backup_block_mutation` sperrt alles andere.
- Der regulaere Satz laeuft seit 2026-10-16 um **00:40 UTC** (pg_cron Job 45, vorher 00:12 UTC). Fehlende grosse Tabellen laedt `kc_db_backup_nachholen()` (Job 75, alle 10 min von 00–07 UTC) in denselben Satz nach; dabei entsteht kein neuer Satz.

### Zusatz-Saetze ausserhalb des Zeitplans (geprueft 2026-10-20)
Zwischen 2026-10-13 und 2026-10-18 entstanden 7 zusaetzliche Saetze. Ausser Job 45 ruft keine Datenbankfunktion `kc_db_backup_daily()` auf; die Zusatz-Saetze wurden also **von Hand** im Rahmen von Wartungsarbeiten ausgeloest (Rueckschluss aus Audit-Log und Zeitpunkten; ein Aufrufer ist nicht protokolliert) und sind kein automatischer Fehler:

| Satz | Start (UTC) | Status | Zusammenhang |
|---|---|---|---|
| `318ca292` | 2026-10-13 02:48 | error | Wartung, Lauf unvollstaendig |
| `e57f7b61` | 2026-10-13 11:39 | error | Wartung, Lauf unvollstaendig |
| `0b7278cb` | 2026-10-14 02:12 | running (nie abgeschlossen) | Wartung |
| `b2e4bccd` | 2026-10-14 05:19 | ok | gleiche Transaktion wie `service_role_statement_timeout` (Timeout 8 s → 60 s) |
| `03f574e8` | 2026-10-15 02:20 | ok | Wartung (am selben Tag Restore-Test und Nachholen umgestellt) |
| `3b9b548a` | 2026-10-16 09:34 | ok | Wartung |
| `fa728c0e` | 2026-10-18 15:40 | error | Testlauf 7 s nach Deploy von Worker v20 |

Folgen und Prognose:
- Die Zusatz-Saetze fallen unter „letzte 7 Tage“ und werden danach automatisch entfernt, die fehlerhaften sofort, die ok-Saetze sofern sie kein Wochen- oder Monatssatz sind. Der aktuelle Stand (19 Saetze) ist deshalb **voruebergehend erhoeht**.
- Im eingeschwungenen Zustand bleiben ca. 12–14 Saetze, also ca. 250–300 MB Backup plus ca. 90 MB uebrige Tabellen. Die 1-GiB-Grenze ist damit **nicht kurzfristig gefaehrdet**; der Bedarf waechst nur mit der Datenmenge je Satz.
- Empfehlung: manuelle Testlaeufe kuenftig als solche kennzeichnen (z. B. eigener `note` in `kc_backup_sets`) oder nach dem Test ueber die Retention bereinigen lassen, damit sie nicht als regulaere Tagessaetze zaehlen.

## Freshness (KICC-F-094)
Die Recovery-Bewertung (`storage/recovery-policy.js`) prueft zusaetzlich das Alter der Vault-Meldung (`measured_at`, Standard ≤ 24 h, `telemetryMaxAgeHours`). Ein zu alter Nachweis ergibt `PRÜFEN`, ein fehlender Zeitstempel `UNBEKANNT` – nie `BEREIT`. Die Karten Backup/Integritaet/Restore zeigen einen veralteten Erfolg als `· veraltet` (gelb) statt gruen.
