# KC Infrastructure Control Center (KICC)

Zentrale Überwachungs-, Management- und Leitstellen-Anwendung für die gesamte KC-Infrastruktur.

## Projektstatus

- Phase: Sprint 0 abgeschlossen / Sprint 1 Vorbereitung
- Version: 0.1.0 DEV
- Release-Kanal: DEV
- Kostenregel: zusätzliche Gebühren verboten
- Architekturprinzip: Registry + Adapter + Capabilities, keine hart codierten Provider oder Programme

## Kernziele

KICC überwacht und verwaltet Programme, Geräte, Clients, Datenbanken, Provider, Datenflüsse, Versionen, Updates, Backups, Failover, Security, Performance, Incidents und Migrationen.

Echte Datenverkehrsanimation darf ausschließlich auf real gemessener Telemetrie beruhen. Status und Traffic sind getrennte Zustände.

## Release-Modell

DEV -> RC -> FINAL

Jeder Release benötigt Versionshochzählung, Regression, Visual-TÜV, Security-Prüfung, Zero-Cost-Prüfung und Release-TÜV.

## Dokumentation

Die verbindlichen Spezifikationen liegen unter `docs/`. Entwicklerregeln stehen in `AGENTS.md`.
