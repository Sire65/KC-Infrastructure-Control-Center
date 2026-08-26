# KICC Security Agent

Status: PREPARED · not installed · read-only.

## Purpose

The Security Agent closes browser observability gaps for TLS and certificate details. It supplies authoritative metadata to KICC but does not mutate infrastructure.

## Measurements

- endpoint reachability
- DNS resolution metadata
- negotiated TLS version
- negotiated cipher
- certificate subject and issuer
- certificate SHA-256 fingerprint
- certificate validity window
- hostname validation
- certificate chain validation

## Trust

Only fresh observations with `trust=OBSERVED_AGENT` and schema version `1.0` are accepted as authoritative certificate/TLS evidence. Missing or stale evidence remains UNKNOWN/WARNING.

## Safety invariants

- read-only; no certificate installation/removal
- no firewall or DNS changes
- no endpoint mutation
- no business payload collection
- no secrets in browser, repository or service worker
- private targets remain outside KC overall health

## Actions

Security findings are exposed via `KICC_SECURITY.actions()` with RED/YELLOW severity. This allows the general action center to consume the findings without fabricating a healthy state.

## Activation gate

Before a real agent is installed: package/source review, least-privilege account, authenticated local transport, device registration, replay protection, signed observations, regression tests and explicit installation approval.
