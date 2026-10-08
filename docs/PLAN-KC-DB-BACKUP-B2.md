# Plan: KC-Datenbank-Backups zusaetzlich auf Backblaze B2

Feature-ID: **KICC-F-099** · Status: **GEPLANT** (Umsetzung nach dem Weihnachtsmarkt) · Stand: 2026-10-08

## 1. Ausgangslage
| Was | Ist-Zustand (geprueft 2026-10-08) |
|---|---|
| Quelle | Supabase KC Core (`ptblnpiroqftcvlsrhac`), 240 gespiegelte Tabellen |
| Taegliches Backup | 00:12 UTC, `kc_neon_low_compute_backup_cycle()` → `kc-db-backup-worker`; AES-256-GCM, unveraenderlich, Backup-Satz je Tag |
| Ablage | **nur in Neon** (KC Core Mirror, `purple-hat-23047492`) |
| Restore-Test | 00:15 UTC, `kc_db_backup_verify_latest()` → `kc-db-backup-verify-v2`; zuletzt 240/240 Tabellen ok |
| B2 | nur PRIVATER Bucket des PC Backup Vault (`pc`), 2.305 Objekte, ca. 3,7 GB; fuer KC nicht freigegeben |
| Vorbereitet | `storage/kc-b2-prepared.js`: Ressource `storage-b2-kc-backup` (PREPARED), Freigabeschritte in `docs/KC-B2-PREPARATION.md` |

**Risiko:** Spiegel und Backups liegen beim selben Anbieter. Verlust des Neon-Projekts oder -Kontos (Fehlbedienung, Sperre, Anbieterausfall) trifft beides gleichzeitig. Es gibt keine Kopie ausser Haus (3-2-1-Regel verletzt).

## 2. Ziel
Jeder taegliche Backup-Satz liegt zusaetzlich verschluesselt und unveraenderlich in einem **eigenen KC-Bucket auf B2**. Er wird regelmaessig von dort wiederhergestellt und geprueft, und KICC zeigt seinen Zustand ehrlich an.

Nicht-Ziele: kein Umbau des Neon-Backups, keine Aenderung am PRIVATEN Bucket, kein Live-Replikat.

## 3. Architektur
```
pg_cron 00:12 ──► kc-db-backup-worker ──► Neon (wie heute)
                                  └────► B2 KC-Bucket (neu, S3-API, Object Lock)
pg_cron 00:15 ──► kc-db-backup-verify-v2 ──► Neon-Satz pruefen (wie heute)
pg_cron 00:40 ──► kc-db-backup-b2-verify (neu) ──► B2-Satz lesen, Hash vergleichen
kicc-backup-telemetry ──► KICC: Ressource storage-b2-kc-backup (PREPARED → beobachtet)
```
- **Bestehende Kerne nutzen (Regel 3):** Der vorhandene Backup-Worker bekommt ein zweites Ziel ueber einen Storage-Adapter; kein paralleler Backup-Dienst.
- **Adapter statt hart codiert (Regel 4/18):** Ziel `s3-compatible` mit Endpoint, Bucket und Key aus Secrets. B2 ist der erste Anbieter; spaeter ist auch Cloudflare R2 oder ein NAS-S3 moeglich.
- **Verschluesselung:** Der Backup-Satz wird bereits clientseitig mit AES-256-GCM verschluesselt (`kc_db_backup_key_v1` im Vault). Auf B2 landet nur Chiffretext. Der Schluessel liegt nie bei B2.
- **Unveraenderlich:** B2 Object Lock im Modus *Governance*, Aufbewahrung 30 Tage. Auch ein gestohlener App-Key kann Backups dann nicht loeschen.
- **Getrennte Zugaenge:** eigener App-Key nur fuer den KC-Bucket mit den Rechten `writeFiles`, `readFiles`, `listFiles`, ohne `deleteFiles`. Er wird nie mit dem PRIVATEN Bucket geteilt.

## 4. Kosten (Zero-Cost-Gate, Regel 6)
- Groesse heute: Neon-Datenbank ca. 185 MB, ein verschluesselter, komprimierter Tagessatz geschaetzt 40–150 MB.
- Aufbewahrung: **14 Tagessaetze und 6 Monatssaetze**, also im ungünstigsten Fall ca. 20 × 150 MB = **3 GB**.
- B2 ist bis **10 GB Speicher kostenlos**, der Download bis zum Dreifachen der gespeicherten Menge pro Monat.
- Restore-Test: taeglich nur Stichprobe (Manifest plus 10 Tabellen), **monatlich vollstaendig**. Das bleibt deutlich unter der kostenlosen Download-Menge.
- Waechter: Bei mehr als **8 GB** im KC-Bucket meldet KICC eine Warnung, bei 9,5 GB werden neue Monatssaetze ausgesetzt. Es entstehen keine Kosten ohne Freigabe.
- Hinweis: Der PRIVATE Bucket (3,7 GB) liegt im selben B2-Konto. Die 10 GB gelten **pro Konto**; zusammen ca. 6,7 GB. Der Waechter rechnet deshalb mit der Kontosumme.

## 5. Umsetzung in Phasen
| Phase | Inhalt | Wer | Aufwand |
|---|---|---|---|
| 0 | Entscheidung: Aufbewahrung 14/6, Object Lock 30 Tage, Region `eu-central` (Amsterdam) | Betreiber | 5 min |
| 1 | B2: Bucket `kc-core-backup` **mit Object Lock** anlegen (am einfachsten direkt beim Anlegen aktivieren), Lifecycle-Regel, App-Key nur fuer diesen Bucket ohne `deleteFiles` | Betreiber (B2-Konsole, Anleitung folgt) | 15 min |
| 2 | Key als Supabase-Edge-Secret hinterlegen (`KC_B2_*`), niemals im Repo oder Browser | Betreiber oder Claude mit Freigabe | 5 min |
| 3 | Storage-Adapter `s3-compatible` im Backup-Worker; Upload nach dem Neon-Schreiben; Manifest mit SHA-256 je Tabelle; Fehler beim B2-Upload stoppen **nicht** das Neon-Backup, werden aber als `warning` protokolliert | Claude | 1 Tag |
| 4 | Neue Funktion `kc-db-backup-b2-verify` plus Cron 00:40: Manifest lesen, Stichprobe pruefen, monatlich Vollpruefung; Ergebnis in `kc_db_mirror_runs` (`run_type = 'offsite_verify'`) | Claude | 0,5 Tag |
| 5 | Waechter: `kc_db_mirror_watchdog` meldet zusaetzlich „Offsite-Backup aelter als 26 h“ und „Offsite-Verify fehlgeschlagen“ ueber die bestehende Alarmkette | Claude | 2 h |
| 6 | KICC: `storage-b2-kc-backup` von PREPARED auf beobachtet umstellen; Karte mit Alter, Groesse, Objektzahl und letztem Verify; veraltet → gelb, fehlend → UNKNOWN (Regel 11) | Claude | 0,5 Tag |
| 7 | Abnahme: echter Restore eines B2-Satzes in einen **temporaeren Neon-Branch**, Datenvergleich, danach Branch loeschen | Claude, Betreiber gibt frei | 1 h |

## 6. Freigabeschritte (aus `KC-B2-PREPARATION.md`) und Abdeckung
| # | Schritt | Abgedeckt in |
|---|---|---|
| 1 | EU-Region | Phase 0/1 |
| 2 | eigener KC-Bucket | Phase 1 |
| 3 | Least-Privilege-Key | Phase 1 |
| 4 | erlaubte Datenklassen | nur verschluesselte KC-Datenbank-Backups |
| 5 | Aufbewahrung/Lifecycle | Phase 0/1 |
| 6 | Verschluesselung vor Upload | Phase 3 (bestehendes AES-256-GCM) |
| 7 | KICC-Telemetrie ohne Secrets | Phase 6 |
| 8 | Upload/Download/Integritaet ueberwacht | Phase 4/5 |
| 9 | bestandener Restore-Test | Phase 7 |
| 10 | ausdrueckliche Freigabe | Abschluss |

## 7. Tests und Definition of Done
- Ein taeglicher Satz liegt auf B2, das Manifest stimmt mit dem Neon-Satz ueberein.
- Loeschversuch mit dem App-Key schlaegt fehl (Object Lock und fehlende Rechte).
- B2 nicht erreichbar → Neon-Backup laeuft trotzdem, Waechter meldet Warnung.
- Falscher Schluessel → Verify meldet Fehler, nicht OK.
- Restore aus B2 in einen temporaeren Branch: 240/240 Tabellen identisch.
- KICC: frisch → gruen, aelter als 26 h → gelb „veraltet“, keine Daten → UNKNOWN.
- Kostenwaechter: Simulation 8 GB → Warnung.
- Doku und Versionen aktualisiert; Playwright 50/50 gruen.

## 8. Risiken und Ruecknahme
| Risiko | Gegenmassnahme |
|---|---|
| Upload verlaengert das Backup-Fenster und haelt Neon laenger wach | Upload erst nach Abschluss des Neon-Satzes, Satz aus dem Worker-Speicher, kein zweites Neon-Lesen |
| Kostenschwelle ueberschritten | Kontosummen-Waechter, Aussetzen der Monatssaetze ab 9,5 GB |
| Key-Verlust | Key ohne `deleteFiles`, Object Lock, Rotation dokumentiert |
| Fehler im neuen Code | B2-Pfad per Schalter `kc_db_backup_offsite_enabled` abschaltbar, ohne das Neon-Backup zu beruehren |

Ruecknahme: Schalter aus, Cron `kc-db-backup-b2-verify` deaktivieren. Bestehende B2-Saetze laufen nach Object Lock und Lifecycle von selbst aus.

## 9. Zeitplan
Nach dem Weihnachtsmarkt. Vorher keine Aenderung am produktiven Backup-Pfad. Phasen 0–2 kann der Betreiber jederzeit vorbereiten; sie aendern am laufenden Betrieb nichts.
