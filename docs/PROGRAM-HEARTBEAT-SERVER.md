# Program Heartbeat Server

Stand: 0.1.0-dev.65

## Zweck
Der Remote-Heartbeat-Server nimmt ausschließlich technische Laufzeit-Telemetrie von KC-Programmen entgegen. Er darf keine Fach-, Kassen-, Personen- oder Inhaltsdaten transportieren.

## Aktivierungsgates
Ein produktiver Endpoint darf erst als READY gelten, wenn alle Punkte erfüllt und geprüft sind:

1. HTTPS-Endpunkt vorhanden.
2. Authentifizierung serverseitig erzwungen.
3. Program-Allowlist gesetzt.
4. Kurzlebiger Heartbeat-Store vorhanden.
5. Nonce-/Replay-Schutz aktiv.
6. Zeitfenster/Freshness-Prüfung aktiv.
7. Request-Größenlimit aktiv.
8. Rate-Limit aktiv.
9. GET/READ-Zugriff ebenfalls authentifiziert.
10. Probe mit gültigem Client erfolgreich.
11. Replay-Test wird abgewiesen.
12. Nicht allowlistetes Programm wird abgewiesen.
13. Stale Heartbeat wird abgewiesen.
14. Audit/Monitoring des Endpunkts ist vorhanden.
15. Rollback: Endpoint kann deaktiviert werden, ohne Fachprogramme zu beeinträchtigen.

## Datenumfang
Erlaubt sind u. a. Program-ID, Instanz-ID, Version/Build, Runtime-Status, Messzeitpunkt, Latenz, technische Traffic-Zähler, Queue-Tiefe und Fehlerzähler. Keine Secrets und keine Fachdatensätze.

## Trust
Ein akzeptierter Heartbeat erhält `OBSERVED_BRIDGE` nur, wenn der Server die Quelle authentifiziert und Envelope, Freshness, Nonce und Allowlist geprüft hat. Self-Reports dürfen keine autoritativen Security-Nachweise ersetzen.

## Betriebsregel
KICC ist niemals Voraussetzung für den Betrieb eines Fachprogramms. Fällt der Heartbeat-Endpunkt aus, arbeitet das Fachprogramm weiter; lediglich die Leitwarte zeigt den Status als veraltet/UNKNOWN.
