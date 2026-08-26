# KICC Object Storage / Backup Monitoring

Version: 0.1.0-dev.8

Backblaze B2 is modeled as OBJECT_STORAGE, not as a database.

## Registered resource
- Provider: Backblaze B2
- Purpose: PC Backup Vault mass backup storage
- Bucket: pc
- Role: MASS_BACKUP

## KICC must monitor
- health and reachability
- request latency
- used storage and known capacity/quota when available
- object count
- last successful upload and download
- integrity/checksum verification
- encryption state
- retention/lifecycle state
- last successful restore test
- failure history and stale telemetry

## Security
B2 credentials must never be stored in the browser application, repository, logs or telemetry payload. KICC consumes only sanitized telemetry through a bridge or agent.

## Backup flow
PC Backup Vault -> encrypted backup objects -> Backblaze B2
PC Backup Vault -> catalog/checksums/history -> Neon PC Backup Vault database
KICC monitors both paths independently.

Configured storage is never shown as healthy without current observed telemetry. Missing or stale observations remain UNKNOWN.
