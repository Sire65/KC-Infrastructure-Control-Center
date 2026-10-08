# KICC Zugriffs-Waechter

Feature-ID: **KICC-F-096** · aktiv seit 2026-10-08 · Quelle: `database/sql/kicc-access-watch.sql`

## Zweck
Meldet unbekannte Zugriffe auf KC Core (Supabase `ptblnpiroqftcvlsrhac`) per Push und E-Mail an die aktiven KC-System-Check-Operatoren.

## Was gemeldet wird
| Ereignis | Bedingung | Prioritaet |
|---|---|---|
| Neues Geraet | Anmeldung mit einem fuer dieses Konto unbekannten Geraet/Browser | critical |
| Neues Konto | In `auth.users` wurde ein Konto angelegt | critical |
| Login-Haeufung | mehr als 15 neue Sitzungen in einer Stunde (max. 1 Meldung je 6 h) | high |

Browser-Updates loesen keinen Alarm aus: Der Geraete-Schluessel ist der User-Agent ohne Versionsnummern.

## Funktionsweise
- pg_cron-Job `kicc-access-watch-minute` ruft jede Minute `kc_internal.kc_access_watch()` auf.
- Der Waechter **liest nur** `auth.sessions` und `auth.users`. Es gibt keinen Trigger im Login-Pfad; ein Fehler im Waechter kann keine Anmeldung blockieren.
- Meldungen laufen ueber den bestehenden Communicator-Scheduler (`kc_communication_scheduled_jobs`, Modus `both`). Empfaenger werden aus `kc_system_check_operators` + `kc_core_user_links` ermittelt, nicht hart codiert.
- Daten liegen im Schema `kc_internal` (nicht per API erreichbar, RLS aktiv, keine Rechte fuer `anon`/`authenticated`, nicht nach Neon gespiegelt).
- Fehler setzen `kc_access_watch_state.last_error` und erzeugen ein Ereignis `watch_error`; der naechste Lauf versucht es erneut.

## Grenzen
- Eine Sitzung, die innerhalb von weniger als einer Minute wieder beendet wird, kann unbemerkt bleiben.
- Fehlgeschlagene Anmeldeversuche sind im Free-Plan nicht in der Datenbank verfuegbar und werden nicht ausgewertet.
- Ereignisse werden nicht automatisch geloescht (geringes Volumen).

## Tests (2026-10-08)
- Erstlauf: 2 bekannte Geraete uebernommen; Aktivierungsnachricht per Push und E-Mail zugestellt (HTTP 200).
- Normaler Lauf: `status ok`, keine Fehlalarme.
- Simulation in zurueckgerollter Transaktion: fremdes Geraet → 1 Alarm; bekanntes Handy mit neuer Chrome-Version → kein Alarm. Danach keine Testdaten mehr vorhanden.

## Bedienung
- Abschalten ohne Loeschen: `update kc_internal.kc_access_watch_state set enabled=false where id='primary';`
- Letzte Ereignisse: `select * from kc_internal.kc_access_events order by happened_at desc limit 20;`
- Neues Geraet nach Alarm ist automatisch bekannt; ein zweiter Login vom selben Geraet meldet nicht erneut.

## Definition of Done
- [x] Kein Eingriff in den Login-Pfad, keine Kosten, bestehende Kerne genutzt (Regel 3, 6).
- [x] Zustellung end-to-end nachgewiesen.
- [x] Erkennung und Fehlalarm-Freiheit getestet.
- [x] SQL und Doku im Repository.
