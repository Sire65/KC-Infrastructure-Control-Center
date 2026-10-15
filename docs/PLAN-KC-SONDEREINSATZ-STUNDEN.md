# Konzept: Sonderstunden melden (Grünkohl Dortmund/Hamm, Getränke zuhause)

Feature-ID: **KICC-F-100** · Status: **KONZEPT** (Betreiber-Entscheidungen vom 2026-10-15 eingearbeitet, siehe §9) · Stand: 2026-10-15
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
| Erstattung/Auslagen | Club App, `kc_club_erstattung` (`positionen` als jsonb), `kc_club_km_satz` | Positionsarten Fahrt, Einkauf und Sonstiges. Mehrere Positionen pro Antrag, Belegfoto oder PDF (bis zu 5 je Position, freiwillig), km-Satz mit „gilt ab“, Versand an den Kassenwart. |
| Büro-Eingangskorb | Club App, `kc_club_eingang_stand` (Art `erstattung`) | Jede Erstattung landet automatisch im Eingangskorb der Clubleitung (Clubsprecher, Kassenwart, Admin) und wird dort bearbeitet. |

**Die Lücke:** Für Arbeit **außerhalb des Stands** gibt es keine Ist-Zeit. Die Stempeluhr steht an der Kasse, also stempelt niemand im Krankenhaus, auf der Fahrt nach Hamm oder in der eigenen Küche. Außerdem kennt DP2 nur die festen Markttage (`model.js`: Vorbereitung 02./03.12., Markttage, Nachbereitung). Ein Einsatz mit offenem Termin, vielleicht sogar im Januar, kommt dort nicht vor.

## 3. Entscheidung: Stunden über Twinkey, Kilometer über Erstattung
**Stunden gehören in DP2 und werden über Twinkey gemeldet, nicht unter „Auslagen“.**
- Auslagen sind Geld (Euro, Kassenwart, Überweisung oder bar). Stunden sind Zeit (Ist-Zeiten, Kontoauszug, Planer). Würde man beides mischen, wären der km-Satz und der Kontoauszug falsch, und der Kassenwart bekäme Stundenmeldungen.
- Twinkey läuft schon unverändert in DP2 **und** in der Club App. Was man einmal in DP2 baut, ist automatisch in beiden Programmen da (Regel 3: kein paralleler Kern).
- **Wer entscheidet was (Betreiber, 2026-10-15):** Die **Stunden bestätigt der Planer in DP2**. Die **km-Erstattung landet im Büro-Eingangskorb** der Club App und wird dort wie jede andere Erstattung bearbeitet.
- **Verbindung zwischen beiden:** Am Ende der Stundenmeldung fragt Twinkey „Bist du dafür gefahren?“. Bei „Ja“ öffnet sich die vorhandene Erstattung der Club App mit einer **vorausgefüllten Fahrt-Position** (Datum, Anlass, Strecke, z. B. Dortmund → Hamm). Nach dem Absenden liegt sie automatisch im Eingangskorb. Es wird kein eigener Erstattungsweg gebaut.
- In DP2 ohne Club App zeigt dieser Schritt nur den Hinweis „Fahrtkosten bitte in der Club App unter Erstattung melden“.

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
| `aktiv`, `version` | |

Beispiele zum Start: „Grünkohl kochen · Krankenhaus Dortmund“ (OFFEN), „Grünkohl abholen Dortmund → Tiefkühler Hamm“ (folgt auf Kochen, +2 Tage), „Getränke mischen zuhause + Anlieferung“ (wiederkehrend, Markttage).

Sobald ein Anlass `FEST` ist, legt DP2 einen **Sondertag** an (neuer Tagestyp `special`). Er bekommt keinen Standbedarf und gilt nicht für die Stempeluhr. So lassen sich Dienste planen und Helfer über Twinkey abfragen, wie an den anderen Tagen. Solange der Termin `OFFEN` ist, kann man in Twinkey nur **„Ich würde helfen“** melden (eine Bereitschaft, keine Stunden).

### 4.2 Stundenmeldung (neue Tabelle `kc_dp_hour_reports`)
`id, org_id, event_id, special_event_id, sammel_id, person_id, work_date, start_time, end_time, break_minutes, taetigkeit, bemerkung, status, gemeldet_von, gemeldet_am, bestaetigt_von, bestaetigt_am, ablehngrund, linked_actual_id, version, checksum`

- **Status:** `gemeldet` → `bestaetigt` | `abgelehnt` | `zurueckgezogen`.
- **Sammelmeldung (Betreiber, 2026-10-15):** **Ein Kollege meldet** und wählt **weitere Kollegen** aus, die dabei waren, **jeweils mit eigenem Stundenumfang**. Das geht in Twinkey in DP2 und genauso in der Club App.
  - Für jede Person entsteht eine **eigene Zeile**. Alle Zeilen einer Meldung tragen dieselbe `sammel_id`, `gemeldet_von` ist der meldende Kollege.
  - Die Zeiten des Meldenden werden für alle vorgeschlagen und können **pro Person** geändert werden (z. B. kam einer später oder ging früher).
  - Die mitgemeldeten Kollegen werden benachrichtigt und sehen die Meldung unter „Meine erfassten Zeiten“. Stimmt etwas nicht, können sie widersprechen; dafür gibt es den Korrekturantrag aus `actual.js`.
  - **Doppelschutz:** Hat ein Kollege für denselben Anlass und Tag schon eine überlappende Meldung (selbst gemeldet oder von jemand anderem), legt Twinkey keine zweite Zeile an, sondern zeigt die vorhandene an.
- **RLS:** Jeder Angemeldete darf Meldungen für sich und für mitgewählte Kollegen anlegen. Lesen darf man die eigenen Zeilen und die Zeilen der Sammelmeldungen, die man selbst angelegt hat. Nur der Planer darf alles lesen und den Status ändern. Löschen ist nicht möglich, nur zurückziehen.

### 4.3 Freigabe und Gutschrift (DP2)
- Ein neuer Eingang **„Sonderstunden-Meldungen“** im Planer in DP2, so wie der Wunsch-Eingang. **Nur der Planer bestätigt.**
- Eine Sammelmeldung wird zusammen angezeigt (alle Personen mit ihren Stunden). Der Planer kann **alle auf einmal** oder **einzeln** bestätigen bzw. ablehnen.
- **Bestätigen** erzeugt über das vorhandene `saveActual` eine Ist-Zeit mit `source:'self_report'`, `zone:'special'` und `area:'Z · <Anlass>'`. Gibt es am selben Tag einen geplanten Z-Dienst, verknüpft `matchCandidate` die Meldung automatisch damit, und der Soll/Ist-Abgleich funktioniert wie gewohnt.
- **Ablehnen** geht nur mit Grund. Jeder Schritt wird auditiert (`K.recordAudit`).
- **Istplan schon abgeschlossen** (der Krankenhaustermin liegt vielleicht nach dem Markt): Die Gutschrift wird als **Nachtrag** gebucht. Das ergibt eine neue `actualPlanVersion` mit dem Grund „Sondereinsatz“. Der alte Abschluss bleibt unverändert (Regel 17).
- **Doppelzeiten:** Hat dieselbe Person zur selben Zeit an der Stempeluhr gestempelt, zeigt DP2 dem Planer eine Warnung. Es wird nichts automatisch verrechnet.

### 4.4 Anzeige im Stundenkonto (Regel 11: Unbestätigtes nie als OK)
- Kontoauszug und Personenstunden zählen **nur bestätigte** Meldungen. Sie stehen in der Z-Dienst-Spalte und in einer eigenen Zeile „Sondereinsätze“ mit der Quelle „Meldung“.
- **Gemeldete, noch offene Stunden** stehen getrennt und deutlich markiert („gemeldet, noch nicht bestätigt“) und **zählen nicht zur Summe**.
- In der Club App erscheint unter „was du gearbeitet hast“ (`kc-club/index.ts`, liest heute nur `kc_dp_timeclock_actuals`) zusätzlich die Meldung mit ihrem Status.

### 4.5 Weitere Auslagen beim Sondereinsatz (Club App, vorhandene Erstattung)
Fahrt und weitere Auslagen werden **ein** Erstattungsantrag in `kc_club_erstattung`. Er landet wie jeder andere im **Büro-Eingangskorb**. Es gibt keine neue Tabelle und keinen eigenen Weg; die vorhandenen Positionsarten bleiben unverändert (Regel 1).

**Neue Positionsarten.** Sie liegen in einer Liste, die der Admin pflegt, und sind nicht im Code fest verdrahtet (Regel 4):

| Art | Felder | Besonderheit |
|---|---|---|
| `kaution` | Betrag, wofür (z. B. „Thermoboxen“, „Tiefkühler Hamm“), an wen | Eine Kaution kommt in der Regel zurück. Im Eingangskorb hat sie einen eigenen Zustand: **„Kaution offen“** → **„Kaution zurückerhalten“** (an Club oder Mitglied). So geht keine Kaution verloren. |
| `parken` | Betrag, Ort | — |
| `kraftstoff` | Betrag, Liter (freiwillig), Fahrzeug | **Doppelerstattung vermeiden:** Wird für dieselbe Fahrt schon die km-Pauschale beantragt, warnt die App: „Die km-Pauschale deckt den Kraftstoff ab.“ Kraftstoff ist nur für ein Fahrzeug ohne km-Pauschale gedacht, z. B. ein Miet- oder Clubtransporter. Im Eingangskorb wird der Fall markiert. |
| `sonstiges` (vorhanden) | Betrag, wofür (Pflicht) | — |

**Bon/Quittung vorhanden** zum Anklicken, je Position. Neues Feld `beleg_status`:
- 📷 **„Ja, fotografiert“**: Foto oder PDF wie heute (bis zu 5).
- 🧾 **„Ja, liegt mir auf Papier vor“**: wird im Büro abgegeben. Im Eingangskorb steht dann **„Beleg ausstehend“**, bis die Clubleitung „Beleg erhalten“ anklickt.
- ❌ **„Nein, kein Beleg“**: Das Feld Begründung wird Pflicht (z. B. „Parkautomat ohne Quittung“). Der Antrag wird im Eingangskorb als **Eigenbeleg** markiert.

**Bezug zum Einsatz.** Jede Position bekommt `special_event_id` und `hour_report_sammel_id`. Damit sieht der Kassenwart im Eingangskorb, zu welchem Einsatz die Auslage gehört (z. B. „Grünkohl abholen Dortmund → Hamm, 17.01.“), und kann alle Kosten eines Einsatzes zusammen ansehen.

**Nur eigene Auslagen.** Auslagen meldet jeder für sich selbst, weil Konto und Auszahlungsweg persönlich sind. Mitgemeldete Kollegen bekommen mit der Benachrichtigung den Hinweis „Hattest du Auslagen? Hier melden“, der Einsatz ist dabei schon vorausgewählt.

## 5. Twinkey-Ablauf „Sonderstunden melden“
Neue Aufgabe in `tasks()`: **„Sonderstunden melden“**, mit dem Untertitel „Arbeit außerhalb des Stands: Kochen, Fahrten, zuhause“.

| Schritt | Frage | Eingabe |
|---|---|---|
| 1 | Für welchen Einsatz? | Auswahl aus 4.1 mit Termin-Status. Ist der Termin noch `OFFEN`, geht es mit „Ich würde helfen“ weiter. |
| 2 | An welchem Tag? | Vorschlag aus dem Anlass, sonst Kalender. Tage in der Zukunft sind nicht wählbar. |
| 3 | Von wann bis wann warst du dabei? | Zeitwahl wie im Schritt „can“, dazu die Pause |
| 4 | Wer war noch dabei? | „Nur ich“ oder Mehrfachauswahl aus der Personenliste (Suche wie bei „Von Kollegen übernehmen“). |
| 4a | Stunden je Kollege | Pro ausgewähltem Kollegen eine Zeile mit deinen Zeiten als Vorschlag, einzeln änderbar (von–bis, Pause). Die Summe pro Person steht direkt daneben. |
| 5 | Was hast du gemacht? | Auswahl: Kochen, Vorbereitung, Transport/Fahrt, Einkauf, Getränke mischen, Aufräumen |
| 6 | Bemerkung | optional |
| 7 | Bist du dafür gefahren? | Ja: Fahrt-Position (km) vorbereiten (siehe §3). Nein: weiter. Die Erstattung gilt nur für die eigene Fahrt, weil Auszahlungsweg und Konto persönlich sind. Mitgemeldete Fahrer bekommen mit der Benachrichtigung den Hinweis, ihre Fahrt selbst zu melden, mit vorausgefüllter Position. |
| 7a | Gab es weitere Auslagen? | Mehrfachauswahl: **Kaution, Parkgebühren, Kraftstoff, Sonstiges**. Für jede gewählte Art: **Betrag** in Euro, kurz „Wofür?“ und **„Bon/Quittung vorhanden?“** zum Anklicken (siehe §4.5). Das Feld „Wofür?“ ist bei Sonstiges Pflicht. |
| 8 | Passt das so? | Zusammenfassung aller Personen mit ihren Stunden **und aller Auslagen mit Summe**, dann der Knopf **„Dem Weihnachtsmarkt-Stundenkonto gutschreiben lassen“**. Darunter der Hinweis: „Die Stunden werden gutgeschrieben, sobald der Planer sie bestätigt hat.“ |
| 9 | Fertig | Die Stunden erscheinen unter „Meine erfassten Zeiten“ mit ihrem Status. Fahrt und Auslagen gehen als **ein** Erstattungsantrag mit Bezug zum Einsatz in den Büro-Eingangskorb und stehen unter „Meine Anträge“. |

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
| 2 | DP2 | Tabelle `kc_dp_hour_reports` mit RLS, Twinkey-Aufgabe „Sonderstunden melden“ inkl. Sammelmeldung mit Stunden je Kollege | DP2-F-SE-02 |
| 3 | DP2 | Eingang mit Sammelmeldungen, Bestätigen/Ablehnen (alle oder einzeln), Gutschrift als `self_report`, Nachtrag nach Abschluss, Warnung bei Doppelzeiten, Kontoauszug | DP2-F-SE-03 |
| 4 | DP2 | Personenregel „Z per Meldung“ (Getränke) | DP2-F-SE-04 |
| 5 | Club App | `dp2-club/daten.js`: Anlässe und Meldungen laden und speichern (neue Aktion `stunden_melden` in `kc-club`), Startseite mit Status, Benachrichtigung der mitgemeldeten Kollegen, vorausgefüllte km-Position in der vorhandenen Erstattung (landet im Eingangskorb) | CLUB-F-SE-05 |
| 5b | Club App | Weitere Auslagen: Positionsarten Kaution/Parken/Kraftstoff als Liste, `beleg_status` je Position, Kautionszustand und „Beleg ausstehend“ im Eingangskorb, Kraftstoff-Warnung, Einsatzbezug | CLUB-F-SE-06 |
| 6 | Kasse | nur lesen: Stempeluhr-Zeiten für die Doppelzeit-Warnung bereitstellen (kein Umbau) | — |

Jede Phase bekommt eine neue Build-/Versionsnummer (DP2 build248 ff., Club App 2.416.0 ff.) und durchläuft DEV → RC.

## 8. Tests und Definition of Done
- **Unit (DP2 `tools/test-*.mjs`):** Folgedatum +2 Tage, Statuswechsel, keine Gutschrift ohne Bestätigung, Verknüpfung mit dem Z-Dienst, Nachtrag nach `closePlan`, Doppelzeit-Warnung, Sammelmeldung erzeugt eine Zeile pro Person mit dem jeweils eigenen Stundenumfang, Doppelschutz bei überlappender Meldung.
- **Twinkey (`test-twinkey*.mjs`):** kompletter Ablauf, Termin `OFFEN` führt nur zu „Ich würde helfen“, Zukunftsdatum ist gesperrt.
- **RLS:** Fremde Meldungen sind nicht lesbar, Löschen ist unmöglich, nur der Planer bestätigt.
- **Club App (`tests/app-vertrag.test.mjs`):** Aufgabe sichtbar, Speichern landet in `kc_dp_hour_reports`, km-Vorbelegung korrekt, die abgeschickte Erstattung erscheint im Eingangskorb. Außerdem: Bei „kein Beleg“ ist die Begründung Pflicht; „Beleg auf Papier“ zeigt „Beleg ausstehend“; Kaution läuft von offen nach zurückerhalten; Kraftstoff plus km-Pauschale am selben Tag löst die Warnung aus; Summe aller Positionen stimmt; alte Anträge mit Fahrt, Einkauf und Sonstiges werden unverändert angezeigt.
- **DoD:** Der Kontoauszug zeigt bestätigte und offene Stunden getrennt. Das Audit ist vollständig. Es entstehen keine Kosten (vorhandenes Supabase, kein neuer Dienst). Es gibt keine Secrets im Browser. Die Doku ist aktualisiert.

## 9. Entscheidungen und offene Fragen
**Entschieden (Betreiber, 2026-10-15):**
- Ein Kollege meldet und wählt weitere Kollegen mit aus, jeweils mit eigenem Stundenumfang. Das geht über Twinkey in DP2 und in der Club App.
- Die Stunden bestätigt der Planer in DP2.
- Die km-Erstattung landet im Büro-Eingangskorb der Club App.
- Beim Sondereinsatz wird zusätzlich nach weiteren Auslagen gefragt (Kaution, Parkgebühren, Kraftstoff, Sonstiges), jeweils mit Betrag und „Bon/Quittung vorhanden“ zum Anklicken.

**Noch offen:**
1. **Was ist „SB“?** Angenommen ist hier die **Stempeluhr** an der Kasse bzw. im PC-Manager. Wenn ein anderes Programm gemeint ist, wird Phase 6 angepasst.
2. **Anrechnung 1:1?** Sollen Fahrtzeit und Zeit zuhause voll zählen oder mit einem Faktor bzw. einer Pauschale (z. B. Transport Dortmund → Hamm pauschal X Stunden)?
3. **Frist:** Bis wann nach dem Einsatz muss gemeldet werden?
4. **Kaution:** Wenn die Kaution zurückkommt, geht sie dann an den Club oder direkt an das Mitglied, das sie ausgelegt hat?
5. **Kraftstoff:** Darf jemand für dieselbe Fahrt km-Pauschale **und** Kraftstoff beantragen? Vorschlag: nein, nur eins von beiden.
