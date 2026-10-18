# KICC-F-107 – Spiegel und Sicherungen übertragen nur geänderte Daten

Wunsch Hansi 18.10.2026 („baue um, dass nur geänderte Daten gespiegelt oder gesichert werden“). Anlass: Supabase-Mail „Your org exceeded … Reduce your egress bandwidth below 5.5 GB“ (Fair Use ab 16.11.2026). Keine Funktion wird reduziert, gedrosselt oder gestrichen – jede Tabelle wird weiter gespiegelt und in jedem Satz gesichert; nur unveränderte Daten verlassen Supabase nicht mehr.

## Befund
- `kc_db_mirror_snapshot` lieferte jede Tabelle doppelt (`rows` und `payload_text`), genutzt wird nur `payload_text` → doppelte Übertragung bei Spiegel und Backup.
- Der Spiegel-Arbeiter übersprang unveränderte Tabellen, holte sie dafür aber vorher komplett ab.
- Das tägliche Backup holte jede Tabelle komplett, auch wenn sie seit gestern gleich war.
- Frankfurt-Sicherung las jede Nacht alles neu (18.10.: 319 Teile, 108 MB Rohdaten, davon 73 MB `kc_system_check_history`). Teilgrenzen großer Tabellen wurden täglich neu berechnet – kein Teil blieb gleich.

## Änderung
1. DB (`database/sql/kc-db-mirror-fingerabdruck.sql`): `kc_db_mirror_fingerprint(table)` – nur Zeilenzahl + Prüfsumme (gleiche Berechnung inkl. Schwärzung, ~100 Byte); `kc_db_mirror_snapshot_text(table)` – Snapshot ohne `rows`. Nur service_role.
2. `kc-db-backup-worker` v20 (`database/edge-functions/kc-db-backup-worker/index.ts`): Fingerabdruck zuerst; gibt es in Neon einen Snapshot mit gleicher Zeilenzahl und Prüfsumme aus einem geprüften (ok) Satz, wird er innerhalb von Neon in den neuen Satz kopiert (`transfer_mode: copied_unchanged`). Sonst Übertragung über `kc_db_mirror_snapshot_text`. Jeder Satz bleibt vollständig und eigenständig; Restore-Test unverändert.
3. `kc-db-mirror-worker` (Club-App-Repo): Fingerabdruck zuerst; unverändert + frisch geprüft → überspringen (wie bisher, jetzt ohne Abholen); unverändert, Prüfung älter als 24 h → Ziel in Neon nachrechnen statt neu übertragen (`unchanged_target_verified`); geändert → `kc_db_mirror_snapshot_text`.
4. Frankfurt-Sicherung (Club-App PR #62, `kc-club` fraSchritt, neue Datei `fra-teile.js`): Teilgrenzen vom letzten geprüften Lauf übernommen (nur der letzte Bereich neu geteilt; passt ein Bereich nicht → neu teilen wie bisher). Je Teil zuerst SHA-256 des Inhalts in der Datenbank; gleich wie ein geprüfter Teil der letzten 13 Tage → Datei im Neon-Dateispeicher per S3-Kopie (`x-amz-copy-source`), sonst wie bisher hochladen. Rücklese-Test prüft auch Kopien; kaputte Kopie → `kopiert_von = 'kopie_fehler'`, normal neu gesichert. Neue Spalten `inhalt_sha256`, `kopiert_von` (Migration `20261018_kicc_f107_fra_nur_geaenderte.sql`). Stand: `kopiert`, `uebertragen_roh_bytes`. Wirkung ab dem zweiten Lauf nach dem Hochladen (erst dann gibt es Prüfsummen).

## Test
- Fingerabdruck = Snapshot-Prüfsumme (3 Tabellen), Snapshot ohne `rows` halb so groß (kc_club_protokoll 4,0 statt 7,5 MB).
- Backup-Lauf 18.10. ~15:50 UTC (Satz `fa728c0e…`): 224 Tabellen in Neon kopiert, 41 übertragen, 3,1 MB statt 15 MB Nutzdaten.
- Restore-Test für Satz `fa728c0e…` zuerst rot bei `kc_traffic_guard_samples`/`kc_traffic_guard_row_samples`: Ursache Schemaabweichung (Spalte `ursache` am 18.10. 13:06 UTC hinzugefügt, Spiegel zuletzt 12:10). Nach Spiegellauf 15:48 UTC (neuer Spiegel-Arbeiter, beide `ok`, `hash_match`) Restore-Test erneut: bestanden, 0 Fehler.
- Spiegel-Arbeiter: zweiter Lauf derselben Tabelle → `unchanged_source_skip` (kein Abholen).
- Frankfurt: `tests/fra-teile.test.mjs` 6/6; Prüfsummen-Abfrage in der Datenbank getestet; Messung nach den Läufen 19./20.10.

## Rücknahme
Backup-Worker: vorige Fassung (Snapshot über `kc_db_mirror_snapshot`, ohne Kopierweg) einspielen; Spiegel-Arbeiter: Club-App-Commit zurücknehmen; DB-Funktionen bleiben unschädlich.

## Nachtrag KICC-F-108 (18.10.2026, Wunsch Hansi „Ja umsetzen“): Spiegellauf in Wellen
- Befund: Verlauf (Admin-Zentrale) zeigte alle 6 h rote Säulen „Fehlgeschlagene Hintergrund-Aufrufe“ (12./13. von 24 Anfragen um 06:20 und 12:20 UTC, nach F-107 noch 1 von 24 um 18:10 UTC: 503 BOOT_ERROR). Ursache: `kc_neon_low_compute_cycle()` schickte alle Spiegel-Pakete gleichzeitig.
- Änderung (`database/sql/kc-db-mirror-welle.sql`): 3 Pakete sofort, Rest in `kc_internal.kc_db_mirror_welle` vorgemerkt (je Minute 3); Job `kc-db-mirror-welle` (`11-22 0,6,12,18 * * *`) schickt sie ab. Gleiche Tabellen, gleiche Pakete – nur zeitlich verteilt. Nachholung um :25 bleibt.
