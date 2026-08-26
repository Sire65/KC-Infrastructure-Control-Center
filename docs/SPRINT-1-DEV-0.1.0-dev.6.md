# KICC Sprint 1 DEV 0.1.0-dev.6

Date: 2026-08-26

## Live Supabase telemetry
- KC Core Supabase project registered separately in eu-west-2.
- Future Academy Supabase project registered separately in eu-central-1.
- Safe read-only telemetry RPC installed in both projects.
- RPC returns only technical metadata from PostgreSQL catalogs: health, database size, table count, RLS-enabled table count, policy count, PostgreSQL version and schema fingerprint.
- No KC business payloads are read or returned.
- RPC execution revoked from anon/authenticated and allowed only to service_role.
- JWT-protected Edge Function `kicc-telemetry` deployed and ACTIVE in both projects.
- Edge Function uses service role only server-side and returns a sanitized KICC bridge payload.

## Current observations during deployment
- KC Core: PostgreSQL 17.6, 123 tables, 145 policies, 109 RLS-enabled tables, ~140 MB database size.
- Future Academy: PostgreSQL 17.6, 71 tables, 44 policies, 58 RLS-enabled tables, ~20 MB database size.

## Neon discovery
- Neon project `KC Core Mirror` discovered in aws-eu-west-2.
- PostgreSQL 18.
- Runtime bridge still pending; no connection string or password is embedded in KICC.

## Authentication
- KICC bridge adapter now supports authenticated bridge requests.
- Missing/expired authorization produces UNKNOWN/AUTH_REQUIRED, never false green.
- Browser code contains no service-role keys, database passwords or connection strings.

## Feature IDs
- KICC-S1-012 Supabase safe telemetry RPC.
- KICC-S1-013 JWT-protected telemetry Edge Function.
- KICC-S1-014 Multi-project Supabase registry.
- KICC-S1-015 Authenticated bridge adapter.
- KICC-S1-016 Neon mirror discovery.

## Remaining work
- Wire KICC authentication/session provider to Edge Function JWT.
- Build secure Neon telemetry bridge.
- Add backup/sync/failover provider telemetry; these remain UNKNOWN until measured.
- Run UI/runtime regression after public/authorized deployment path is available.
