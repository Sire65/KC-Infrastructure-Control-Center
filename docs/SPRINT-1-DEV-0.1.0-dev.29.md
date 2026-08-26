# KICC 0.1.0-dev.29 – Truth-Model-Konsolidierung

## Ziel

Dieser Build korrigiert drei Wahrheitsmodell-Probleme, bevor weitere Leitstand-Oberfläche hinzukommt.

## 1. Repository ist nicht Produktgesundheit

Normale KC-Produkte verwenden `RUNTIME_REQUIRED`. Ein erreichbares GitHub-Repository beweist nur Source-/Repository-Gesundheit. `HEALTHY` für ein laufendes Produkt erfordert einen frischen autoritativen Runtime-Nachweis über Deployment- oder Telemetrie-Health.

Repo- und Runtime-Messzeiten sind getrennt (`repoMeasuredAt` / `runtimeMeasuredAt`). Ein frischer Repo-Check darf eine alte Runtime-Messung nicht künstlich auffrischen.

## 2. KC und PRIVATE sind auf Datenebene getrennt

`databases` enthält nur KC-Datenbanken. `privateDatabases` enthält private Ressourcen, aktuell den PC Backup Vault Neon-Katalog. KC-Gesamtstatus, KC-Abdeckung, KC-KPIs und Failover verwenden ausschließlich KC-Ressourcen.

Private Ressourcen dürfen separat beobachtet werden, beeinflussen aber keine KC-Entscheidung.

## 3. Keine doppelte Repo-Wahrheit

Die alte zweite Repository-Liste in `app.js` wurde entfernt. KC-Programme und ihre Repositories werden ausschließlich über `products/kc-program-registry.js` geführt.

## Invarianten

- Repo-only darf ein normales KC-Produkt nicht auf `HEALTHY` setzen.
- PRIVATE darf nie KC-Gesamtstatus, KC-Abdeckung, KC-Produktgesundheit oder KC-Failover beeinflussen.
- UNKNOWN bleibt UNKNOWN, wenn Runtime-Evidence fehlt oder veraltet ist.
- UI darf PRIVATE nicht durch nachträgliches DOM-Löschen oder Array-Splicing aus KC entfernen; die Trennung muss bereits im Modell bestehen.

## Nicht geändert

- Keine Datenbankmigration durchgeführt.
- Keine Region gewechselt.
- Keine B2-Buckets erstellt oder Daten verschoben.
- Kein Failover/Cutover ausgeführt.
