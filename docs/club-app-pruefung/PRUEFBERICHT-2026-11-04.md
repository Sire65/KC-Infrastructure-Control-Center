# Club-App – Gesamtprüfung vor der Auslieferung (Stand 2.847.0 RC, 04.11.2026)

Geprüft: `Sire65/KC-Clubapp` @ `6198056` (nur gelesen – diese Sitzung hat keine Schreibrechte auf das Club-App-Repo).
Grundlage: `docs/FREIGABE_3_0.md` der Club-App (Checkliste RC → FINAL), KC-Entwicklervertrag (`AGENTS.md`).
Keine Mitglieder-Inhalte gelesen (Regel 19): alle Browser-Prüfungen mit den Testdaten aus `tests/rundgang.browser.mjs`, nichts nach draußen.

## Ergebnis in einem Satz

Technisch auslieferungsreif (alle Tests grün, keine Programmfehler, Barrierefreiheit und Einheitlichkeit sehr gut) –
**blockierend ist der Freigabeprozess**: Die RC-Testwoche wurde durch neue Funktionen faktisch nie abgeschlossen,
und die Mitglieder sehen bei Updates nur „Kleine Systemanpassung“.

## 1. Vorhandene Prüfprogramme (Repo)

| Prüfung | Ergebnis |
|---|---|
| `tests/app-vertrag.test.mjs` | ✅ 514 API-Aktionen geprüft |
| alle 121 `tests/*.test.mjs` | ✅ 121/121 grün |
| `tests/rundgang.browser.mjs` (Handy 22 Seiten, einfach 5, PC 5) | ✅ ohne Fehler |
| `tests/tisch-live.browser.mjs` (Runder Tisch live) | ✅ |
| `tools/db-test` (lokale PostgreSQL) | ⏸ nicht gelaufen (kein PostgreSQL-Server im Container, nur `psql`) |

## 2. Externe Werkzeuge

| Werkzeug | Ergebnis |
|---|---|
| **ESLint 9** (recommended, app.js + alle Teile + Inline-Skript als ein Programm) | 2 doppelte Schlüssel, davon 1 echter Fehler (s. u.); sonst nur bewusste Muster (Funktions-Hüllen `nurEinmal`, Globale aus `lib/`) |
| **html-validate 9** | keine doppelten IDs, keine kaputte Struktur; 4 Symbol-Knöpfe ohne Text-Namen, 1 `<img>` ohne `src` (wird per Programm gesetzt) |
| **deno lint** (8 Edge Functions, 22 000 Zeilen) | keine Logikfehler; nur Stil (`any`, `var`) |
| **axe-core 4.10** (WCAG 2.2 AA), 22 Seiten × Handy 390 / Klein 320 / einfach 360 | 4 Regeln, zusammen 8 Stellen (s. u.) |
| **axe Farbkontrast**: 26 Designs × Tag/Nacht × 22 Seiten | 1 Stelle (in allen Designs gleich, hart codierte Farbe) |
| Überlauf/Programmfehler: Tablet 800×1280, große Schrift 390 und 320 | ✅ kein Überlauf, keine Programmfehler |
| `onclick`-Prüfung | ✅ alle 1 491 aufgerufenen Funktionen vorhanden |
| Geheimnis-Suche (eigene Muster + `geheimnis-waechter`) | ✅ keine Schlüssel |
| Supabase-Sicherheitsberater (nur Metadaten) | ✅ keine ERROR; `kc_club_*`-Funktionen prüfen Rollen selbst |
| Zero-Cost (kostenpflichtige Dienste im Code) | ✅ keine |

## 3. Funde

### Blockierend für FINAL (Prozess, Regel 9)

1. **RC-Phase nicht eingehalten.** Laut `FREIGABE_3_0.md` startete RC am 10.10. mit 2.209.0 – „nur Fehlerbehebungen, keine neuen Funktionen“.
   Seitdem kamen 638 Versionen mit vielen neuen Funktionen (Runder Tisch, Büro, Magazin, Anbieter-Neues …). Was neu ist, ist selbst nicht
   7 Tage getestet. → **Funktionsstopp festlegen**, ab dann 7 Tage nur Fehlerbehebung, dann 3.0.0.
2. **„Was ist neu“ für 3.0 schreiben.** Der Update-Hinweis lautet bei jeder Version bewusst nur „Kleine Systemanpassung“
   (Regel Hansi 14.10.2026, vom Vertragstest erzwungen – bleibt so). Für die FINAL 3.0 verlangt Checklistenpunkt 4.5 aber einmalig einen
   Mitgliedertext „Was ist neu in 3.0“ (z. B. als Pinnwand-Zettel/Ankündigung).
3. **Zu viele Einspielungen.** Am 03.11. allein 24 Versionen (2.824–2.847). Jede startet alle offenen Apps neu (~71 DB-Abfragen je Gerät)
   und lädt app.js + alle Teile neu (~5,8 MB unkomprimiert). Widerspricht KC-DB-SPARSAM (gebündelt 12/20 Uhr).
4. **Visual-TÜV auf echten Geräten** (4.2) und Endpunkt-Check „ohne Anmeldung → 401“ (4.3) sind Menschen-/Live-Prüfungen – offen.

### Fehler – ✅ behoben in Club-App 2.848.0 (Zweig `ccr-6c837ab8-uwthpa`, Test `tests/pruefung-1104.test.mjs`)

Bei der Behebung kam ein schwererer Fall dazu: Der **Mitglieder-Tipp** (`tippZeigen`) öffnete sein Fenster unter `tippBlatt` – der Kennung
des festen Einstiegs-Fensters aus `index.html`. `blattAuf` entfernt ein gleichnamiges Element, danach brach `einstiegHinweis()` ab
(„Cannot set properties of null“, im Browser auf 2.847.0 nachgestellt, auf 2.848.0 behoben). Jetzt `mtBlatt`/`mtText`. Der neue Test
verbietet allgemein `blattAuf()` mit der Kennung eines festen Fensters und doppelte Schlüssel in `FENSTER_NAMEN`.

5. **Fenster-ID doppelt: `nuBlatt`.** `teile/nutzung.js:13` („So nutzen wir die App“) und `app.js:11068` (Bühnen-Vorschlag) öffnen beide
   `blattAuf("nuBlatt", …)`. Ist eines offen, blockiert `app.js:11058` das andere; in `FENSTER_NAMEN` (`app.js:33851` und `:33879`)
   überschreibt der zweite Name den ersten → die „Wege“-Auswertung zeigt das Nutzungs-Fenster als „Vorschlag der Bühne“. Lösung: eigene ID für eines der beiden.
6. `FENSTER_NAMEN` hat `tippBlatt` doppelt (`app.js:33856` „💡 Tipp“, `:33892` „💡 Tipp des Tages“) – einen streichen.
7. **Kontrast** Archiv → Knopf `sprStart()`, Zähler `.anz`: `#f9f3eb` auf `#b36b00` = 3,79 : 1 (nötig 4,5). Hart codiert, folgt keinem Design → Designfarbe nehmen oder dunkleres Orange.

### Bedienung / Barrierefreiheit (nicht blockierend)

8. Startseite: Tippflächen unter 24 px – Versionsanzeige `#kopfVersion` (73×12), Online-Punkt `#ledOnline` (9×9), Pfeile `⌃`/`⌃⌃` (56×22).
9. Nachrichten: Beschriftungen unter den Symbolen („Kartei“, „Gruppe“, „Favoriten“) nur 10,2 px – für ältere Mitglieder zu klein (≥ 12 px).
10. Hilfe & Tipps: 13 Tippflächen unter 40 px, „💭 Feedback“ nur 20 px hoch.
11. axe: `details > summary` mit Knopf darin (Dienstpläne, „Wen anzeigen?“); `#faArtWahl` hat `role="tablist"` ohne `role="tab"` an den Knöpfen.
12. 320 px + große Schrift: Suchfeld in „Hilfe & Tipps“ wird sehr schmal („Hier …“).
13. Wortwahl: „Lädt …“ (8×, v. a. Archiv) neben „Wird geladen …“ (115×) – vereinheitlichen.

Positiv: einheitlicher Seitenkopf (`kopf2` + Zurück + Überschrift) auf allen Seiten, **keine** nativen alert/confirm/prompt
(überall `frage()`), konsequentes `esc()` bei Nutzertexten, alle Designs bis auf Fund 7 kontrastsicher.

### Geschwindigkeit

| Messung (lokal, Chromium, Testdaten) | CPU normal | CPU ×4 (Mittelklasse-Handy) | CPU ×6 (älteres Handy) |
|---|---|---|---|
| Erstes Bild | 0,1 s | 0,3 s | 0,5 s |
| Programm fertig | 0,5 s | 1,6 s | 2,4 s |
| angemeldet | 0,5 s | 1,8 s | 2,8 s |

Ziel aus der Checkliste (Median ≤ 3 s) wird erreicht. Aber: `app.js` = 3,9 MB (1,24 MB gzip; im Oktober noch ≈ 830 KB über die Leitung,
+50 %). Hebel für 3.1: weitere selten genutzte Teile auslagern (KC-CLUB-TEILE) und beim Update nur geänderte Teile neu laden.

### Sicherheit (Hinweise)

14. CSP erlaubt `'unsafe-inline' 'unsafe-eval'` (wegen `onclick`-Attributen) – XSS-Schutz hängt allein an `esc()`; langfristig Handler per `addEventListener`.
15. Server-CORS `*` – ok, weil Zugang per Token statt Cookie; enger auf die GitHub-Pages-Adresse wäre zusätzlicher Schutz.
16. Edge Functions: `npm:@supabase/supabase-js@2` nur auf Hauptversion festgelegt – für reproduzierbare Deploys genaue Version.
17. Supabase-Berater (Projekt gesamt, nicht Club-App): 7 SECURITY-DEFINER-Funktionen ohne Anmeldung aufrufbar
    (Dienstplan/Weihnachtsmarkt/Push); `kc_dp_report_error` hat keinen Token-Parameter → kann von außen beschrieben werden.
    „Leaked Password Protection“ in Supabase Auth ist aus.

## 4. Empfohlene Reihenfolge

1. ✅ Funde 5–7 behoben (2.848.0) – zum nächsten Termin (12/20 Uhr, Ruhe-Prüfung) einspielen. Fund 2 (Text „Was ist neu in 3.0“) vor FINAL schreiben.
2. **Funktionsstopp** ausrufen, RC-Woche neu starten; nur noch Fehlerbehebung, gebündelt 12/20 Uhr.
3. Visual-TÜV auf echten Geräten (Liste in `FREIGABE_3_0.md` 4.2), 401-Check, `tools/db-test` auf lokaler PostgreSQL.
4. Nach 7 ruhigen Tagen: 3.0.0 FINAL, Tag `v3.0.0`, Ankündigung.
5. Funde 8–17 in die Liste für 3.1.

## 5. Nachtrag 04.11.2026 – Stand nach Club-App 2.852.0

- **Fehler 5–7 und der Absturz beim Mitglieder-Tipp:** behoben in 2.848.0 (live 05:28 UTC).
- **Bedienung, Funde 8–13:** erledigt in 2.852.0 (live 11:12 UTC, eingespielt auf main als 2.852.0, weil 2.849.0–2.851.0 von anderen Sitzungen vergeben waren).
  - Nachrichten-Leiste: Wörter 12 px und nie gekürzt; auf schmalen Handys eine zweite, gemittelte Reihe.
  - Hilfe & Tipps: „💭 Feedback“ größer antippbar; Suchen-Knopf unter 400 px nur 🔍.
  - Fotos/Videos-Umschalter mit `aria-pressed`, Kamera-Auslöser benannt.
  - Einheitlich „Wird geladen …“.
  - Runder Tisch: Doppeltippen auf „Nächstes“ schickt nichts doppelt; der wackelige Tisch-Live-Test ist behoben.
- **Fund 8 (Startseite):** Nachmessung ergab bereits ≥ 24 px Trefffläche (unsichtbar vergrößert seit 2.481.0). Mein erster Befund war ein Messfehler.
- **Kontrast:** 0 Funde in allen Designs, bei Tag und Nacht.
- **Bewusst nicht geändert:** das Schloss 🔓 in den Klapp-Zeilen und die LED-Punkte im Verbindungsknopf (Kern-Bausteine, Umbau riskanter als der Nutzen).
- **KC-TESTS-OHNE-ECHTSERVER:** Lokale Prüfläufe lösten 6 abgelehnte Anmeldeversuche am echten Server aus. Rundgang und Tisch-Live sperren die echten Server-Adressen jetzt zusätzlich per `--host-resolver-rules`. Hansis Regel und der Wächter-Test `tests/browser-abgeschirmt.test.mjs` stehen in der Club-App.
- **Weiter offen für 3.0:** Funktionsstopp mit Testwoche, Durchsicht auf echten Geräten, 401-Check, `tools/db-test`, Text „Was ist neu in 3.0“.
  Hinweis: Am 04.11. haben drei Sitzungen gleichzeitig eingespielt (2.849.0–2.856.0) – ein weiteres Argument für den Funktionsstopp.
- **Für 3.1:** Größe von app.js, Teile nur bei Änderung neu laden, CSP ohne `unsafe-inline`, `kc_dp_report_error` ohne Token, Schutz gegen geleakte Passwörter in Supabase.

## 6. Merker: Passwort-Schutz (Entscheidung Hansi 04.11.2026: „Behalte im Merker. Irgendwann stellen wir vielleicht um“)

- **Schutz gegen geleakte Passwörter (HaveIBeenPwned) wird nicht eingeschaltet.** Supabase bietet ihn nur ab dem Pro-Tarif an, er ist also kostenpflichtig und verstößt gegen Regel 6 (Zero-Cost).
- **Betroffen sind nur Konten mit Passwort** (KC Verwaltung: operator/manager/admin, ggf. Dienstplan/Manager). Club-App-Mitglieder melden sich per persönlichem Link an.
- **Kostenlose Möglichkeiten für später**, in Supabase → Authentication → E-Mail-Anmeldung:
  1. Mindestlänge für Passwörter, z. B. 12 Zeichen.
  2. Vorgeschriebene Zeichen: Ziffern, Groß- und Kleinbuchstaben, Sonderzeichen.
  3. Bei Passwort-Änderung das aktuelle Passwort verlangen.
  4. Zwei-Faktor-Anmeldung (MFA) für Admin-Konten.
- **Vor dem Umstellen:** Strengere Regeln gelten sofort auch für bestehende Konten. Wer ein schwächeres Passwort hat, bekommt beim nächsten Anmelden den Fehler „WeakPasswordError“ und muss das Passwort ändern. Darum erst ankündigen, dann umstellen – nur mit Freigabe Hansi.
