# KICC Data Flow Contract 1.1

Every declared flow has stable ID, source, destination, direction, data class, transport, owner/master, consumer, expected cadence, health policy and optional failover route.

## Examples of data classes
Article/master data, sales transactions, staffing/schedule data, weather/program data, media/presentation data, telemetry, communication events and configuration.

## Observation
Configured flow does not imply live traffic. KICC records actual observations separately: timestamp, direction, count/bytes where available, latency, success/failure and correlation identifier.

## Lineage
Where applications provide correlation IDs, KICC can trace a logical object through local store, primary cloud, consumer, mirror and backup without storing its full business payload.

## Supabase -> Neon normal operation
- Supabase is configured PRIMARY while healthy.
- Neon is configured MIRROR/STANDBY and receives replicated/synchronized changes.
- KICC measures health, last-success, queue/backlog, sync lag, record/hash comparison and schema compatibility.
- The configured role never overrides measured health.

## Failover
If Supabase is confirmed FAILED/OFFLINE and Neon is confirmed healthy and sufficiently current, KICC enters FAILOVER_PENDING.
Promotion of Neon to PRIMARY is a controlled critical action. Before promotion KICC verifies recovery point, mirror freshness, schema compatibility and write readiness.
After promotion, Neon is the authoritative write target. Split brain is forbidden: Supabase must not simultaneously be treated as writable PRIMARY.

## Recovery and reverse synchronization
When Supabase returns, it must NOT immediately become PRIMARY.
KICC enters RESYNC_REQUIRED/RESYNCING and exchanges changes accumulated during the outage. The synchronization must account for data created or changed while Neon was PRIMARY.
The reconciliation process compares version/correlation metadata, sequence/watermark, timestamps and/or hashes as supported by the data class. Conflicts are never silently discarded; deterministic conflict rules and audit records are required.

Only after data, schema and integrity comparison pass does KICC enter FAILBACK_READY. Returning PRIMARY responsibility to Supabase is a separate controlled action. After successful failback Neon returns to MIRROR/STANDBY and normal Supabase -> Neon synchronization resumes.

## Required failover state sequence
NORMAL -> FAILOVER_PENDING -> NEON_PRIMARY -> RESYNC_REQUIRED -> RESYNCING -> VERIFYING -> FAILBACK_READY -> RECOVERED/NORMAL.
BLOCKED is used whenever both databases are unavailable, mirror freshness cannot be established, schema is incompatible, reconciliation is incomplete or another safety gate fails.

## Topology display
Animation is driven only by current FlowObservation data. Stale/unobserved links are shown as such and never animated as fake activity. During failover, topology must visibly reverse the active write/master direction and separately show the resynchronization direction.

## Extensibility
Flows can be one-way, reverse or bidirectional and may target future providers/programs without schema redesign.
