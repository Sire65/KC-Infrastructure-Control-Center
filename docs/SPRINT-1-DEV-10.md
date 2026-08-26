# KICC Sprint 1 DEV 10

Version: 0.1.0-dev.10
Date: 2026-08-26

## Added
- Functional Region Migration Center.
- Explicit target-jurisdiction labels: Germany vs EU-not-Germany.
- Migration phases: PRECHECK, RECOVERY_POINT, COPYING, DELTA_SYNC, VERIFYING, CUTOVER_READY, POSTCHECK, COMPLETED, ROLLED_BACK, BLOCKED.
- Separate safety gates for compatibility/quota, recovery point, initial copy, delta sync, integrity verification, cutover authorization and post-cutover verification.
- Progress calculation derived from actual migration state.
- Source-region deletion remains a separate future authorization and is never automatic.

## Planned KC migrations
- Supabase KC Core: London -> Frankfurt, Germany.
- Neon KC Core Mirror: London -> Frankfurt, Germany.
- Backblaze B2 PC Backup Vault: US -> EU Central Amsterdam because B2 currently offers no German data region.
- Supabase Future Academy: already Frankfurt, no migration required.

## Safety acceptance
PASS only if:
- no cutover can be considered ready before recovery point, initial copy, delta sync and verification;
- no completion can be reached before explicit cutover approval and post-check;
- rollback remains representable at every stage;
- source deletion is never automatic;
- credentials/secrets are not stored in browser state or repository files;
- database migrations preserve one authoritative writer and prevent split-brain.

## Runtime note
The Migration Center is a control-plane state model. It does not perform destructive provider-side region changes by itself. Actual provider migrations must use provider adapters and explicit authorization gates.
