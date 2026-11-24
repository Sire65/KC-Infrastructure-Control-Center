# Konzept: Mein Stundenkonto (Club-App + DP2)

Feature-ID: **KICC-F-113** (Club-App: `KC-CLUB-STUNDENKONTO`, DP2: `DP2-F-KONTO-01`)
Stand: 24.11.2026 · Status: **KONZEPT** (noch nichts gebaut) · Baut auf KICC-F-100 (Sonderstunden) und KICC-F-112 (Zeit aus der Erstattung) auf.

## 1. Ziel

Jedes Mitglied sieht unter **Meins → ⏱️ Mein Stundenkonto** alle eigenen Stunden und Kilometer an einer Stelle:

- filterbar nach **Tag, Monat, Jahr** und **Anlass** (z. B. Weihnachtsmarkt 2026, Grünkohl kochen, Besorgungen & Fahrten),
- als **Liste** mit ID, Datum, Zeit, Stunden, Anlass/Tätigkeit und km,
- unten mit **Summe der Stunden und der km**,
- mit **Diagrammen** (Säulen, Balken, Linie, Kreis),
- und als **PDF** auf dem Club-Kopfbogen (Logo, CD-Farben).

## 2. Woher kommen die Stunden?

Heute gibt es vier Quellen. Sie liegen an verschiedenen Stellen und werden unterschiedlich geprüft:

| Nr. | Quelle | Wie entsteht sie? | Wo liegt sie? | Wann zählt sie? |
|---|---|---|---|---|
| 1 | **Dienst am Stand (Ist)** | Kasse-Stechuhr, Stempel in der App, Ist-Rückmeldung „passt/geändert“ | Rohdaten: `kc_dp_timeclock_actuals`, `kc_dp_stempel`, `kc_dp_dienst_rueckmeldung`. **Geprüftes Ist nur in DP2** (Planer korrigiert, Kasse hat Vorrang, Abschluss je Tag) | wenn DP2 es als Ist führt |
| 2 | **Sonderstunden** (Twinkey „Sonderstunden melden“) | Mitglied meldet, Planer bestätigt | `kc_dp_hour_reports` (Quelle `club_app`) | nach Bestätigung |
| 3 | **Zeit aus der Erstattung** (KICC-F-112) | Mitglied reicht mit Fahrt/Einkauf ein | `kc_dp_hour_reports` (Quelle `erstattung`) | sofort; Rücknahme bei Ablehnung |
| 4 | **Kilometer** | Erstattungsantrag „Fahrtkosten“ | `kc_club_erstattung.positionen` (`km`) | eingereicht/erstattet (nicht abgelehnt) |

Nur zur Info, ohne Gutschrift:
- **Soll** (geplante Dienste aus `kc_dp_plan_published`) erscheint nur als Vergleichslinie und nie in der Summe.

**Das Problem:** Die Endzahl, mit der der Planer rechnet, also das geprüfte Ist im DP2-Kontoauszug (`personAccountPrint`), steht heute nur in DP2. Würde die Club-App selbst aus den Rohdaten rechnen, kämen andere Zahlen heraus als in DP2. Beispiele: zwei Quellen für denselben Dienst, Korrekturen des Planers, Kasse mit Vorrang.

**Lösung: eine Wahrheit.** DP2 veröffentlicht je Person die Zeilen seines Kontoauszugs. Es nutzt dabei denselben Kern, der heute den Kontoauszug druckt. Die Club-App rechnet nichts selbst, sie zeigt diese Zeilen nur an.

```
Kasse/Stempel/Rückmeldung ─┐
Sonderstunden (Twinkey) ───┼─► DP2 prüft & bucht Ist ─► veröffentlicht Kontozeilen ─► Club-App „Mein Stundenkonto“
Zeit aus Erstattung ───────┘         (Kontoauszug)        (kc_dp_konto_published)          + km aus Erstattung
```

**Solange DP2 einen Tag noch nicht veröffentlicht hat**, zeigt die Club-App die Rohdaten als **„vorläufig“**: grau, mit dem Zeichen ⏳, in einer eigenen Summe. Das folgt der Regel aus dem Entwicklervertrag: Unbekanntes wird nie als „OK“ gezeigt, veraltete Daten werden markiert. Oben steht immer „📅 Stand DP2: 24.11.2026, 18:40“.

## 3. So sieht es aus

### Kachel (Meins)
„⏱️ Mein Stundenkonto“, auf der Kachel klein: **„Weihnachtsmarkt 2026: 42,5 Std. · 186 km“**.

### Seite
1. **Filter** (nur Auswahl, kein Freitext):
   - Zeitraum: `Tag` · `Monat` · `Jahr` · `Alles` (mit Datum- bzw. Monats-/Jahreswahl)
   - Anlass: `Alle` · Weihnachtsmarkt 2026 · Grünkohl kochen · Besorgungen & Fahrten · … (aus Veranstaltungen und Sondereinsätzen, nichts fest im Code)
   - Art: `Stand` · `Sondereinsatz` · `Erstattung`
   - Stand: `bestätigt` · `vorläufig` · `beide`
2. **Summenkarten:** Stunden gesamt · davon Stand / Sondereinsätze / Erstattung · km gesamt · (Soll zum Vergleich)
3. **Diagramm** (umschaltbar, siehe 4.)
4. **Liste:**

| ID | Datum | Zeit | Std. | Anlass / Tätigkeit | km | Stand |
|---|---|---|---|---|---|---|
| D-7K2Q9A | Fr 04.12.2026 | 11:00–17:30 | 6,5 | Weihnachtsmarkt · Stand vorne | – | ✅ |
| S-3F9A21 | Di 10.11.2026 | 07:00–15:30 | 8,5 | Grünkohl kochen · Kochen | – | ✅ |
| E-91C0D4 | Fr 20.11.2026 | 14:00–15:30 | 1,5 | Besorgungen & Fahrten · Transport | 32 | ✅ |
| D-… | Sa 05.12.2026 | 15:00–23:00 | 8,0 | Weihnachtsmarkt · Stand hinten | – | ⏳ vorläufig |
| | | | **24,5** | | **32** | |

**ID:** Vorne steht die Quelle (D = Dienst, S = Sonderstunden, E = Erstattung, K = nur km), dahinter ein kurzer, fester Schlüssel aus DP2 bzw. dem Antrag. Damit kann man beim Planer gezielt nachfragen („Zeile S-3F9A21 stimmt nicht“). Dieselbe ID steht im DP2-Kontoauszug.

**km** stehen bei der Zeile, zu der sie gehören (Zeit aus Erstattung). Fahrten ohne Zeit bekommen eine eigene Zeile „K-…“ mit 0 Std.

## 4. Diagramme

Alle Diagramme werden direkt in der App gezeichnet (SVG). Es gibt keinen fremden Dienst und keine Kosten, sie sind im Dunkelmodus lesbar und folgen immer dem gewählten Filter.

| Diagramm | Zeigt | Sinnvoll bei |
|---|---|---|
| **Säulen** (gestapelt) | Stunden je Monat bzw. je Tag, nach Art gestapelt (Stand / Sondereinsatz / Erstattung) | Jahr, Monat |
| **Balken** (waagerecht) | Stunden je Anlass, größter oben | Alles, Jahr |
| **Linie** | Stunden aufsummiert über die Saison, dazu gestrichelt das Soll | Veranstaltung (z. B. Weihnachtsmarkt) |
| **Kreis** (Ring) | Anteil der Arten an den Stunden | nur bei höchstens 5 Teilen |

Die App schlägt je Filter das passende Diagramm vor, man kann es mit vier Knöpfen umschalten. Jede Zahl steht auch in der Liste, das Diagramm ist nur zusätzlich.

## 5. PDF / Drucken

Gebaut auf dem vorhandenen Druck-System mit dem Club-Kopfbogen (KC-CLUB-BRIEFBOGEN, wie beim Erstattungsantrag):

- **Kopf:** Logo, Köcheclub-Farben, Titel „Stundenkonto“, Name und Mitglieds-ID, gewählter Zeitraum und Filter, „erstellt am …“, „Stand DP2 …“
- **Tabelle** wie in 3. (A4 hoch, Kopfzeile wiederholt sich auf jeder Seite)
- **Fuß:** Summe der Stunden (bestätigt und vorläufig getrennt), Summe km, Hinweis „⏳ vorläufig = von DP2 noch nicht geprüft“, Seitenzahl
- **Freiwillig (Haken):** eine Seite mit den Diagrammen; „nur bestätigte Zeilen“
- Ausgabe: „📄 Ansehen / PDF speichern / Drucken“; auf Wunsch Ablage in „Meine Dokumente“, wie bei der Erstattung.

## 6. Technik

**DP2 (`DP2-F-KONTO-01`)**
- Neue Tabelle `kc_dp_konto_published`. Je gebuchter Ist-Zeile eine Zeile mit: Person, Datum, von/bis, Pause, Stunden, Art, Anlass (`event_id`, `special_event_id`, Titel), Tätigkeit, Quelle, Kurz-ID, Verweis auf Meldung/Antrag, `published_at`.
- Muster wie `kc_dp_plan_published`: veröffentlichen per RPC nur mit Planungsrolle, Abgleich als Gesamtstand (Fehlendes wird weich entfernt), läuft im Auto-Sync-Takt.
- Inhalt gleich wie der Kontoauszug (`personAccountPrint.buildRows`), also derselbe Kern und kein zweites Rechenwerk.
- Spiegel und Sicherung wie die anderen `kc_dp_*`-Tabellen. RLS: kein direkter Zugriff, die Club-App liest nur über den Server.

**Club-App (`KC-CLUB-STUNDENKONTO`)**
- Neue Server-Aktion `mein_stundenkonto` mit `{ von, bis, anlass, art }`. Sie liest nur die **eigenen** Zeilen aus `kc_dp_konto_published` und fügt hinzu:
  - die vorläufigen Rohdaten für Tage, die DP2 noch nicht veröffentlicht hat,
  - die km aus den eigenen Erstattungen.
- Sie liefert Zeilen, Summen und die Anlass-Liste. Das ist eine Abfrage beim Öffnen und bei Filterwechsel, ohne Echtzeit und ohne Hintergrundjob.
- Neue Kachel in Meins, eigene Seite, ausgelagerter Programmteil `teile/stundenkonto.js` (wird erst beim Öffnen geladen), Druckvorlage `stundenkonto` im Druck-System.
- Die Karte „★ Sonderstunden“ in „Mein Dienst“ bleibt und bekommt einen Link „→ ganzes Stundenkonto“.

**Datenschutz:** Jedes Mitglied sieht nur sich selbst. Chats und Nachrichten sind nicht betroffen.

**Kosten:** keine. Nur vorhandene Supabase-Tabellen und eigene SVG-Diagramme, keine Bibliothek aus dem Netz.

## 7. Schritte

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1** (nur Club-App) | Kachel, Filter, Liste, Summen, PDF aus den Quellen 2–4 (bestätigt) und Quelle 1 als „vorläufig“ | Mitglieder sehen sofort etwas Brauchbares |
| **2** (DP2 + Club-App) | DP2 veröffentlicht den geprüften Kontoauszug, die Stand-Dienste werden „bestätigt“ | Zahlen gleich wie in DP2 |
| **3** | Diagramme (4 Arten) und Diagrammseite im PDF | |

## 8. Tests / Definition of Done

- [ ] Summe Stunden und km stimmt mit der Liste überein (alle Filter); bestätigt und vorläufig getrennt
- [ ] Nach Phase 2: Club-App-Summe = DP2-Kontoauszug derselben Person und desselben Zeitraums (Vergleichstest mit denselben Daten)
- [ ] Zurückgenommene oder abgelehnte Zeit verschwindet (KICC-F-112), stornierte Erstattung ohne km
- [ ] Vorläufige Zeilen sind sichtbar markiert, nie in der bestätigten Summe; „Stand DP2“ wird angezeigt, veraltet ist orange
- [ ] Nur eigene Zeilen (Server-Test mit zweiter Person)
- [ ] PDF: Kopfbogen, Tabelle über mehrere Seiten, Summen im Fuß, ohne Überlappung (vorhandene Druck-Prüfung)
- [ ] Diagramme: Werte = Liste, lesbar hell und dunkel, 320–1280 px ohne seitlichen Überlauf
- [ ] Browser-Rundgang abgeschirmt (KC-TESTS-OHNE-ECHTSERVER), Hilfe-Eintrag, CHANGELOG in beiden Apps

## 9. Offene Fragen an Hansi

1. **Vorläufige Zeiten** (noch nicht von DP2 geprüft): nur anzeigen (Vorschlag) oder in die Gesamtsumme mitzählen?
2. **km:** schon bei „eingereicht“ zählen (Vorschlag, mit Kennzeichen) oder erst bei „erstattet“?
3. **Soll** als gestrichelte Vergleichslinie zeigen? Ja/Nein
4. **Konten anderer:** Sollen Vorstand oder Planer das Stundenkonto eines Mitglieds in der Club-App ansehen und drucken dürfen, oder bleibt das in DP2?
5. **Anlässe außerhalb des Dienstplans** (Clubabend, Kochen in Dortmund, Schulung): Sollen dafür auch Stunden gesammelt werden? Dann bräuchte es dort ebenfalls „Zeit mitmelden“.
6. **Reihenfolge:** erst Phase 1 (schnell sichtbar, Stand-Dienste vorläufig) oder gleich Phase 1+2 zusammen?
