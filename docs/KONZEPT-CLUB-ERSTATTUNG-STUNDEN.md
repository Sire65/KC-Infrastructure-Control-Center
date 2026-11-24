# Konzept: Stunden mit der Erstattung einreichen (Club-App + DP2)

Feature-ID: **KICC-F-112** (Club-App: `KC-CLUB-ERSTATTUNG-STUNDEN`, DP2: `DP2-F-SE-09`)
Stand: 24.11.2026 · Status: **KONZEPT FREIGEGEBEN** (noch nichts gebaut) · Betrifft: `Sire65/KC-Clubapp`, `Sire65/dp3`

## 1. Worum geht es?

Beispiel: Marianne Holt holt mit ihrem Pkw die Wurst beim Metzger ab und bringt sie zum Weihnachtsmarkt.

- Die **Kilometer** bekommt sie mit dem Km-Satz erstattet (gibt es schon: 💶 Erstattung → Fahrt).
- Die **Zeit** soll auf ihr **Stundenkonto** im Dienstplan (DP2).

Heute sind das zwei getrennte Wege: Kilometer über 💶 Erstattung, Zeit über 🗓️ Dienstwunsch → Twinkey → „Sonderstunden melden“.
Die Zeit zählt dort erst, wenn der Planer sie in DP2 bestätigt hat.

**Ziel:** Marianne meldet beides **in einem Antrag**, mit wenigen Tipps.
Die Stunden stehen **sofort** im Stundenkonto, ohne dass jemand sie erst in DP2 freigeben muss.

## 2. Was es schon gibt (wird weiter genutzt, nichts wird entfernt)

| Baustein | Wo | Nutzen für dieses Konzept |
|---|---|---|
| Erstattungsantrag mit Positionen (`fahrt`, `einkauf`, `parken` …), Km-Satz, Kassenwart-Status | Club-App `kc_club_erstattung` | Hier kommt das neue Feld „Zeit“ dazu |
| Stundenmeldungen `kc_dp_hour_reports` (Club-App schreibt, DP2 liest) | gemeinsame Supabase-Tabelle | Gleiche Tabelle, kein zweites Stundensystem |
| Prüfungen: Viertelstunden, max. 16 Std., Pause, Doppelschutz | `sonderstundenMelden` (Club-App-Server) | Werden 1:1 wiederverwendet |
| Twinkey liest bestätigte Meldungen und zeigt sie im Konto | DP2 `twinkey.js` | Funktioniert dann auch für die neuen Meldungen |
| Bestätigen erzeugt eine Ist-Buchung (Stundenkonto) | DP2 `hour-reports.js` → `decide()` | Wird für die automatische Buchung genutzt |

Der bisherige Weg „Sonderstunden melden“ über Twinkey bleibt unverändert, mit der Bestätigung durch den Planer.

## 3. So sieht es für das Mitglied aus

💶 **Erstattung** → **🚗 Fahrt**, wie bisher:

1. Datum, Kilometer, Grund (z. B. „Besorgung Weihnachtsmarkt“)
2. **Neu, ein Schalter:** `⏱️ Zeit fürs Stundenkonto mitmelden?`  **Ja** / Nein
   - Bei **Ja** erscheinen nur zwei Auswahlfelder: **Von** und **Bis** (Viertelstunden-Rad, keine Freitexte)
   - **Wofür?** ist vorbelegt mit dem aktuellen Einsatz, z. B. „Weihnachtsmarkt – Besorgungen & Fahrten“. Ändern geht nur per Auswahl.
   - **Tätigkeit** wird aus dem Grund abgeleitet (Fahrt → „Transport / Fahrt“, Einkauf → „Einkauf / Besorgung“). Ändern geht per Auswahl.
3. Zusammenfassung vor dem Absenden, in einer Zeile:
   **„12,16 € Fahrtkosten (32 km × 0,38 €) · 1,5 Std. aufs Stundenkonto“**
4. Absenden → Meldung: *„✓ Eingereicht. Die 1,5 Std. stehen schon in deinem Stundenkonto.“*

Der Schalter erscheint auch bei **🛒 Einkauf**, denn Einkaufen ist auch Zeit. Bei Parken oder Kaution erscheint er nicht.

**Regeln, damit es einfach bleibt:**
- Fahrzeit von zuhause bis zuhause zählt, wie bisher bei den Sonderstunden.
- Der Schalter erscheint immer, wenn im Dienstplan eine Veranstaltung aktiv ist (nicht nur zum Weihnachtsmarkt).
- Wer nicht im Dienstplan geführt ist, sieht den Schalter nicht, also keine Stunden ins Leere.
- In „Meine Anträge“ steht je Antrag: Betrag, Status beim Kassenwart **und** „⏱️ 1,5 Std. gebucht“.

## 4. Freigabe: einmal, nicht zweimal

| | Geld (Kilometer, Einkauf) | Stunden |
|---|---|---|
| Wer entscheidet? | Kassenwart, wie bisher | **niemand vorab**, die Stunden zählen sofort |
| Was passiert bei Ablehnung? | Antrag „abgelehnt“ | Lehnt der Kassenwart den **ganzen Antrag** ab, werden die Stunden automatisch wieder ausgebucht, und das Mitglied bekommt eine Nachricht |
| Kontrolle | Kassenwart sieht die Stunden im selben Antrag | Planer sieht in DP2 eine Liste „automatisch gebucht (aus Erstattung)“ und kann eine einzelne Buchung **korrigieren oder stornieren**, muss aber nichts freigeben |

Sicherungen statt Freigabe:
- die bekannten Prüfungen (max. 16 Std., Viertelstunden, nur vergangene Tage, Doppelschutz gegen dieselbe Zeit zweimal),
- eine **Plausi-Warnung** (keine Sperre), wenn Zeit und Kilometer nicht zusammenpassen, z. B. 8 Std. bei 4 km. Dann fragt die App einmal nach: „Stimmt das?“
- jede Buchung und jede Storno landet im Audit-Protokoll (Vertrag Nr. 10).

## 5. Technik (kurz)

**Club-App (`KC-Clubapp`)**
- Erstattungsposition bekommt optional `stunden: { von, bis, special_event_id, taetigkeit }` in der vorhandenen jsonb-Spalte `positionen`, also **keine Schemaänderung** an `kc_club_erstattung`.
- Der Server legt beim Einreichen zusätzlich eine Zeile in `kc_dp_hour_reports` an:
  `source = 'erstattung'`, `status = 'bestaetigt'`, `erstattung_id = <Antrag>`, `entschieden_von = null` (= automatisch).
  Er verwendet dabei die vorhandenen Prüfungen aus `sonderstundenMelden` (in eine gemeinsame Hilfsfunktion ziehen, nicht kopieren).
- Wenn der Kassenwart den Antrag ablehnt, setzt der Server die verknüpfte Stundenzeile auf `zurueckgezogen`.

**Gemeinsame Tabelle (Migration in `dp3`)**
- `source` erlaubt zusätzlich `'erstattung'`, neue Spalte `erstattung_id uuid null`.
- Rückweg: Spalte löschen, Check auf `('club_app','dp2')` zurücksetzen.

**DP2 (`dp3`)**
- Beim Abgleich: Meldungen mit `status = 'bestaetigt'`, die noch keine Ist-Buchung haben, werden **automatisch gebucht**. Das läuft über dieselbe Buchungsstrecke wie `decide()`, nur ohne Klick (Quelle `self_report`, Grund „aus Erstattung“).
- Meldungen mit `zurueckgezogen`, die schon gebucht sind, werden automatisch storniert.
- In der Stundenmeldungs-Ansicht gibt es einen neuen Filter „automatisch gebucht“ mit den Knöpfen *Korrigieren* und *Stornieren*.

**Einsatz „Besorgungen & Fahrten“:** Nicht jede Fahrt gehört zu einem eigenen Sondereinsatz. Darum veröffentlicht der Planer in DP2 einen ständigen Sondereinsatz „Besorgungen & Fahrten“ je Veranstaltung. Er wird als normaler Datensatz angelegt und nicht im Code fest eingetragen (Vertrag Nr. 4). Er dient als Vorbelegung.

## 6. Tests und Definition of Done

- [ ] Fahrt + Zeit → ein Antrag, eine Stundenzeile (`source=erstattung`, `bestaetigt`), Betrag nach Km-Satz richtig
- [ ] Einkauf + Zeit genauso; Parken/Kaution ohne Zeit-Schalter
- [ ] Doppelschutz: dieselbe Zeit über Twinkey **und** über die Erstattung → nur einmal gebucht
- [ ] Kassenwart lehnt ab → Stunden zurückgezogen, DP2 storniert die Ist-Buchung, Mitglied wird benachrichtigt
- [ ] Planer storniert in DP2 → Antrag bleibt, Stunden weg, Mitglied sieht es in „Meine Anträge“
- [ ] Person nicht im Dienstplan oder keine Veranstaltung aktiv → kein Schalter
- [ ] Twinkey-Weg „Sonderstunden melden“ unverändert (Regressionstest)
- [ ] Offline in DP2: Automatik bucht beim nächsten Abgleich, kein Mischstand (Vertrag Nr. 16)
- [ ] Zero-Cost: keine neuen Dienste, nur vorhandene Supabase-Tabellen
- [ ] Hilfe-Eintrag „Zeit mit der Erstattung melden“ und `CHANGELOG` in beiden Apps

## 7. Entscheidungen (Hansi, 24.11.2026)

1. **Sofort gutschreiben.** Die Stunden zählen beim Einreichen; der Kassenwart kann nur über eine Ablehnung des Antrags zurücknehmen.
2. **Immer:** Den Zeit-Schalter gibt es immer, wenn im Dienstplan eine Veranstaltung aktiv ist, nicht nur zum Weihnachtsmarkt.
3. Der ständige Einsatz heißt **„Besorgungen & Fahrten“** (je Veranstaltung, in DP2 veröffentlicht).

Status: **KONZEPT FREIGEGEBEN**, Umsetzung offen.

Einspielen nach Freigabe gebündelt zu den Club-App-Terminen (12:00 / 23:50 Uhr).
