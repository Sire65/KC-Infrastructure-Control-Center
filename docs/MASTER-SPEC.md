# KICC Master Specification 1.0

## 1. Zweck

KICC ist die zentrale Leitwarte fuer die gesamte KC-Produktfamilie. Es ueberwacht Programme, Installationen, Geraete, Clients, Datenbanken, Provider, Datenfluesse, Versionen, Updates, Performance, Security, Backup, Failover, Migrationen, Incidents und TUEV-Status.

## 2. Leitprinzipien

- Standalone-Anwendung, aber mit Anbindung an die gesamte KC-Infrastruktur.
- Flexible Registry statt starrer Produkt-/Providerlogik.
- Erweiterbare Adapter fuer Provider, Programme, Geraete, Transporte und Monitoring.
- Echte Telemetrie statt Demo-/Fake-Status.
- Automation First; kritische Aktionen nur mit Freigabe.
- Auswahl/Erkennung vor Freitext.
- Zero-Cost: keine zusaetzlichen Gebuehren oder zwingenden Bezahlfunktionen.
- KICC darf selbst kein Single Point of Failure sein.

## 3. Kernobjekte

- PRODUCT: KC-Produkt
- INSTALLATION: konkrete Installation/Deployment
- DEVICE: PC, Tablet, Handy, Kasse, Server usw.
- CLIENT: laufende Instanz/Session
- PROVIDER: Supabase, Neon, GitHub, Cloudflare, weitere
- RESOURCE: Datenbank, Tabelle, API, Function, Storage usw.
- FLOW: gerichteter Datenfluss
- METRIC: Telemetrie/Health/Performance
- INCIDENT: Stoerung
- RELEASE: Version/Build/Channel
- TEST: Regression/TUEV
- AUDIT: administrative Aenderung

## 4. Statusmodell

- GRUEN: bestaetigt betriebsbereit
- GELB: Warnung/Einschraenkung
- ROT: echte Stoerung
- BLAU: Wartung/Test
- GRAU: offline/inaktiv/unbekannt

Traffic ist davon getrennt. Traffic-Indikatoren sind im Ruhezustand inaktiv und reagieren nur auf reale fachliche Datenuebertragung.

## 5. Hauptnavigation

1. Dashboard
2. Live-Leitwarte
3. KC-Produkte
4. Geraete & Clients
5. Datenbanken
6. Datenfluesse & Abhaengigkeiten
7. Performance
8. Security
9. Backup & Recovery
10. Migration
11. Updates & Releases
12. Stoerungen & Journal
13. TUEV & Tests
14. Administration
15. KC Assistant

## 6. Live-Leitwarte

Drei umschaltbare Ebenen:

- Infrastruktur: Geraete -> Programme -> Datenbanken -> Provider
- Daten: Quelle -> Datenklasse -> Ziel
- Stoerungen: nur betroffene Komponenten und Abhaengigkeiten

Knoten und Verbindungen werden dynamisch aus der Registry aufgebaut. Neue Programme, Geraete oder Provider duerfen ohne UI-Umbau erscheinen.

## 7. Datenfluesse

Jeder FLOW enthaelt mindestens:

- source_id
- target_id
- data_class
- direction
- transport
- master/consumer/editor/mirror/archive roles
- SLA
- last_success
- records_per_second
- bytes_per_second
- latency
- queue_depth
- sync_lag
- error_state

Bidirektionale Verbindungen werden intern als zwei getrennt messbare Richtungen behandelt.

## 8. Masterdaten / Data Lineage

Fuer jede Datenklasse wird der fachliche MASTER definiert. KICC verfolgt Herkunft und Weitergabe wichtiger Datenobjekte ueber alle Stationen. Ziel ist die Diagnose: wo erzeugt, wo uebertragen, wo verarbeitet, wo gespiegelt, wo gesichert.

## 9. Datenbankmanagement

Unterstuetzt werden mindestens IndexedDB, Supabase und Neon. Weitere Provider muessen per Adapter integrierbar sein. Funktionen: Health, Latenz, Reads/Writes, Storage, Schema, Policies, Integritaet, Drift, Sync, Backup, Restore, Failover und Migration nach Capability.

## 10. Provider-Rollen

Rollen sind Konfiguration, nicht Code:

PRIMARY, MIRROR, FAILOVER, STANDBY, TEST, ARCHIVE.

Supabase oder Neon duerfen nie als fest verdrahtete Rolle im Kerncode angenommen werden.

## 11. Performance

Professionelle Gauges und Charts. Gauges zeigen Wert, Einheit und Bewertung: Sehr schnell, Schnell, Normal, Langsam, Kritisch. Historie: Live, 1h, 24h, 7d, 30d, Jahr.

## 12. Security

Capability-basierte Rechte. Mindestens: monitor.read, tests.execute, database.maintain, backup.restore, failover.execute, migration.execute, provider.manage, security.manage.

Secrets werden nie im Browser oder Repo offengelegt.

## 13. Backup & Recovery

Backup-Zustand, Alter, Groesse, Integritaet, Restore-Test, Recovery-Punkt und Historie. Kritische Aktionen pruefen Recovery vor Ausfuehrung.

## 14. Migration

Assistent: Provider verbinden -> Health -> Kompatibilitaet -> Schema -> Daten -> Spiegelung -> Vergleich -> Lasttest -> Failover-Test -> TUEV -> Rollenwechsel. Rollback ist Pflicht.

## 15. Incident Management

Alarm-Deduplizierung und Korrelation. Eine Hauptursache soll nicht hunderte Folgealarme erzeugen. Incidents dokumentieren Beginn, Ende, Ursache, Auswirkung, Massnahmen, Recovery und Abschluss.

## 16. Update & Version Governance

Semantic Versioning MAJOR.MINOR.PATCH plus Buildkennung. Eine einzige Versionsquelle pro Produkt. Installierte Version, GitHub FINAL, Core-Versionen und Schema-Version werden getrennt verwaltet. Release mit gleicher/niedrigerer Version wird blockiert.

DEV -> RC -> FINAL. FINAL nur nach allen Release-Gates.

## 17. Installation

KICC als installierbare PWA fuer Windows-PC, Android-Handy und Android-Tablet. Zusaetzlicher Windows Agent fuer lokale Programme, Prozesse und lokale Ressourcen. QR-Device-Provisioning ist vorgesehen.

## 18. Update-Lifecycle

AVAILABLE -> DOWNLOADING -> READY -> ACTIVATING -> VERIFYING -> CURRENT. Bei Fehler: FAILED und funktionsfaehige Vorversion weiterverwenden/rollback. Wenn lokal = FINAL, darf keine erneute Installationsaufforderung erscheinen.

## 19. Automation First

Automatisch, wo sicher: Discovery, Healthchecks, Versionsvergleich, Sync-Checks, Backup-Checks, Security-Checks, Retention, Telemetrieverdichtung, Incident-Erstellung und Diagnose. Kritische Aenderungen werden vorbereitet, aber benoetigen Freigabe.

## 20. Bedienung

Select Before Type. Dropdowns, Suche, Checkboxen, Mehrfachauswahl, Vorlagen, erkannte Vorschlaege und Assistenten bevorzugen. Freitext nur dort, wo technisch/fachlich noetig.

## 21. KC Assistant

Vollwertiger Assistent mit KICC-Fachwissen und kontrollierter Web-Recherche. Er darf Fragen beantworten, Ansichten oeffnen, Diagnosen und freigegebene Aufgaben starten. Risikostufen: GRUEN selbststaendig, GELB bestaetigen, ROT ausdrueckliche Freigabe. KICC muss ohne KI voll funktionsfaehig bleiben.

## 22. UI-Technologie

Externe kostenlose/open-source Komponenten werden bevorzugt und ueber KC-Cores gekapselt. Vorgesehen: Apache ECharts fuer Gauges/Charts, Cytoscape.js fuer Topologie/Datenfluesse, AG Grid Community als Tabellenkandidat. Keine Enterprise-/Bezahlfeatures.

## 23. Cores

Vorhandene KC-Cores sind verbindlich, u.a. WindowCore, Tablet/MobileCore, NavigationCore, TableCore, DesignCore, LEDDisplayCore, AnimationCore, DataCore, SecurityCore, CapabilityCore, UpdateCore, JournalCore, TimerCore. KICC-Fachcores duerfen diese nicht duplizieren.

## 24. Tests/TUEV

Testfamilien: Core, UI, Registry, DB, Flow, Sync, Performance, Security, Backup, Failover, Update, Migration, Journal, Zero-Cost, Visual. Profile: QUICK, STANDARD, DEEP, SUPER-GAU, RELEASE.

## 25. Definition of Done

Feature ist erst DONE nach allen zutreffenden Gates: Funktion, Daten, Fehlerfaelle, Security, Bedienung, Tablet, Performance, Journal, Regression, Visual-TUEV, Framework-Studio, Architektur-TUEV.

## 26. Selbstueberwachung

Jeder Messwert traegt Messzeit, Quelle, Alter und Vertrauensstatus. Veraltete Telemetrie darf nicht als OK angezeigt werden. KICC ueberwacht eigenen Telemetriefluss und Ressourcenverbrauch.

## 27. Zero-Cost

Jede Abhaengigkeit und Provider-Funktion muss kostenneutral bleiben. KICC ueberwacht Free-Limits und prognostiziert Verbrauch. Bezahlfunktionen werden nicht automatisch aktiviert.

## 28. Uebergabefaehigkeit

Das Repository ist die einzige technische Wahrheit. Keine Abhaengigkeit von Chatverlaeufen. Module dokumentieren purpose, dependencies, data_sources, permissions, features, tests, ui_components, failure_modes und done_criteria.
