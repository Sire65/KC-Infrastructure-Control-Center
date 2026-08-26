# KC Backblaze B2 Preparation

Status: PREPARED_ONLY

The existing PC Backup Vault B2 storage remains PRIVATE. Future KC use must be provisioned as separate KC resources and must not share bucket credentials with PRIVATE backup infrastructure.

## Prepared resource classes
- KC_BACKUP: encrypted backups and recovery data for KC systems.
- KC_ARCHIVE: optional media/export/archive data that does not belong in PostgreSQL.

## Activation gates
1. Select provider-supported EU target region; Germany preferred if offered in future.
2. Create a dedicated KC bucket. Do not reuse the PRIVATE PC Backup Vault bucket.
3. Create dedicated least-privilege KC application keys.
4. Define allowed data classes and prohibited content.
5. Define retention/versioning/lifecycle rules.
6. Require encryption policy before first productive upload.
7. Connect KICC telemetry without storing secrets in browser or repository.
8. Verify upload/download/integrity monitoring.
9. Perform and pass a restore test.
10. Explicitly authorize activation as a KC production resource.

## Separation invariants
- PRIVATE B2 failures never affect KC overall health or KC failover.
- KC B2 resources may affect KC backup/recovery status only after activation.
- PRIVATE and KC credentials are never reused across scopes.
- Prepared resources remain UNKNOWN/PREPARED and must never render HEALTHY before authoritative observation.
- No bucket creation, copy, migration or deletion is part of this preparation step.
