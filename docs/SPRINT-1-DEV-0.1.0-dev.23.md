# KICC 0.1.0-dev.23

## Scope
Preparation of the secure migration path for KC Marktkasse local transactional data from plaintext browser localStorage to encrypted IndexedDB.

## What changed
- Added `security/local-storage-migration-plan.js`.
- Added `security/local-storage-migration-ui.js`.
- Security register now shows the migration gates visibly.
- PWA cache includes both migration modules.
- Build/version aligned to 0.1.0-dev.23.

## Target security design
- IndexedDB as local durable store.
- AES-256-GCM authenticated encryption.
- Fresh 96-bit nonce per encrypted record.
- Key/schema version per record.
- Per-device or per-dataset DEK wrapped by a KEK.
- No secrets or recovery material in repository, Service Worker or plaintext browser storage.

## Migration gates
Inventory, key provisioning, encrypted write, encrypt/decrypt roundtrip, dual-write, offline, sync/reconcile, restore, rollback, parity, Security/SUPER-GAU, explicit cutover approval, observation period and a separate approval before any legacy plaintext deletion.

## Safety invariants
- No productive data is migrated automatically in dev.23.
- Existing legacy data is not deleted.
- Legacy remains authoritative if parity differs.
- Cutover and legacy deletion are separate approvals.
- No region move, DB role switch, failover, B2 bucket creation or provider mutation was performed.

## Current security finding
The existing KC Marktkasse resilience path still contains plaintext JSON structures in localStorage. dev.23 prepares the remediation path but does not modify the productive Marktkasse runtime yet.
