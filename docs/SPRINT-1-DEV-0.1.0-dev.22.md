# KICC 0.1.0-dev.22 — Security Code Evidence

## Ziel
Security-Register nicht nur mit Sollwerten, sondern mit belegbaren Code-/Architektur-Nachweisen aus KC-Repositories versorgen.

## Neue Evidence Registry
`security/code-evidence-registry.js` trennt:
- `ARCHITECTURE_BASELINE`: verbindliche Soll-/Release-Regeln aus dem Produktrepo.
- `CODE_OBSERVATION`: im aktuellen Runtime-Code tatsächlich sichtbares Verhalten.

Code-Nachweis ist kein Laufzeitnachweis. `OBSERVED_CODE` darf fehlende Live-/Agent-Verifikation nicht automatisch grün machen.

## Marktkasse — belegte Befunde
### Security-Baseline
Quelle: `Sire65/Kasse/SECURITY_ARCHITECTURE.md`
- AES-256-GCM als Baseline für application-controlled storage.
- HTTPS/TLS only.
- per-device Signing oder hochentropischer MAC-Key als Request-Auth.
- Replay-Schutz mit Timestamp + Nonce/Request-ID.
- keine Production-Secrets im Tablet/Repo.
- Plaintext-localStorage ist explizit Legacy und darf erst nach getesteter verschlüsselter Migration abgelöst werden.

### Runtime-Codebeobachtung
Quelle: `Sire65/Kasse/shared/kc-resilience.js`
- Sync-Gateway: `https://kc-failover-gateway.ha-joko.workers.dev`.
- Transport im Clientcode: HTTPS.
- Transaktionen, Outbox, ACKs, Konflikte und Status werden aktuell als JSON in `localStorage` geschrieben.
- Der betrachtete Clientcode sendet `x-kc-client: KC-MarktKasse`; eine per-device Signatur/MAC ist in diesem Modul nicht sichtbar.

KICC bewertet deshalb:
- `KC Marktkasse -> Browser localStorage`: **INSECURE/ROT**, weil Payload im application-controlled localStorage unverschlüsselt sichtbar ist.
- `KC Marktkasse -> KC Failover Gateway`: **WARNING/GELB**, weil HTTPS belegt ist, aber die geforderte per-device Request-Authentifizierung noch nicht runtime-verifiziert wurde.

## Gateway-Baseline
Quelle: `Sire65/KC-Failover-Gateway/SECURITY_ARCHITECTURE.md`
- Sync/Reconcile/Restore müssen authentifiziert sein.
- Client-Label ist ausdrücklich keine Authentifizierung.
- per-device Credentials müssen separat widerrufbar sein.
- Replay-Schutz und Register-Bindung sind Pflicht.

## Sicherheitsregel
Ein Soll-Dokument allein macht keinen Flow grün. Erst frische autoritative Telemetrie (`OBSERVED_REMOTE`/`OBSERVED_AGENT`) oder eine explizit zulässige verifizierte Konfiguration kann einen Sicherheitsnachweis vervollständigen.

## Nicht durchgeführt
- keine Änderung an Marktkasse oder Gateway
- keine Migration von localStorage
- keine Auth-/Key-Rotation
- kein Datenbank-/Provider-Cutover
- keine Region-Migration

## Nächste Schritte
1. tatsächliche Gateway-Request-Auth im deployten Worker/Endpoint verifizieren;
2. verschlüsselte Marktkassen-Speicherschicht vorbereiten, aber bestehende Legacy-Daten erst nach Restore/Offline/Rollback-Tests migrieren;
3. weitere KC-Repositories in die Evidence Registry aufnehmen;
4. Security-Gaps mit Produkt-Auswirkungsanalyse korrelieren.
