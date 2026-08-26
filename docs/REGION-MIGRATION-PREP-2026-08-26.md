# KICC Region Migration Preparation Freeze

Date: 2026-08-26
Build: 0.1.0-dev.11
Status: PREPARED / NOT STARTED

No target project/account/bucket has been created by this preparation. No data has been copied. No production endpoint, credential, routing, primary role or failover role has been changed. No source resource has been deleted or paused.

## Confirmed current placement
- Supabase KC Core: eu-west-2 London, ACTIVE_HEALTHY, PostgreSQL 17.
- Supabase Future Academy: eu-central-1 Frankfurt, ACTIVE_HEALTHY, PostgreSQL 17; compliant, no move planned.
- Neon KC Core Mirror: aws-eu-west-2 London, PostgreSQL 18.
- Neon PC Backup Vault metadata project: aws-us-west-2 USA, PostgreSQL 18.
- Backblaze B2 PC Backup Vault mass storage: current US placement is to be verified at execution precheck; target is EU Central Amsterdam because no German B2 region is currently available.

## Prepared migration packages
### M1 Supabase KC Core
Source: London eu-west-2
Target: Frankfurt eu-central-1
Required before execution: target project cost/organization confirmation, recovery point, schema/extensions inventory, Auth/Storage/Edge/Realtime inventory, secrets inventory without exporting secrets to KICC, initial copy plan, delta strategy, application endpoint inventory, integrity comparison, rollback route.

### M2 Neon KC Core Mirror
Source: London aws-eu-west-2
Target: Frankfurt aws-eu-central-1
Required before execution: target project provisioning, source schema/data inventory, mirror/failover relationship freeze, copy and catch-up strategy, freshness watermark, failover verification, endpoint switch plan, rollback route.

### M3 Neon PC Backup Vault metadata
Source: USA aws-us-west-2
Target: Frankfurt aws-eu-central-1
Required before execution: target project provisioning, metadata schema inventory, backup catalog integrity/checksum checks, application connection switch plan, rollback route. Large backup objects remain separate in B2.

### M4 Backblaze B2 PC Backup Vault
Source: US placement to verify
Target: EU Central Amsterdam
Required before execution: new EU account/bucket, bucket policy and retention parity, encryption settings, credentials prepared outside browser/repository, object inventory, object-count/byte baseline, verified copy/re-upload strategy, checksum verification, PC Backup Vault endpoint/key switch, restore test, rollback route.

## Global safety gates
1. PRECHECK must pass.
2. Recovery point must exist.
3. Target remains non-production during initial copy.
4. Writable databases require delta sync or controlled read-only finalization.
5. Counts, schema and integrity/checksums must match before cutover.
6. Application tests must pass against target.
7. Cutover requires explicit authorization.
8. Old source remains intact through observation period.
9. Source deletion is a separate explicit authorization after successful postcheck.
10. Database migration must preserve one authoritative writer and prevent split-brain.

## Execution lock
KICC must treat all four packages as PREPARED / NOT STARTED until the operator explicitly authorizes execution. Preparation alone must never create provider resources or incur new recurring cost.
