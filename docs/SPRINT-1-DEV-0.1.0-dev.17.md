# KICC 0.1.0-dev.17

## Ziel
KC-Programme als eigene Produkte mit Repo-, Deployment-, Versions-, Telemetrie- und Abhängigkeitsstatus modellieren.

## Neu
- `products/kc-product-model.js`: Produktmodell und Health-Auswertung.
- `products/impact-analysis.js`: Auswirkungsanalyse Ressource -> betroffene KC-Produkte.
- `products/kc-program-registry.js`: bekannte KC-Produkte mit Datenbank-, Kommunikations-, Failover- und Storage-Abhängigkeiten.
- Produktstatus bleibt UNKNOWN, solange Live-Deployment/Telemetrie nicht autoritativ bestätigt ist.
- Private Ressourcen (PC Backup Vault, privates Backblaze B2) sind keine KC-Abhängigkeiten und dürfen keinen KC-Produktstatus beeinflussen.

## Sicherheits-/Qualitätsregeln
- Repo-Erreichbarkeit allein bedeutet nicht, dass ein Produkt produktiv gesund ist.
- Keine Deployment-URL wird erfunden oder aus Vermutung als produktiv markiert.
- `OBSERVED_ATTEMPT` ist nicht autoritativ und kann kein HEALTHY erzwingen.
- Auswirkungsmatrix zeigt pro KC-Ressource die betroffenen Produkte und kritischen Produkte.

## Nicht durchgeführt
- Keine Regionsmigration gestartet.
- Kein KC-B2-Bucket angelegt.
- Keine produktiven Endpunkte umgeschaltet.
- Keine Datenbankrollen geändert.
