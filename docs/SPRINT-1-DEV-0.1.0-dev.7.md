# KICC Sprint 1 DEV 0.1.0-dev.7

Date: 2026-08-26

## Failover contract added
- Supabase KC Core is the normal PRIMARY while healthy.
- Neon KC Core Mirror is MIRROR/STANDBY during normal operation.
- Confirmed Supabase failure transitions to FAILOVER_PENDING.
- Neon promotion to PRIMARY is a controlled critical action after freshness, recovery point, schema and write-readiness checks.
- Split brain is forbidden: never two writable PRIMARY databases simultaneously.
- While Neon is PRIMARY, new writes on Neon are authoritative.
- When Supabase returns, it remains non-primary while reverse synchronization runs from Neon to Supabase.
- Reconciliation covers changes accumulated during the outage and must detect conflicts rather than silently dropping data.
- Failback to Supabase is allowed only after resync, schema/data/integrity verification and explicit approval.
- After successful failback Neon returns to MIRROR/STANDBY and normal Supabase -> Neon synchronization resumes.

## State machine
NORMAL -> FAILOVER_PENDING -> NEON_PRIMARY -> RESYNC_REQUIRED -> RESYNCING -> VERIFYING -> FAILBACK_READY -> RECOVERED/NORMAL.
BLOCKED is used when failover or reconciliation cannot be proven safe.

## UI
- Dashboard now shows active primary database and failover state.
- Live topology changes direction during failover/resync.
- Operator action panel exposes required actions and safety conditions.

## Safety
- Detection, incident creation, preparation and verification can be automated.
- Promotion to Neon PRIMARY and failback to Supabase require controlled authorization.
- KICC itself remains outside the productive data path and must not become a single point of failure.
