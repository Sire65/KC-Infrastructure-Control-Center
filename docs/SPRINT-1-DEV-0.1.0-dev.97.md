# KICC 0.1.0-dev.97 – Neon seltener wecken, Agent-Update, Supabase-Haertung

Feature-ID: **KICC-F-098** · 2026-10-08

## KICC
- `programs/failover-gateway-runtime.js`: Der Failover-Gateway wird nur abgefragt, solange das KICC-Fenster sichtbar ist. Jede Gateway-Abfrage oeffnet derzeit eine Neon-Verbindung (siehe `docs/GATEWAY-NEON-SLEEP.md`); ein vergessener KICC-Tab im Hintergrund weckt Neon damit nicht mehr alle 30 s. Beim Sichtbarwerden wird sofort gemessen; im Hintergrund veraltet die Messung regulaer zu UNKNOWN (Regel 11).

## Local Agent
- Neu: `agent/UPDATE_KC_LOCAL_AGENT.cmd` – Aktualisierung per Doppelklick. Laedt `kc_local_agent.py` von `main`, prueft Syntax und Schutzmerkmal (`ALLOWED_ORIGINS`), sichert die alte Datei als `kc_local_agent.backup.py`, startet den Agenten neu und oeffnet den Healthcheck. Bei Fehlern bleibt der bisherige Agent unveraendert.

## Supabase KC Core (direkt ausgefuehrt)
| Aenderung | Grund | Ruecknahme |
|---|---|---|
| Bucket `kc-communication-test` auf privat gestellt (Dateien unveraendert) | oeffentlich, seit 22.08.2026 kein Zugriff | `update storage.buckets set public=true where id='kc-communication-test';` |
| `submit_wm_vote(...)` fuer `anon`/`authenticated` gesperrt | erlaubte das Ueberschreiben fremder Stimmen allein ueber den Namen; nicht mehr genutzt (Nachfolger mit Token: `kc_wm_umfrage_absenden`); 12 Stimmen unveraendert | `grant execute on function public.submit_wm_vote(text,smallint,smallint,text,text,uuid) to anon, authenticated;` |

Geprueft und bewusst unveraendert:
- Die uebrigen 8 per `anon` aufrufbaren SECURITY-DEFINER-Funktionen sind durch Geheimnis, persoenliches Link-Token oder Geraete-Hash geschuetzt, oder es handelt sich um Fehlermelder/Trigger-Funktionen.
- `kc_club_norm`: Die Warnung zum `search_path` ist ohne praktisches Risiko (nur eingebaute Textfunktionen). Eine Korrektur wuerde die Club-Suche verlangsamen; daher erst nach dem Weihnachtsmarkt.

## Tests
- ESLint ohne Befund, Playwright 50/50.
- Nach den Supabase-Aenderungen geprueft: Bucket privat, `submit_wm_vote` nur noch fuer `service_role`, Stimmenanzahl unveraendert (12).
