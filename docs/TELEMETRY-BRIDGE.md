# KICC Secure Telemetry Bridge 1.0

## Purpose
The browser/PWA must never contain provider admin keys, database passwords or service-role secrets. Remote database observations are therefore delivered through a read-only telemetry bridge.

## Browser contract
KICC receives only operational metadata. It never receives productive business rows through this bridge.

Required response fields:
- targetId
- status
- measuredAt

Allowed optional capability fields:
- health
- latency
- reads
- writes
- storage
- schema
- policies
- integrity
- drift
- sync
- backup
- restore
- failover
- migration
- message

Unknown fields are discarded by the browser adapter.

## Example payload
```json
{
  "targetId": "db-supabase",
  "status": "HEALTHY",
  "measuredAt": "2026-08-26T04:00:00.000Z",
  "schema": {"state":"AVAILABLE","version":"42","hash":"sha256:..."},
  "policies": {"state":"AVAILABLE","count":31},
  "sync": {"state":"AVAILABLE","lagMs":80,"lastSuccess":"2026-08-26T03:59:59.000Z"},
  "backup": {"state":"AVAILABLE","ageSeconds":3600,"healthy":true},
  "failover": {"state":"AVAILABLE","enabled":true,"detail":"ready"}
}
```

## Security requirements
- Secrets exist only server-side in the bridge runtime/secret store.
- Bridge endpoint is read-only for KICC.
- No SQL text, passwords, connection strings, tokens or provider keys are returned.
- CORS is restricted to approved KICC origins in production.
- Authentication/authorization is required before FINAL deployment.
- Measurements older than two minutes are treated as stale/UNKNOWN.
- Mutations, failover execution, restore and migration execution are not part of this endpoint.

## Runtime configuration
Endpoint URLs are non-secret configuration and may be supplied before `app.js` loads:

```js
globalThis.KICC_BRIDGE_ENDPOINTS = {
  "db-supabase": "https://example.invalid/kicc/telemetry/supabase",
  "db-neon": "https://example.invalid/kicc/telemetry/neon"
};
```

If no endpoint is configured the datastore remains UNKNOWN, never green.
