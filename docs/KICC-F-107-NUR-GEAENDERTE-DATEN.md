# KICC-F-107 – Spiegel und Sicherungen übertragen nur geänderte Daten

Wunsch Hansi 18.10.2026 („baue um, dass nur geänderte Daten gespiegelt oder gesichert werden“). Anlass: Supabase-Mail „Your org exceeded … Reduce your egress bandwidth below 5.5 GB“ (Fair Use ab 16.11.2026). Keine Funktion wird reduziert, gedrosselt oder gestrichen – jede Tabelle wird weiter gespiegelt und in jedem Satz gesichert; nur unveränderte Daten verlassen Supabase nicht mehr.

## Befund
- `kc_db_mirror_snapshot` lieferte jede Tabelle doppelt (`rows` und `payload_text`), genutzt wird nur `payload_text` → doppelte Übertragung bei Spiegel und Backup.
- Der Spiegel-Arbeiter übersprang unveränderte Tabellen, holte sie dafür aber vorher komplett ab.
- Das tägliche Backup holte jede Tabelle komplett, auch wenn sie seit gestern gleich war.
- Frankfurt-Sicherung liest jede Nacht ~160 MB Rohdaten (folgt als eigener Schritt).

## Änderung
1. DB (`database/sql/kc-db-mirror-fingerabdruck.sql`): `kc_db_mirror_fingerprint(table)` – nur Zeilenzahl + Prüfsumme (gleiche Berechnung inkl. Schwärzung, ~100 Byte); `kc_db_mirror_snapshot_text(table)` – Snapshot ohne `rows`. Nur service_role.
2. `kc-db-backup-worker` v20 (`database/edge-functions/kc-db-backup-worker/index.ts`): Fingerabdruck zuerst; gibt es in Neon einen Snapshot mit gleicher Zeilenzahl und Prüfsumme aus einem geprüften (ok) Satz, wird er innerhalb von Neon in den neuen Satz kopiert (`transfer_mode: copied_unchanged`). Sonst Übertragung über `kc_db_mirror_snapshot_text`. Jeder Satz bleibt vollständig und eigenständig; Restore-Test unverändert.
3. `kc-db-mirror-worker` (Club-App-Repo): Fingerabdruck zuerst; unverändert + frisch geprüft → überspringen (wie bisher, jetzt ohne Abholen); unverändert, Prüfung älter als 24 h → Ziel in Neon nachrechnen statt neu übertragen (`unchanged_target_verified`); geändert → `kc_db_mirror_snapshot_text`.

## Test
- Fingerabdruck = Snapshot-Prüfsumme (3 Tabellen), Snapshot ohne `rows` halb so groß (kc_club_protokoll 4,0 statt 7,5 MB).
- Backup-Lauf 18.10. ~15:50 UTC (Satz `fa728c0e…`): 224 Tabellen in Neon kopiert, 41 übertragen, 3,1 MB statt 15 MB Nutzdaten.

## Rücknahme
Backup-Worker: vorige Fassung (Snapshot über `kc_db_mirror_snapshot`, ohne Kopierweg) einspielen; Spiegel-Arbeiter: Club-App-Commit zurücknehmen; DB-Funktionen bleiben unschädlich.
