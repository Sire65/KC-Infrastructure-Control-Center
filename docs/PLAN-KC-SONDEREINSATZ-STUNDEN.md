# Konzept: Sonderstunden melden (Grünkohl Dortmund/Hamm, Getränke zuhause)

Feature-ID: **KICC-F-100** · Status: **KONZEPT** (zur Freigabe durch den Betreiber) · Stand: 2026-10-15
Betroffene Programme: **KC DP2** (`dp3`, 0.20.0-build247), **KC Club App** (`KC-Clubapp`, 2.415.0), Stempeluhr im **PC-Manager/Kasse** (`Kasse`, nur Prüfung auf Doppelzeiten)

## 1. Anlass
1. Mehrere Kollegen kochen Grünkohl in einem Krankenhaus in Dortmund. **Termin und Stundenumfang stehen noch nicht fest.**
2. Zwei Tage später wird der Grünkohl in Dortmund abgeholt und nach Hamm in einen Tiefkühler gebracht. Auch dabei fallen Stunden an (und Fahrtkilometer).
3. Eine Kollegin mischt die Getränke zuhause und fährt sie zum Stand. Sie macht kaum Standdienst.
4. Alle diese Stunden sollen dem **Stundenkonto Weihnachtsmarkt** gutgeschrieben werden. Die Kollegen melden sie selbst, per Auswahl statt Freitext.

## 2. Was es schon gibt (geprüft am 2026-10-15)
| Baustein | Wo | Was er kann |
|---|---|---|
| Z-Bereich „Sonderdienst extern“ | DP2 `src/core/planning.js` (`K.isSpecialShift`, `normalizeShiftClassification`) | Dienste mit Zone `special` und Bereich `Z · …`. Erkennt automatisch „zuhause“, „transport“, „besorgung“, „nachproduktion“, „anderer Ort“. |
| Wunsch-Zone Z | DP2 `src/ui/simple-wish-assistant.js` | Im Wunschplan kann man „Vorbereitung zuhause / außerhalb des Stands“ wählen. |
| Z-Stunden im Konto | DP2 `src/ui/person-hours-block.js`, `src/core/documents.js` | Personenstunden haben eine eigene Spalte **Z-Dienst**. Es gibt ein Sonderdienste-Dokument und die Druck-Legende „Sonderdienst“. |
| Ist-Zeiten | DP2 `src/core/actual.js` | Ist-Zeiten mit Quelle, Soll/Ist-Abgleich, Korrekturantrag, Audit und Abschluss des Istplans. |
| Stempeluhr → DP2 | `Kasse/pc-manager/time-clock-*.js` → Tabelle `kc_dp_timeclock_actuals` (Feld `source`) | Die Kasse liefert gestempelte Zeiten an DP2. |
| Persönlicher Kontoauszug | DP2 `src/ui/person-account-print.js`, Twinkey → „Meine Unterlagen“ | Wunsch, Soll, Ist und Stempelzeiten je Person. Das ist das **Stundenkonto Weihnachtsmarkt**. |
| Twinkey | DP2 `src/ui/twinkey.js`, in der Club App unverändert über `dp2-club/` eingebunden | Geführter Assistent mit den Aufgaben: Wunschplan, Dienstplan, Dienst ändern, erfasste Zeiten, Unterlagen. |
| Erstattung/Auslagen | Club App, `kc_club_erstattung`, `kc_club_km_satz` | Fahrtkosten und Auslagen in Euro, km-Satz mit „gilt ab“, Versand an den Kassenwart. |

**Die Lücke:** Für Arbeit **außerhalb des Stands** gibt es keine Ist-Zeit. Die Stempeluhr steht an der Kasse, also stempelt niemand im Krankenhaus, auf der Fahrt nach Hamm oder in der eigenen Küche. Außerdem kennt DP2 nur die festen Markttage (`model.js`: Vorbereitung 02./03.12., Markttage, Nachbereitung). Ein Einsatz mit offenem Termin, vielleicht sogar im Januar, kommt dort nicht vor.

## 3. Entscheidung: Stunden über Twinkey, Kilometer über Erstattung
**Stunden gehören in DP2 und werden über Twinkey gemeldet, nicht unter „Auslagen“.**
- Auslagen sind Geld (Euro, Kassenwart, Überweisung oder bar). Stunden sind Zeit (Ist-Zeiten, Kontoauszug, Planer). Würde man beides mischen, wären der km-Satz und der Kontoauszug falsch, und der Kassenwart bekäme Stundenmeldungen.
- Twinkey läuft schon unverändert in DP2 **und** in der Club App. Was man einmal in DP2 baut, ist automatisch in beiden Programmen da (Regel 3: kein paralleler Kern).
- **Verbindung zwischen beiden:** Am Ende der Stundenmeldung fragt Twinkey „Bist du dafür gefahren?“. Bei „Ja“ öffnet sich die vorhandene Erstattung der Club App mit einer **vorausgefüllten Fahrt-Position** (Datum, Anlass, Strecke Dortmund → Hamm). Ob erstattet wird, entscheidet weiterhin allein die Erstattung.

## 4. Bausteine
### 4.1 Sondereinsätze als Liste (DP2, Planer pflegt sie)
Neue veröffentlichte Liste `kc_dp_special_events`. Sie wird veröffentlicht wie die Tage (`kc_dp_days_published`).

| Feld | Bedeutung |
|---|---|
| `id`, `org_id`, `event_id` | `event_id` ist das Stundenkonto, hier Weihnachtsmarkt 2026. |
| `titel`, `ort` | z. B. „Grünkohl kochen“, „Krankenhaus Dortmund“ |
| `art` | Auswahl: `kochen`, `transport`, `vorbereitung_zuhause`, `einkauf`, `aufbau_abbau`, `sonstiges` |
| `termin_status` | `OFFEN` → `GEPLANT` → `FEST` |
| `datum_von`, `datum_bis` | dürfen leer sein, solange der Termin `OFFEN` ist |
| `folgt_auf`, `abstand_tage` | z. B. Abholung = Kochtermin + 2 Tage. Das Datum wird **automatisch** mitgezogen, wenn der Kochtermin feststeht. |
| `wiederkehrend` | z. B. Getränke an jedem Markttag |
| `bestaetiger` | Rolle, die Meldungen freigibt: Planer, optional ein Einsatzleiter je Anlass |
| `aktiv`, `version` | |

Beispiele zum Start: „Grünkohl kochen · Krankenhaus Dortmund“ (OFFEN), „Grünkohl abholen Dortmund → Tiefkühler Hamm“ (folgt auf Kochen, +2 Tage), „Getränke mischen zuhause + Anlieferung“ (wiederkehrend, Markttage).

Sobald ein Anlass `FEST` ist, legt DP2 einen **Sondertag** an (neuer Tagestyp `special`). Er bekommt keinen Standbedarf und gilt nicht für die Stempeluhr. So lassen sich Dienste planen und Helfer über Twinkey abfragen, wie an den anderen Tagen. Solange der Termin `OFFEN` ist, kann man in Twinkey nur **„Ich würde helfen“** melden (eine Bereitschaft, keine Stunden).

### 4.2 Stundenmeldung (neue Tabelle `kc_dp_hour_reports`)
`id, org_id, event_id, special_event_id, person_id, work_date, start_time, end_time, break_minutes, taetigkeit, bemerkung, status, gemeldet_von, gemeldet_am, bestaetigt_von, bestaetigt_am, ablehngrund, linked_actual_id, version, checksum`

- **Status:** `gemeldet` → `bestaetigt` | `abgelehnt` | `zurueckgezogen`.
- **RLS:** Man darf eigene Meldungen anlegen und lesen. Ein Einsatzleiter darf für die Teilnehmer seines Anlasses melden. Der Planer darf alles lesen und den Status ändern. Löschen ist nicht möglich, nur zurückziehen.
- **Gruppenmeldung:** Der Kochleiter kann für mehrere Kollegen gleichzeitig melden. Für jede Person entsteht eine eigene Zeile. Jeder sieht seine Zeile und kann widersprechen; dafür gibt es den Korrekturantrag aus `actual.js`.

### 4.3 Freigabe und Gutschrift (DP2)
- Ein neuer Eingang **„Sonderstunden-Meldungen“** im Planer, so wie der Wunsch-Eingang.
- **Bestätigen** erzeugt über das vorhandene `saveActual` eine Ist-Zeit mit `source:'self_report'`, `zone:'special'` und `area:'Z · <Anlass>'`. Gibt es am selben Tag einen geplanten Z-Dienst, verknüpft `matchCandidate` die Meldung automatisch damit, und der Soll/Ist-Abgleich funktioniert wie gewohnt.
- **Ablehnen** geht nur mit Grund. Jeder Schritt wird auditiert (`K.recordAudit`).
- **Istplan schon abgeschlossen** (der Krankenhaustermin liegt vielleicht nach dem Markt): Die Gutschrift wird als **Nachtrag** gebucht. Das ergibt eine neue `actualPlanVersion` mit dem Grund „Sondereinsatz“. Der alte Abschluss bleibt unverändert (Regel 17).
- **Doppelzeiten:** Hat dieselbe Person zur selben Zeit an der Stempeluhr gestempelt, zeigt DP2 dem Planer eine Warnung. Es wird nichts automatisch verrechnet.

### 4.4 Anzeige im Stundenkonto (Regel 11: Unbestätigtes nie als OK)
- Kontoauszug und Personenstunden zählen **nur bestätigte** Meldungen. Sie stehen in der Z-Dienst-Spalte und in einer eigenen Zeile „Sondereinsätze“ mit der Quelle „Meldung“.
- **Gemeldete, noch offene Stunden** stehen getrennt und deutlich markiert („gemeldet, noch nicht bestätigt“) und **zählen nicht zur Summe**.
- In der Club App erscheint unter „was du gearbeitet hast“ (`kc-club/index.ts`, liest heute nur `kc_dp_timeclock_actuals`) zusätzlich die Meldung mit ihrem Status.

## 5. Twinkey-Ablauf „Sonderstunden melden“
Neue Aufgabe in `tasks()`: **„Sonderstunden melden“**, mit dem Untertitel „Arbeit außerhalb des Stands: Kochen, Fahrten, zuhause“.

| Schritt | Frage | Eingabe |
|---|---|---|
| 1 | Für welchen Einsatz? | Auswahl aus 4.1 mit Termin-Status. Ist der Termin noch `OFFEN`, geht es mit „Ich würde helfen“ weiter. |
| 2 | Für wen? | „Nur für mich“ oder, nur für Einsatzleiter, „auch für Kollegen“ (Mehrfachauswahl aus der Personenliste). |
| 3 | An welchem Tag? | Vorschlag aus dem Anlass, sonst Kalender. Tage in der Zukunft sind nicht wählbar. |
| 4 | Von wann bis wann? | Zeitwahl wie im Schritt „can“, dazu die Pause |
| 5 | Was hast du gemacht? | Auswahl: Kochen, Vorbereitung, Transport/Fahrt, Einkauf, Getränke mischen, Aufräumen |
| 6 | Bemerkung | optional |
| 7 | Bist du dafür gefahren? | Ja: km-Erstattung in der Club App vorbereiten (siehe §3). Nein: weiter. |
| 8 | Passt das so? | Zusammenfassung, dann der Knopf **„Meinem Weihnachtsmarkt-Stundenkonto gutschreiben lassen“**. Darunter der Hinweis: „Die Stunden werden gutgeschrieben, sobald der Planer sie bestätigt hat.“ |
| 9 | Fertig | Die Meldung erscheint unter „Meine erfassten Zeiten“ mit ihrem Status. |

Für die Sprachausgabe kommen neue Text-Schlüssel in `assets/twinkey/audio/texts.json`. Fehlt eine WAV-Datei, nutzt Twinkey die Gerätestimme; dieser Rückfall ist schon vorhanden.

## 6. Kollegin mit den Getränken (zuhause mischen, anliefern)
In DP2 ist das bereits vorgesehen:
1. **Wunsch:** Sie wählt die Wunsch-Zone **Z** („Vorbereitung zuhause / außerhalb des Stands“).
2. **Planung:** Der Planer legt Z-Dienste an, z. B. `Z · Getränke zuhause` und `Z · Transport Getränke`. DP2 erkennt sie automatisch als Sonderdienst. Sie stehen in der Spalte Z-Dienst, im Sonderdienste-Dokument und **nicht** im Standbedarf (Vorne/Hinten).
3. **Neu, und das ist die eigentliche Lücke:** Zuhause gibt es keine Stempeluhr. Deshalb meldet sie ihre Ist-Zeit über „Sonderstunden melden“ mit dem wiederkehrenden Anlass „Getränke mischen zuhause + Anlieferung“. Die Meldung wird automatisch mit ihrem Z-Dienst des Tages verknüpft, und der Soll/Ist-Abgleich ist vollständig.
4. **Neue Personenregel** „Z-Dienst wird per Meldung bestätigt“ (in `personRules`): Beim Abschluss des Istplans erscheint ihr Z-Dienst dann nicht als „Stempel fehlt“, sondern als „Meldung ausstehend“.
5. **Fahrt zum Stand:** km-Erstattung wie in §3 (Schritt 7).

## 7. Umsetzung in Phasen
| Phase | Programm | Inhalt | Feature-ID |
|---|---|---|---|
| 1 | DP2 | Tabelle `kc_dp_special_events`, Planer-Pflege, Tagestyp `special`, automatisches Folgedatum | DP2-F-SE-01 |
| 2 | DP2 | Tabelle `kc_dp_hour_reports` mit RLS, Twinkey-Aufgabe „Sonderstunden melden“ | DP2-F-SE-02 |
| 3 | DP2 | Eingang, Bestätigen/Ablehnen, Gutschrift als `self_report`, Nachtrag nach Abschluss, Warnung bei Doppelzeiten, Kontoauszug | DP2-F-SE-03 |
| 4 | DP2 | Personenregel „Z per Meldung“ (Getränke) | DP2-F-SE-04 |
| 5 | Club App | `dp2-club/daten.js`: Anlässe und Meldungen laden und speichern (neue Aktion `stunden_melden` in `kc-club`), Startseite mit Status, vorausgefüllte km-Position in der Erstattung | CLUB-F-SE-05 |
| 6 | Kasse | nur lesen: Stempeluhr-Zeiten für die Doppelzeit-Warnung bereitstellen (kein Umbau) | — |

Jede Phase bekommt eine neue Build-/Versionsnummer (DP2 build248 ff., Club App 2.416.0 ff.) und durchläuft DEV → RC.

## 8. Tests und Definition of Done
- **Unit (DP2 `tools/test-*.mjs`):** Folgedatum +2 Tage, Statuswechsel, keine Gutschrift ohne Bestätigung, Verknüpfung mit dem Z-Dienst, Nachtrag nach `closePlan`, Doppelzeit-Warnung, Gruppenmeldung erzeugt eine Zeile pro Person.
- **Twinkey (`test-twinkey*.mjs`):** kompletter Ablauf, Termin `OFFEN` führt nur zu „Ich würde helfen“, Zukunftsdatum ist gesperrt.
- **RLS:** Fremde Meldungen sind nicht lesbar, Löschen ist unmöglich, nur der Planer bestätigt.
- **Club App (`tests/app-vertrag.test.mjs`):** Aufgabe sichtbar, Speichern landet in `kc_dp_hour_reports`, km-Vorbelegung korrekt.
- **DoD:** Der Kontoauszug zeigt bestätigte und offene Stunden getrennt. Das Audit ist vollständig. Es entstehen keine Kosten (vorhandenes Supabase, kein neuer Dienst). Es gibt keine Secrets im Browser. Die Doku ist aktualisiert.

## 9. Offene Fragen an den Betreiber
1. **Was ist „SB“?** Angenommen ist hier die **Stempeluhr** an der Kasse bzw. im PC-Manager. Wenn ein anderes Programm gemeint ist, wird Phase 6 angepasst.
2. **Wer bestätigt?** Nur der Planer oder zusätzlich ein Einsatzleiter je Anlass (z. B. der Kochleiter in Dortmund)?
3. **Anrechnung 1:1?** Sollen Fahrtzeit und Zeit zuhause voll zählen oder mit einem Faktor bzw. einer Pauschale (z. B. Transport Dortmund → Hamm pauschal X Stunden)?
4. **Gruppenmeldung erlaubt?** Darf der Kochleiter für alle melden, oder meldet jeder selbst?
5. **Frist:** Bis wann nach dem Einsatz muss gemeldet werden?
