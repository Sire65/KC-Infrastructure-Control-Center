# KICC Sprint 1 · DEV 21

## Schwerpunkt
Security-Agent als überwachte, read-only KICC-Komponente.

## Zustände
- PREPARED: Vertrag/UI vorhanden, Endpoint noch nicht verbunden.
- AUTH_REQUIRED: Endpoint bekannt, sichere Authentifizierung fehlt oder ist abgelaufen.
- ONLINE: frische, valide OBSERVED_AGENT-Telemetrie angenommen.
- DEGRADED: Agent/Antwort erreichbar, aber Messungen unvollständig oder teilweise verworfen.
- FAILED: Konfigurationsfehler wie unsicherer HTTP-Agent-Endpoint.

## Sicherheitsregeln
1. Agent-Endpoint muss HTTPS verwenden.
2. Agent-Secrets bleiben außerhalb Browser, Repo und Service Worker.
3. Agent ist read-only und verändert weder Zertifikate noch DNS, Firewall oder Endpoints.
4. Nur frische OBSERVED_AGENT-Messungen dürfen TLS-/Zertifikatsdetails verifizieren.
5. Agent-Ausfall bedeutet fehlenden/veralteten Nachweis und nicht automatisch einen unverschlüsselten Datenfluss.
6. Ein echter unsicherer Befund (z. B. abgelaufenes Zertifikat, ungültige Chain, Hostname-Mismatch, veraltetes TLS) erzeugt Security-Handlungsbedarf.
7. PRIVATE-Ziele bleiben vom KC-Gesamtstatus getrennt.

## UI
Security enthält einen eigenen Agent-Bereich mit:
- Agent-Verbindungsstatus
- Endpoint konfiguriert/nicht konfiguriert
- letzte Messung
- Anzahl überwachte Targets
- TLS-Version
- Cipher
- Zertifikatsablauf
- Issuer
- konkrete Issues pro Target

## Noch nicht aktiv
Es wurde kein Security-Agent installiert, kein Agent-Endpoint eingerichtet und kein Credential erzeugt. Der aktuelle reale Zustand bleibt PREPARED/UNKNOWN bis zur späteren Verbindung.
