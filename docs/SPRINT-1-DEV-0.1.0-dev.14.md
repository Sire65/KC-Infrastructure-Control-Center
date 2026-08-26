# KICC Sprint 1 · 0.1.0-dev.14

## Scope
Secure wiring of Supabase ↔ Neon mirror telemetry into KICC without enabling productive failover or any prepared region migration.

## Changes
- Added `sync/mirror-bridge-adapter.js` with HTTPS enforcement, JSON validation, future-timestamp rejection, target-flow validation, freshness gate and optional short-lived authorization header support.
- Mirror monitor now reads from `KICC_SYNC_BRIDGE_ENDPOINTS` and treats only `OBSERVED_REMOTE` as authoritative.
- Browser/test injection is retained only as `MANUAL_TEST`; it can never make the mirror failover-ready.
- Critical system health now requires both freshness and authoritative trust (`OBSERVED` / `OBSERVED_REMOTE`).
- `UNVERIFIED`, `MANUAL_TEST`, `AUTH_REQUIRED`, `OBSERVED_ATTEMPT` and stale observations normalize to UNKNOWN for critical overall health.
- Manual `KICC.ingestObservation()` is explicitly marked `MANUAL_TEST`.

## Failover invariant
Neon promotion remains blocked unless:
1. Neon is operational,
2. Supabase is confirmed failed/offline,
3. fresh mirror telemetry is authoritative,
4. mirror health confirms no open mismatch/conflict and acceptable lag/error rate,
5. explicit promotion approval is given.

## Production status
No productive mirror endpoint was deployed in this build. No database role changed. No region migration, data copy, cutover, bucket move or deletion was started.

## Feature IDs
- KICC-S1-029 Secure mirror telemetry bridge adapter
- KICC-S1-030 Authoritative mirror trust gate
- KICC-S1-031 Manual-test isolation
- KICC-S1-032 Authoritative critical-health coverage
