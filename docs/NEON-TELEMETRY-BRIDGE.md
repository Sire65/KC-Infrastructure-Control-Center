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
- Jeder Backup-Satz (`backup_set`) ist eine **Vollkopie** aller gespiegelten Tabellen als JSONB (zuletzt 273 Tabellen, ca. 21 MB Payload). Es gibt **keine Aufbewahrungsregel**; alte Saetze werden nie geloescht.
- Laut `docs/PLAN-KC-DB-BACKUP-B2.md` ist ein Satz je Tag vorgesehen. Tatsaechlich entstanden zwischen 2026-10-13 und 2026-10-18 **1–3 Saetze pro Tag**. Seit 2026-10-16 laeuft der regulaere Satz um ca. 00:40 UTC (nicht mehr 00:12 UTC); zusaetzliche Saetze entstanden z. B. am 2026-10-16 um 09:34 UTC und am 2026-10-18 um 15:40 UTC.
- Hochrechnung: bei ca. 21 MB je Satz und steigender Tabellenzahl ist die 1-GiB-Grenze ungefaehr **Ende November 2026** erreicht, bei mehreren Saetzen pro Tag entsprechend frueher.
- Noetig ist eine Retention fuer `kc_backup_snapshots` in Neon (analog zu den 14 Tages- und 6 Monatssaetzen aus KICC-F-099) und eine Pruefung, warum zusaetzliche Saetze ausserhalb des Zeitplans entstehen. Loeschen alter Saetze ist eine kritische Aktion (AGENTS.md Regel 10) und braucht vorher Freigabe und einen Recovery-Punkt.

## Freshness (KICC-F-094)
Die Recovery-Bewertung (`storage/recovery-policy.js`) prueft zusaetzlich das Alter der Vault-Meldung (`measured_at`, Standard ≤ 24 h, `telemetryMaxAgeHours`). Ein zu alter Nachweis ergibt `PRÜFEN`, ein fehlender Zeitstempel `UNBEKANNT` – nie `BEREIT`. Die Karten Backup/Integritaet/Restore zeigen einen veralteten Erfolg als `· veraltet` (gelb) statt gruen.
