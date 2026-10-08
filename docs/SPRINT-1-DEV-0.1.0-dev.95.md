# KICC 0.1.0-dev.95 – Haertung gegen Fremdzugriff

Feature-ID: **KICC-F-095**

## Anlass
Sicherheitspruefung vom 2026-10-08 (Code, Supabase, Neon, GitHub). Vor dem Weihnachtsmarkt werden nur risikoarme Massnahmen umgesetzt; jede Aenderung ist rueckwaertskompatibel und einzeln getestet. Produktive KC-Datenwege sind nicht betroffen (Regel 12).

## Aenderungen
1. **Local Agent 0.4.1** (`agent/kc_local_agent.py`)
   - Statt `Access-Control-Allow-Origin: *` nur noch freigegebene Origins (Standard: `https://sire65.github.io`, lokaler Testserver), erweiterbar ueber `KICC_AGENT_ALLOWED_ORIGINS`.
   - Host-Pruefung gegen DNS-Rebinding (`127.0.0.1`/`localhost`/`[::1]` am Agent-Port).
   - Fremde Origins erhalten `403` fuer GET, POST und Preflight; Speedtest/Bufferbloat sind von fremden Seiten nicht mehr ausloesbar.
   - `Access-Control-Allow-Private-Network: true` fuer KICC (Chrome Local-Network-Access).
   - Aufrufe ohne Origin (Autostart-Healthcheck, curl) bleiben moeglich.
2. **XSS-Haertung**: Ferndaten werden vor `innerHTML` maskiert in `app.js`, `sync/mirror-monitor.js`, `products/kc-program-registry.js`, `storage/storage-monitor.js`, `security/security-agent-monitor.js`, `programs/remote-heartbeat-bridge-ui.js`.
3. **Content-Security-Policy** (Meta-Tag in `index.html`): Skripte nur von eigener Herkunft und dem gepinnten eCharts 5.6.0; kein Inline-JS, kein `eval`, keine Plugins/Frames, `base-uri`/`form-action` auf `self`. `connect-src` erlaubt weiterhin HTTPS und den Local Agent, damit dynamische Deployment-/Telemetrie-Adressen funktionieren.
4. **Subresource Integrity** fuer eCharts (`sha384-pPi0zx…Rss`, gegen jsDelivr und unpkg verifiziert). Faellt eCharts aus, laeuft KICC ohne Diagramme weiter.
5. **Echtes Abmelden**: „Abmelden“ beendet beide Supabase-Sitzungen serverseitig (`/auth/v1/logout?scope=local`) und loescht gespeicherte Auto-Login-Tokens. Der Auto-Login-Schalter bleibt erhalten.
6. **Kein globaler Token-Leser**: `KICC_AUTO_LOGIN` bietet `loadRefreshToken`/`saveRefreshToken` nicht mehr global an (nur Modul-Import).
7. **Recovery-Link**: Das Passwort-Recovery-Token wird sofort aus Adresszeile und Browserverlauf entfernt.
8. **Test-Robustheit**: `tests/e2e/kicc-50.spec.js` wartet auf geladene Module statt auf feste Zeit (vorher zufaellige Fehlschlaege bei kaltem Cache, u. a. Test 48). Weiterhin genau 50 Tests.

## Tests
- `tests/final-regression.js`: `CSP_PRESENT_NO_INLINE_SCRIPT`, `EXTERNAL_SCRIPTS_HAVE_SRI`, `NO_GLOBAL_REFRESH_TOKEN_READER`.
- Browserlauf ueber alle 15 Register: 0 CSP-Verstoesse, eCharts mit SRI geladen, XSS-Versuch (`<img onerror>`) wird als Text angezeigt und nicht ausgefuehrt, Final-Regression 23/23, Runtime-Smoke 55/55.
- Logout-Test mit simuliertem Supabase: beide Logout-Aufrufe mit Bearer, Token geloescht, Status `AUTH_REQUIRED`.
- Local Agent: 9 Faelle (KICC, Preflight, fremde Seite GET/POST/Preflight, DNS-Rebinding, ohne Origin, localhost, Testserver) – alle wie erwartet.
- ESLint ohne Befund; Playwright 50/50 dreimal hintereinander.

## Definition of Done
- [x] Keine bestehende Funktion entfernt; Verhalten nur bei Abmelden bewusst verschaerft.
- [x] Rueckwaertskompatibel: alter Agent funktioniert mit neuem KICC, neuer Agent mit altem KICC.
- [x] Tests ergaenzt und gruen; Version erhoeht; Doku aktualisiert.

## Inbetriebnahme Local Agent
Die neue `agent/kc_local_agent.py` auf den Leitstand-PC kopieren und den Agenten neu starten (Windows-Abmeldung/Anmeldung oder Aufgabe „KC Local Agent“ neu starten). Bis dahin laeuft der alte Agent unveraendert weiter.

## Bekannt, bewusst nicht geaendert
- `app.js` `renderFailover`: Element `approvalCount` fehlt im HTML, die Funktion bricht ab (bestand schon vor dev.94). Eine Korrektur wuerde zusaetzliche Bereiche rendern und koennte die Live-Topologie ueberschreiben; daher erst nach dem Weihnachtsmarkt.
- Inaktivitaets-Abmeldung und Zwei-Faktor-Anmeldung: fuer einen dauerhaft laufenden Leitstand vor dem Weihnachtsmarkt zu riskant; separat planen.
- Zugriffs-Waechter fuer unbekannte Logins: naechster Schritt (Punkt 4 der Sicherheitspruefung).
