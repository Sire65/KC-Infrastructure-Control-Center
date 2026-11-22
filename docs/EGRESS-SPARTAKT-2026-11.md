# Egress-Spartakt November 2026

## Anlass

Supabase-Organisation (Free-Tarif, zwei Projekte) am 17.11.2026: Egress 4,00 von 5 GB im Zeitraum 26.10.–26.11.2026,
Schonfrist abgelaufen. Bei ca. 160–180 MB/Tag waere das Kontingent um den 22./23.11. aufgebraucht; danach beantworten
die Projekte keine Anfragen mehr (Club-App, Communicator, Push, Termine).

Aufschluesselung 17.11. (Dashboard): PostgREST 109 MB (69 %), Storage 39 MB (25 %), Functions 9 MB (6 %), Realtime 1 MB.
PostgREST-Verkehr laeuft ueberwiegend ueber die Edge Function `kc-club` (Club-App); die Neon-Spiegelung ist ein kleinerer Anteil.

## Massnahme (Freigabe Admin 17.11.2026)

| Cron-Job | vorher | bis 26.11.2026 |
|---|---|---|
| `kc-neon-low-compute-cycle` | `10 4,13,22 * * *` | `10 4 * * *` |
| `kc-db-mirror-welle` | `11-40 4,13,22 * * *` | `11-40 4 * * *` |

- Frische-Fenster des Mirror-Watchdogs passt sich automatisch an (`kc_db_mirror_frischefenster()` = 24:30 h), keine Fehlalarme.
- Recovery/Rueckstellung automatisch: Einmal-Job `kc-spiegel-spartakt-ende` (26.11. 03:00 UTC) setzt beide Takte zurueck,
  schreibt einen Audit-Eintrag und entfernt sich selbst.
- Audit: `kc_db_mirror_audit`, action `mirror_spartakt_egress`.

## Weitere Massnahmen (Freigabe Admin 17./18.11.2026)

| Massnahme | vorher | nachher | Rueckweg |
|---|---|---|---|
| Cron `kc-club-notpaket-15min` (Notfall-Paket) | `9,24,39,54 * * * *` | `9 * * * *` | Takt zuruecksetzen (Audit `notpaket_spartakt_egress`) |
| Cron `kc-live-operations-watch-minute` (Betriebs-Waechter) | `2-59/5 * * * *` | `2-59/15 * * * *` | Takt zuruecksetzen (Audit `betriebswaechter_spartakt_egress`) |
| Club-App 2.977.0: Anlagen nach Pfad im Service Worker merken, Chat-Uebersicht gemeinsam abrufen | – | Zweig `egress-sparen-2977`, Einspielen 18.11. 19:45 | App 2.976.0 |

Messgrundlage ohne Protokoll-Abfragen: `kc_club_protokoll` aktion `egress_messung` (Club-Server, bis 21.11.), `pg_stat_statements`.
Korrektur 18.11.: Die 133 Speicher-Downloads am 17.11. kamen von vielen Geraeten, nicht von einem einzelnen PC.

## Kontrollpunkt 22.11.2026

Dashboard: Egress 4,639/5 GB (93 %), seit 17.11. ca. 128 MB/Tag (vorher ca. 160) – reicht ohne weitere Massnahmen nur bis ca. 25.11.
Protokollerfassung 3,0/1 GB und Protokollabfrage 115/100 GB (laut Dashboard derzeit nicht berechnet).

Massnahmen (Freigabe Admin 22.11.), automatische Rueckstellung 26.11. 03:05 UTC (`kc-hintergrund-spartakt-ende`, Audit `hintergrund_spartakt_egress`):

| Cron | vorher | bis 26.11. |
|---|---|---|
| kc-club-geplant-minute | `* * * * *` | `*/2 * * * *` |
| kc-club-wartung-15min | `4,19,34,49 * * * *` | `4,34 * * * *` |
| kc-termine-wartung-10min | `1,11,21,31,41,51 * * * *` | `1,31 * * * *` |
| kc-traffic-guard-15m | `3,18,33,48 * * * *` | `3,33 * * * *` |
| kc-system-check-auto-15m | `*/15 * * * *` | `*/30 * * * *` |
| kc-dp-nightly-push-v01936 | `*/5 * * * *` | `*/10 * * * *` |
| kc-dp-wish-phase-v01952 | `1-59/5 * * * *` | `1-59/10 * * * *` |
| kc-wm-push-5min | `3-59/5 * * * *` | `3-59/10 * * * *` |

Update-Stopp Club-App (KC-EGRESS-STOPP, AGENTS.md der Club-App): ab 23.11. nur Fehlerbeseitigung, bis Hansi die Uebersicht freigibt.

## Offen

- Eigentliche Ursache in der Club-App (`kc-club`, Repo KC-Clubapp): Abfragen je Aufruf bzw. Aufrufe je Geraet senken.
- Keine Supabase-Protokolle fuer Lagebilder durchsuchen (zaehlt als „Logs Query“, KC-SPARSAM-PROTOKOLLE der Club-App);
  eigene Tabellen nutzen.
