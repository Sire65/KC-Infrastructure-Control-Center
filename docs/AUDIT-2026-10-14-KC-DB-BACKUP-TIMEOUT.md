# Audit 2026-10-14: KC-Datenbank-Backup unvollstaendig (Statement-Timeout)

## Befund
- Seit 2026-10-11 wurden die taeglichen Backup-Saetze (`kc_db_backup_daily()` → `kc-db-backup-worker` → Neon `kc_backup_sets`) nicht mehr vollstaendig. Letzter vollstaendiger Satz vor der Korrektur: 2026-10-12 00:12 UTC.
- Betroffene Tabellen: `kc_club_protokoll`, `kc_communication_requests`, zeitweise `kc_communication_delivery_events` (je ca. 1–2,8 MB, wachsend).
- Ursache: Der Worker liest Snapshots ueber PostgREST (`rpc/kc_db_mirror_snapshot`). Dort galt das 8-s-Limit der Rolle `authenticator`, weil `service_role` kein eigenes Limit hatte. Bei 11 parallelen Worker-Anfragen ueberschritten die groessten Tabellen das Limit (`57014 canceling statement due to statement timeout`). Einzeln dauert der Snapshot nur 0,1–0,4 s.
- Fehlende Tabellen → Satz bleibt `running`/`error` (korrektes Verhalten des Workers).

## Ausfuehrung (vom Betreiber freigegeben)
- Recovery-Punkt: Konfigurationsaenderung, Ruecknahme jederzeit mit `alter role service_role reset statement_timeout; notify pgrst, 'reload config';`
- `alter role service_role set statement_timeout = '60s'; notify pgrst, 'reload config';`
- Auswirkung: nur serverseitige Aufrufe mit Service-Key; `anon` (3 s) und `authenticated` (8 s) unveraendert.
- Audit-Eintrag in `kc_db_mirror_audit` (`service_role_statement_timeout`).

## Verifikation
- Nachgeholter Lauf ueber `kc_neon_low_compute_backup_cycle()`: Satz `b2e4bccd-b693-40eb-a054-b5f6829d5b17`, 253/253 Tabellen, Status `ok`, abgeschlossen 2026-10-14 05:19:39 UTC.
- Restore-Read-Test: 253 geprueft, 0 Fehler.
- Alle 11 Worker-Anfragen HTTP 200, keine Statement-Timeouts in den Postgres-Logs.

## Offen
- ~~Der Restore-Test (`kc-db-backup-verify-v2`, Cron 00:15) meldet „passed“ auch fuer unvollstaendige Saetze.~~ Behoben mit KICC-F-100 (`docs/KICC-F-100-BACKUP-RESTORE-COMPLETENESS.md`).
- Optional: Worker-Anfragen zeitversetzt statt parallel dispatchen.
- PC Backup Vault: letztes Backup 2026-09-18, nur manuelle Laeufe; Warnung FS-003 (`Permission denied` auf `.pc-backup-vault\.preflight-*.tmp`) am PC pruefen.

## Gesamtpruefung 2026-10-14 (nach der Korrektur)
- **Spiegel Supabase → Neon London:** 1002 Snapshot-Laeufe in 24 h, 253/253 Tabellen, 0 Abweichungen (Quelle = Ziel). Watchdog, Abdeckung und Quellpruefung ok.
- **Auto-Aufnahme neuer Tabellen** (`kc_internal.kc_db_mirror_abdeckung_check`, alle 30 min): aktiv. Zuletzt automatisch aufgenommen: `kc_club_express`, `kc_club_express_antwort` (13.10. 20:02), `kc_club_geplant` (13.10. 19:32). Tabellen mit auffaelligen Spalten werden angehalten; derzeit wartet keine auf Freigabe.
- **Sicherung London → Frankfurt** (`kc-club-fra-sicherung`, Neon-Dateispeicher `dry-waterfall-32306741`, Bucket `kc-archiv`, aws-eu-central-1): taeglich vollstaendig seit 12.10.; 14.10.: 283/283 public-Tabellen, 328 Teile zurueckgelesen und geprueft, 329 Objekte (inkl. Manifest), 0 leer. Neue Tabellen sind automatisch enthalten. Aufbewahrung 14 Tage.
- **Sicherheitsbefund Frankfurt (nicht geaendert):** Die Dateien sind nur gzip-komprimiert, **nicht verschluesselt**, und enthalten alle Spalten aller public-Tabellen, auch als `secret` eingestufte Tabellen und Spalten, die der Neon-Spiegel schwaerzt (`kc_db_mirror_redaction`). Der Bucket ist privat. Verstoss gegen Regel 15 und die Privacy-Regeln des Spiegels → Korrektur mit eigener Feature-ID nach Freigabe.
- `grenze` (5 GiB) erscheint nur in den Metriken und wird nicht durchgesetzt.

## Korrektur Frankfurt-Sicherung (Server 2.369.0, KC-CLUB-FRA-VERSCHLUESSELT)
Quelle: `Sire65/KC-Clubapp`, Edge Function `kc-club` (Deploy per Workflow „Server hochladen“ bei Push auf `main`). Patch: `docs/patches/kc-clubapp-fra-verschluesselt.patch`.
- Datenbank-Teile (`datenbank/…/*.json.gz.enc`) und Archiv-Kopien (`archiv/…/*.enc`) mit AES-256-GCM, Format KCE1. Schluessel `kc_db_backup_key_v1` (gleiche Ableitung wie Neon-Backup), Notfall-Kopie im Cloudflare-Tresor/GitHub-Secret `KC_BACKUP_KEY` vorhanden. Ohne Schluessel kein Upload.
- `secret`-Tabellen ausgeschlossen, Spalten aus `kc_db_mirror_redaction` wie im Spiegel geschwaerzt; Personendaten bleiben verschluesselt enthalten (Komplett-Sicherung).
- Klartext-Altbestand: Datenbank-Dateien werden nach dem ersten fehlerfreien verschluesselten Lauf geloescht; Archiv-Kopien werden in den Nachtlaeufen verschluesselt ersetzt. `dokumente/` (oeffentliche PDFs) unveraendert.
- Notfall-Werkzeug `tools/notfall/fra-entschluesseln.mjs`.
- Tests: `app-vertrag.test.mjs` (353 Aktionen + neue Vertragspruefungen), `fra-verschluesselung.test.mjs` (6 Faelle), `notfall-tresor.test.mjs` gruen; `deno check`: keine neuen Typfehler gegenueber v486 (14 vorbestehende).
- Recovery-Punkt: laufende Version 486 = `main` 368d10d; Ruecknahme per Revert-Commit.
- Ausrollen nicht zwischen 01:00 und 04:00 UTC (Nachtlauf der Sicherung).
- Versionsnummer 2.367.0 war inzwischen parallel vergeben (2.367.0/2.368.0 Club-App) → Server **2.369.0**.
- Freigabe des Betreibers 14.10.2026; direkter Push auf `main` von der Rechtepruefung blockiert → PR [Sire65/KC-Clubapp#20](https://github.com/Sire65/KC-Clubapp/pull/20), Tests gruen, 06:25 UTC zusammengefuehrt (`d42e96e`), Deploy ueber Workflow „Server hochladen“ (Lauf 470) erfolgreich, `kc-club` Deployment-Version 488 (06:25:50 UTC). Erster verschluesselter Nachtlauf: 15.10. 01:30 UTC (Archiv-Kopie ab 00:00 UTC).

## Nachtrag 2026-10-15: erneut unvollstaendig → automatisches Nachholen (KICC-F-101)
- Satz `b2721e06…` (00:12 UTC): 231/256. Ein Worker-Aufruf (Paket 9, `kc_manager_*` u. a.) endete mit HTTP 503 `BOOT_ERROR` (Funktion startete nicht, 11 gleichzeitige Kaltstarts). Es gab keinen erneuten Versuch.
- Satz `03f574e8…` (02:20 UTC, zusaetzlicher Lauf ueber die API, parallel zur Frankfurt-Sicherung): 254/256. `kc_club_protokoll` und `kc_communication_requests` liefen in das PostgREST-Limit von 58 s (Snapshots brauchten unter Last bis zu 44 s).
- Ursache an der Quelle: Ein Paket, das fehlschlaegt, wurde nie erneut versucht. Der Satz blieb dauerhaft `running`.
- Korrektur: `public.kc_db_backup_nachholen()` (`database/sql/kc-db-backup-nachholen.sql`), Cron `kc-neon-backup-nachholen` alle 10 min von 00 bis 07 UTC. Fehlende Tabellen laufender Saetze (letzte 20 h) gehen in Paketen zu je 5 Tabellen an denselben Satz (max. 15 Tabellen je Lauf, max. 8 Versuche, danach Audit `backup_nachholen_aufgegeben`, critical). Der Worker ist idempotent und schliesst den Satz selbst ab, danach folgt der Restore-Test.
- Verifikation: Satz `03f574e8…` → 256/256, Status `ok`, Restore-Test 256 geprueft, 0 Fehler (04:40 UTC). Satz `b2721e06…` wird durch den Cron vervollstaendigt.
- Ruecknahme: `select cron.unschedule('kc-neon-backup-nachholen'); drop function public.kc_db_backup_nachholen();`
- Restore-Test-Cron `kc-neon-backup-verify` (Job 51) laeuft jetzt um 06:30 statt 00:15 UTC (Freigabe Betreiber 15.10.2026). Um 00:15 war ein Satz, der noch nachgeholt wurde, als Fehler gemeldet worden (Fehlalarm im System-Check). Der Worker startet den Restore-Test selbst, sobald ein Satz vollstaendig ist. Ruecknahme: `select cron.alter_job(51, schedule := '15 0 * * *');`
- Zusatzlauf 02:20 UTC: direkter SQL-Aufruf `select public.kc_db_backup_daily() as retry` als `postgres` ueber den Verwaltungszugang (kein Cron, keine REST-Anfrage), zeitgleich mit einer Security-Advisor-Abfrage. Vermutlich ein externer KI-Schutzcheck. Empfehlung: Dieser Check soll nur lesen.

## Gesamtpruefung 2026-10-15 abends
- Neon-Backup (Job 45) von 00:12 auf 00:40 UTC verschoben (Abstand zur Spiegelung 00:10 und zu Frankfurt 01:00; Freigabe Betreiber). Ruecknahme: `select cron.alter_job(45, schedule := '12 0 * * *');`
- `kc_club_video_bewertung`: `backup_enabled=true`, aber `mirror_enabled=false`, daher nicht im Neon-Backup (nur Frankfurt). Die Korrektur wurde beim Ausfuehren abgebrochen und ist offen.
- Neon KC Core Mirror: 322 MB von 1 GiB Branch-Limit, Archiv ohne Aufbewahrung. Entwurf KICC-F-103 `database/sql/neon-kc-backup-retention.sql`, auf dem Test-Branch `br-plain-unit-za0gpaid` geprueft: Plan 46 loeschen / 27 behalten, Schutz-Trigger blockiert direktes DELETE, DELETE neuer Saetze und TRUNCATE.
- Variante B 7/4/3 (Freigabe Betreiber 15.10.2026) auf dem Haupt-Branch eingespielt, Regel **inaktiv** (`aktiv=false`). Probelauf: 56 Saetze (ca. 99 MB) betroffen, 17 bleiben. Direktes DELETE weiterhin gesperrt (geprueft). Test-Branch entfernt. Scharfschalten erst nach ausdruecklicher Freigabe der Liste.
- 15.10.2026 ca. 17:35 UTC nach Freigabe („Ja löschen“): Regel aktiv, einmal ausgefuehrt: 56 Saetze / 3660 Snapshots entfernt, 17 Saetze behalten (31.08., 20.09., 30.09., 04.10., 09.10.–15.10.), neuester ok-Satz `03f574e8…` erhalten, keine verwaisten Pruefungen. VACUUM ausgefuehrt; Dateigroesse bleibt 322 MB, ca. 100 MB sind fuer neue Saetze wiederverwendbar. Noch kein automatischer Nachtlauf der Regel.
- `kc_club_video_bewertung`: Aenderung auch nach Freigabe dreimal von der Sitzung abgebrochen, weiter offen.
