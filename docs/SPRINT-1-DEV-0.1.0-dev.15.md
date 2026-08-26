# KICC 0.1.0-dev.15

## Scope separation
- Domain `KC`: KC programs and KC infrastructure. Only these resources influence KC overall health, coverage, failover and KC incident decisions.
- Domain `PRIVATE`: personal infrastructure such as PC Backup Vault and Backblaze B2. These resources may be monitored in KICC but remain isolated from all KC health and failover semantics.

## KC program registry
Known connected/discovered KC repositories include KC DP2 (`dp3`), Dienstplan legacy, KC Marktkasse, KC Bilderrechner, KC Futura Academy, KC Communication, KC Communication Public, KC Failover Gateway, KC Werbewebsite, KC Küchen-Detektiv and KICC itself.

## Private infrastructure
- Neon PC Backup Vault: PRIVATE.
- Backblaze B2 PC Backup Vault: PRIVATE.
- Private resources are displayed in their own dashboard area and removed from the KC runtime resource set.

## Safety
No region migration, database cutover, data copy, role switch or deletion was executed in this build.
