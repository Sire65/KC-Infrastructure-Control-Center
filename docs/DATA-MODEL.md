# KICC Data Model 1.0

## Primary entities
- Product: stable KC product identity independent of repository name.
- Repository: MASTER, DEPLOYMENT, LEGACY, MODULE, INFRASTRUCTURE or UNKNOWN.
- Release: semantic version, build, channel DEV/RC/FINAL, immutable once FINAL.
- Installation: one installed product on one device.
- Device: Windows PC, Android tablet/phone or future device class.
- CoreVersion: core name/version and compatibility state.
- SchemaVersion: product/database schema version independent of app version.
- Provider: Supabase, Neon, IndexedDB, GitHub or future adapter.
- DataStore: database/project/local store.
- DataFlow: declared source, destination, direction, data class and transport.
- FlowObservation: real measured traffic/status for a DataFlow.
- LineageEvent: trace point for a transaction/data object without requiring payload storage.
- HealthObservation: latency, availability and integrity measurement.
- Incident: deduplicated/correlated operational problem.
- JournalEvent: auditable action/event.
- MaintenanceWindow: planned maintenance state.
- TestRun: QUICK, STANDARD, DEEP, SUPER-GAU or RELEASE.

## State rules
Observed != configured. Discovered != registered. Registered != healthy. Healthy requires a current successful measurement.

## Status vocabulary
ONLINE/HEALTHY, DEGRADED, OFFLINE/FAILED, MAINTENANCE, UNKNOWN, UPDATE_AVAILABLE.

LED rendering is derived from state: green=healthy connected; yellow=degraded/attention; red=failed/offline; blue=maintenance; grey=unknown/not checked. Blue must never mean normal connected state.

## Extensibility
Provider type, device type, product type and data-flow transport are adapter-backed enumerations. Unknown future providers must be representable without schema redesign.