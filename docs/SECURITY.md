# KICC Security Baseline 1.0

## Principles
Least privilege, explicit trust boundaries, no secrets in repository, auditable changes, separation of monitoring from administration, safe defaults and fail-closed authorization.

## Action risk classes
GREEN: read/search/analyse/test/report.
YELLOW: reversible operational/configuration action requiring confirmation where appropriate.
RED: destructive or high-impact action such as delete, restore, failover, schema/provider/security change; explicit approval and audit record required.

## Credentials
Secrets are referenced through environment/secret stores and never committed. UI must never expose full credentials. Provider adapters receive only required scope.

## Assistant boundary
AI never receives unrestricted SQL/admin access. It can request only allow-listed KICC tools. KICC authorization decides whether a tool call is permitted and whether approval is required.

## Telemetry privacy
Prefer counts, timings, identifiers/hashes and health metadata. Business payload inspection is exceptional, permission-controlled and journaled.

## Audit
Security-sensitive configuration, approvals, releases, restore/failover, user/role changes and destructive actions generate immutable audit events according to retention policy.