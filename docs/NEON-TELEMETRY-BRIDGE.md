# KICC Neon Telemetry Bridge

Status: prepared, not provisioned.

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
No Neon Data API, Neon Auth, new project, branch, database, migration or endpoint is created by this DEV increment. The bridge is intentionally prepared only, because region migrations are frozen and productive infrastructure changes require separate approval.
