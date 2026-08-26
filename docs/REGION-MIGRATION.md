# KICC Region Migration Contract

## Goal
KICC shall support controlled moves away from undesired data regions. Preferred jurisdiction for KC infrastructure is Germany where the provider supports a German region.

## Provider targets
- Supabase: target Germany = AWS eu-central-1 Frankfurt. Region changes require a new project and migration; no in-place region change.
- Neon: target Germany = AWS eu-central-1 Frankfurt. Region changes require a new project and data migration; no in-place region change.
- Backblaze B2: no Germany data region currently offered. Closest EU target is EU Central in Amsterdam. A B2 account is tied to one region, so moving from US requires a new EU account/bucket and re-upload/copy before cutover.

## Mandatory workflow
1. Inventory source resource, dependencies, credentials and applications.
2. Select target region from provider-supported regions.
3. Compatibility and quota/cost check.
4. Create and verify recovery point.
5. Provision target without changing production routing.
6. Initial copy.
7. Delta sync or controlled read-only window for final changes.
8. Verify schema/data/object counts/checksums/integrity.
9. Application test against target.
10. Explicit cutover authorization.
11. Switch endpoints/credentials/routing.
12. Post-cutover health and performance test.
13. Observation period.
14. Old region remains retained until separately approved for deletion.
15. Audit journal and migration report.

## Planned KC moves
- Supabase KC Core: eu-west-2 London -> eu-central-1 Frankfurt.
- Neon KC Core Mirror: aws-eu-west-2 London -> aws-eu-central-1 Frankfurt.
- Backblaze B2 PC Backup Vault: current US region must be verified -> eu-central (Amsterdam, EU; Germany unavailable).
- Supabase Future Academy already uses eu-central-1 Frankfurt and therefore needs no region move.

## Safety
No source deletion is automatic. No destructive cutover is permitted without verified copy, integrity comparison, recovery point and explicit authorization. During database moves KICC must prevent split-brain and identify the authoritative writer throughout the migration.
