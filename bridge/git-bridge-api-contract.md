# KICC Git Bridge API Contract

Status: PREPARED / NOT DEPLOYED

The bridge is a server-/agent-side component. No GitHub PAT, OAuth refresh token, app private key or repository secret may be shipped to the browser, repository or service worker.

## Endpoints

### `GET /status`
Requires authenticated KICC session. Returns `kicc.git.bridge.v1` with state, trust, measuredAt and granted capabilities. `READY` is valid only for an authenticated, freshly observed bridge.

### `POST /browse`
Capability: `repository.read`.
Input: owner, repo, path, ref.
Output: safe directory metadata only: name, path, type, size, sha, resolved ref. No credential material.

### `POST /download-ticket`
Capability: `repository.download`.
Returns a short-lived one-time or narrowly scoped HTTPS download URL plus expiry and optional SHA. It must not expose provider credentials.

### `POST /transfer`
Accepts only an approved transfer envelope from KICC. Required: actionId, capability, source/target context, branch, recoveryPoint and explicit approval.

Supported operations: UPLOAD, COPY, MOVE, DELETE, MKDIR.

MOVE invariant: COPY -> VERIFY TARGET -> DELETE SOURCE. Source deletion is forbidden if target verification fails.

## Security gates

1. Authenticate KICC user/session.
2. Resolve subject capabilities server-side.
3. Validate repository/branch/path.
4. For writes, verify current SHA/ETag and conflict state.
5. Verify recovery point.
6. Verify explicit approval ID and actor.
7. Execute through provider adapter.
8. Verify resulting target state.
9. Append audit journal.
10. Return result without secrets.

## Audit minimum

requestId/actionId, timestamp, subject, capability/action, repository, branch, path, result, commit SHA when applicable. Never journal secrets or full sensitive file contents.

## Deployment gate

Before production activation: source review, authenticated HTTPS endpoint, least-privilege GitHub App or equivalent provider credential, repository allowlist, capability mapping, replay protection, rate/size limits, audit persistence, recovery/rollback test, regression test and explicit activation approval.
