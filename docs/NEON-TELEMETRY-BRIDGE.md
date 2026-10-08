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

| Projekt | Neon-ID | Region | PG | Zustand 2026-10-08 |
|---|---|---|---|---|
| KC Core Mirror | `purple-hat-23047492` | aws-eu-west-2 | 18.6 | Branch `production` bereit, ca. 154 MB von 1 GiB |
| PC Backup Vault | `restless-lake-98349332` | aws-us-west-2 | 18 | Branch `main` seit 2026-10-02 **archiviert** |

## Freshness (KICC-F-094)
Die Recovery-Bewertung (`storage/recovery-policy.js`) prueft zusaetzlich das Alter der Vault-Meldung (`measured_at`, Standard ≤ 24 h, `telemetryMaxAgeHours`). Ein zu alter Nachweis ergibt `PRÜFEN`, ein fehlender Zeitstempel `UNBEKANNT` – nie `BEREIT`. Die Karten Backup/Integritaet/Restore zeigen einen veralteten Erfolg als `· veraltet` (gelb) statt gruen.
