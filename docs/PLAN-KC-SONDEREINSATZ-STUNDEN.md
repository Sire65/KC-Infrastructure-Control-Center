# Konzept: Sonderstunden melden (Grünkohl Dortmund/Hamm, Getränke zuhause)

Feature-ID: **KICC-F-100** · Status: **IN UMSETZUNG**. Phase 1 ist als DP2 Build 254 fertig (Patch, siehe §10); die Betreiber-Entscheidungen stehen in §9. · Stand: 2026-10-15
Betroffene Programme: **KC DP2** (`dp3`, Build 253 → 254), **KC Club App** (`KC-Clubapp`, 2.415.0), **Supabase** („SB“: neue Tabellen, Fristen-Erinnerung), Stempeluhr im **PC-Manager/Kasse** (`Kasse`, nur Prüfung auf Doppelzeiten)

## 1. Anlass
1. Mehrere Kollegen kochen Grünkohl in einem Krankenhaus in Dortmund. **Termin (vorläufig geplant, Betreiber 2026-10-15, korrigiert): Samstag, 28.11.2026**, vorgesehen Willfried Wittwer, Steven Linley, Manfred Schoppmann. **Abholung: Dienstag, 29.12.2026** (eigener Termin, kein Folge-Einsatz), vorgesehen Frank Brösel, Willfried Wittwer. Der Stundenumfang ist noch offen.
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

**Sondertag im Dienstplan (geändert bei der Umsetzung von Phase 1):** Die festen Tage `K.days` (Vorbereitung, Markttage, Nachbereitung) werden an **85 Stellen in 22 Dateien** ausgewertet, z. B. Bedarf, Matrix, Radar, Druck und Wunschplan. Ein neuer Tagestyp würde dort Standbedarf und Anzeigen verändern (Regel 1). Deshalb bleiben Sondereinsätze in Phase 1 **getrennt von `K.days`**. Ihre Termine werden aus der eigenen Liste berechnet. Ob ein Sondertag für die Dienstplanung (Dienste und Bereitschaft am Kochtag) überhaupt gebraucht wird, entscheidet sich in Phase 2. Für das Melden der Stunden ist er nicht nötig. Solange der Termin `OFFEN` ist, kann man in Twinkey nur **„Ich würde helfen“** melden (eine Bereitschaft, keine Stunden).

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
**Pflicht (Betreiber, 2026-10-15): Die Stunden müssen hinterher auf dem Kontoauszug der Person erscheinen.** Umgesetzt in Build 255 (siehe §10).
- Kontoauszug und Personenstunden zählen **nur bestätigte** Meldungen. Sie stehen in der Z-Dienst-Spalte und in einer eigenen Zeile „Sondereinsätze“ mit der Quelle „Meldung“.
- **Gemeldete, noch offene Stunden** stehen getrennt und deutlich markiert („gemeldet, noch nicht bestätigt“) und **zählen nicht zur Summe**.
- In der Club App erscheint unter „was du gearbeitet hast“ (`kc-club/index.ts`, liest heute nur `kc_dp_timeclock_actuals`) zusätzlich die Meldung mit ihrem Status.

### 4.5 Weitere Auslagen beim Sondereinsatz (Club App, vorhandene Erstattung)
Fahrt und weitere Auslagen werden **ein** Erstattungsantrag in `kc_club_erstattung`. Er landet wie jeder andere im **Büro-Eingangskorb**. Es gibt keine neue Tabelle und keinen eigenen Weg; die vorhandenen Positionsarten bleiben unverändert (Regel 1).

**Neue Positionsarten.** Sie liegen in einer Liste, die der Admin pflegt, und sind nicht im Code fest verdrahtet (Regel 4):

| Art | Felder | Besonderheit |
|---|---|---|
| `kaution` | Betrag, wofür (z. B. „Thermoboxen“, „Tiefkühler Hamm“), an wen | Eine Kaution kommt in der Regel zurück. Im Eingangskorb hat sie einen eigenen Zustand: **„Kaution offen“** → **„Kaution zurückerhalten“**. **Wohin sie zurückgeht** (Betreiber, 2026-10-15): Hat das Mitglied die Kaution aus eigenem Geld bezahlt, geht sie **an das Mitglied** zurück. Sie wird dann nicht erstattet, sondern nur festgehalten. Erst wenn sie nicht zurückkommt, wird daraus ein Erstattungsfall. Wurde sie aus einem **Vorschuss des Clubs** bezahlt, geht sie **an den Club** zurück. Der Kassenwart klickt dann „Kaution beim Club eingegangen“ an. |
| `parken` | Betrag, Ort | — |
| `kraftstoff` | Betrag, Liter (freiwillig), Fahrzeug | **Mit dem eigenen Auto gibt es nur die km-Pauschale** (Betreiber, 2026-10-15). Kraftstoff ist dann für diese Fahrt nicht wählbar. Kraftstoff gibt es nur für ein Fahrzeug ohne km-Pauschale, also ein Miet- oder Clubfahrzeug; das Fahrzeug wird dafür aus einer Auswahl gewählt. |
| `sonstiges` (vorhanden) | Betrag, wofür (Pflicht) | — |

**Vorschuss.** Die Erstattung fragt: „Hast du für diesen Einsatz einen Vorschuss vom Club erhalten?“ Bei Ja gibt man den Betrag ein. Der Eingangskorb rechnet dann: Summe der Auslagen − Vorschuss = Auszahlung an das Mitglied oder Rückzahlung an den Club. Eine Kaution, die aus dem Vorschuss bezahlt wurde, wird automatisch dem Club zugeordnet (siehe oben).

**Bon/Quittung vorhanden** zum Anklicken, je Position. Neues Feld `beleg_status`:
- 📷 **„Ja, fotografiert“**: Foto oder PDF wie heute (bis zu 5).
- 🧾 **„Ja, liegt mir auf Papier vor“**: wird im Büro abgegeben. Im Eingangskorb steht dann **„Beleg ausstehend“**, bis die Clubleitung „Beleg erhalten“ anklickt.
- ❌ **„Nein, kein Beleg“**: Das Feld Begründung wird Pflicht (z. B. „Parkautomat ohne Quittung“). Der Antrag wird im Eingangskorb als **Eigenbeleg** markiert.

**Bezug zum Einsatz.** Jede Position bekommt `special_event_id` und `hour_report_sammel_id`. Damit sieht der Kassenwart im Eingangskorb, zu welchem Einsatz die Auslage gehört (z. B. „Grünkohl abholen Dortmund → Hamm“), und kann alle Kosten eines Einsatzes zusammen ansehen.

**Nur eigene Auslagen.** Auslagen meldet jeder für sich selbst, weil Konto und Auszahlungsweg persönlich sind. Mitgemeldete Kollegen bekommen mit der Benachrichtigung den Hinweis „Hattest du Auslagen? Hier melden“, der Einsatz ist dabei schon vorausgewählt.

## 5. Twinkey-Ablauf „Sonderstunden melden“
Neue Aufgabe in `tasks()`: **„Sonderstunden melden“**, mit dem Untertitel „Arbeit außerhalb des Stands: Kochen, Fahrten, zuhause“.

| Schritt | Frage | Eingabe |
|---|---|---|
| 1 | Für welchen Einsatz? | Auswahl aus 4.1 mit Termin-Status. Ist der Termin noch `OFFEN`, geht es mit „Ich würde helfen“ weiter. |
| 2 | An welchem Tag? | Vorschlag aus dem Anlass, sonst Kalender. Tage in der Zukunft sind nicht wählbar. |
| 3 | Wann bist du zuhause losgefahren, und wann warst du wieder zuhause? | Zeitwahl wie im Schritt „can“, dazu die Pause. **Die Fahrzeit von zuhause bis zuhause zählt voll mit** (Betreiber, 2026-10-15). Twinkey sagt das ausdrücklich dazu. |
| 4 | Wer war noch dabei? | „Nur ich“ oder Mehrfachauswahl aus der Personenliste (Suche wie bei „Von Kollegen übernehmen“). |
| 4a | Stunden je Kollege | Pro ausgewähltem Kollegen eine Zeile mit deinen Zeiten als Vorschlag, einzeln änderbar (von–bis, Pause). Die Summe pro Person steht direkt daneben. |
| 5 | Was hast du gemacht? | Auswahl: Kochen, Vorbereitung, Transport/Fahrt, Einkauf, Getränke mischen, Aufräumen |
| 6 | Bemerkung | optional |
| 7 | Bist du dafür gefahren? | Ja: Fahrt-Position (km) vorbereiten (siehe §3). Nein: weiter. Die Erstattung gilt nur für die eigene Fahrt, weil Auszahlungsweg und Konto persönlich sind. Mitgemeldete Fahrer bekommen mit der Benachrichtigung den Hinweis, ihre Fahrt selbst zu melden, mit vorausgefüllter Position. |
| 7a | Gab es weitere Auslagen? | Mehrfachauswahl: **Kaution, Parkgebühren, Kraftstoff, Sonstiges**. Für jede gewählte Art: **Betrag** in Euro, kurz „Wofür?“ und **„Bon/Quittung vorhanden?“** zum Anklicken (siehe §4.5). Das Feld „Wofür?“ ist bei Sonstiges Pflicht. |
| 8 | Passt das so? | Zusammenfassung aller Personen mit ihren Stunden **und aller Auslagen mit Summe**, dann der Knopf **„Dem Weihnachtsmarkt-Stundenkonto gutschreiben lassen“**. Darunter der Hinweis: „Die Stunden werden gutgeschrieben, sobald der Planer sie bestätigt hat.“ |
| 9 | Fertig | Die Stunden erscheinen unter „Meine erfassten Zeiten“ mit ihrem Status. Fahrt und Auslagen gehen als **ein** Erstattungsantrag mit Bezug zum Einsatz in den Büro-Eingangskorb und stehen unter „Meine Anträge“. |

Für die Sprachausgabe kommen neue Text-Schlüssel in `assets/twinkey/audio/texts.json`. Fehlt eine WAV-Datei, nutzt Twinkey die Gerätestimme; dieser Rückfall ist schon vorhanden.

### 4.6 Fahrgemeinschaften (vorrangig)
Der Betreiber hat am 2026-10-15 festgelegt, dass vorrangig Fahrgemeinschaften gebildet werden.
- **Bei der Zusage** (Twinkey „Ich würde helfen“ bzw. Wunsch für den Sondertag) kommt eine Frage dazu: **„Wie kommst du hin?“** Antworten: *Ich fahre und kann __ Personen mitnehmen* · *Ich brauche eine Mitfahrgelegenheit* · *Ich komme anders hin*. Dazu kommt der **Startort**, aber nur der Ort, z. B. Hamm oder Werne, ausgewählt statt frei eingetippt. Es werden keine Adressen gespeichert.
- **Planer in DP2:** Sobald der Termin `FEST` ist, schlägt DP2 Fahrgemeinschaften vor. Fahrer und Mitfahrer mit gleichem Startort kommen zusammen, bis die Plätze voll sind. Der Planer bestätigt oder verschiebt die Zuordnung. Die Beteiligten sehen ihre Fahrgemeinschaft in Twinkey und in der Club App, also wer fährt und wer mitfährt.
- **Bei der Meldung:** In der Sammelmeldung wird jede Person als **Fahrer** oder **Mitfahrer** markiert. Das ist aus der geplanten Fahrgemeinschaft vorausgefüllt. Die km-Pauschale ist **nur für Fahrer** wählbar. Melden mehrere Personen derselben Fahrgemeinschaft km für dieselbe Fahrt, fragt die App nach dem Grund, und im Eingangskorb wird der Fall markiert („Fahrgemeinschaft geprüft?“).
- Die Fahrzeit zählt für **Fahrer und Mitfahrer** gleich (zuhause bis zuhause).

### 4.7 Meldefrist 3 Tage und Erinnerung
Der Betreiber hat am 2026-10-15 eine Frist von spätestens 3 Tagen festgelegt.
- Die Frist beginnt am Einsatztag. **Spätestens 3 Tage danach** soll gemeldet sein. Twinkey zeigt beim Melden die Restzeit an („noch 2 Tage“).
- **Erinnerung:** Liegt für einen eingeplanten Teilnehmer am Ende des 3. Tages keine Meldung vor, weder eigene noch Sammelmeldung, bekommt er eine **Erinnerung**. Sie geht über die vorhandenen Kanäle (Club-App-Push bzw. DP2-Benachrichtigung, `K.notifications`) und enthält einen Knopf, der direkt in „Sonderstunden melden“ führt, der Einsatz ist schon vorausgewählt.
- Ausgelöst wird sie täglich durch einen Supabase-Zeitplan (`pg_cron`, wie bei den vorhandenen Backups). Es gibt keinen neuen Dienst und keine Kosten. Pro Person und Einsatz wird höchstens einmal erinnert; danach sieht der Planer die Person in der Liste „Meldung fehlt“.
- **Spätere Meldungen bleiben möglich.** Sie werden als „verspätet“ markiert, aber nicht gesperrt. Die Entscheidung trifft der Planer.

### 4.8 Sprachbefehl in der Club App (optional, nicht beauftragt)
Die Club App hat eine Sprachsteuerung. Im Code heißt sie `SB` (`SB_ZIELE`, `SB_BEFEHLE` in `app.js`). Ein neues Ziel **„Sonderstunden melden“** kommt in diese Liste, Beispielsätze: „Stunden melden“, „Grünkohl Stunden eintragen“, „Auslagen für Grünkohl“. Der Befehl öffnet den Twinkey-Ablauf, der Einsatz ist vorausgewählt, wenn er genannt wurde. Er erscheint auch in der Liste aller Sprachbefehle und im Sprach-Training.

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
| 1 | DP2 | Tabelle `kc_dp_special_events`, Planer-Pflege, automatisches Folgedatum, wiederkehrend an Markttagen. **Fertig als Build 254**, ohne Tagestyp `special` (siehe 4.1). | DP2-F-SE-01 |
| 2 | DP2 | Tabelle `kc_dp_hour_reports` mit RLS, Twinkey-Aufgabe „Sonderstunden melden“ inkl. Sammelmeldung mit Stunden je Kollege | DP2-F-SE-02 |
| 3 | DP2 | Eingang mit Sammelmeldungen, Bestätigen/Ablehnen (alle oder einzeln), Gutschrift als `self_report`, Nachtrag nach Abschluss, Warnung bei Doppelzeiten, Kontoauszug | DP2-F-SE-03 |
| 4 | DP2 | Personenregel „Z per Meldung“ (Getränke) | DP2-F-SE-04 |
| 5 | Club App | `dp2-club/daten.js`: Anlässe und Meldungen laden und speichern (neue Aktion `stunden_melden` in `kc-club`), Startseite mit Status, Benachrichtigung der mitgemeldeten Kollegen, vorausgefüllte km-Position in der vorhandenen Erstattung (landet im Eingangskorb) | CLUB-F-SE-05 |
| 5b | Club App | Weitere Auslagen: Positionsarten Kaution/Parken/Kraftstoff als Liste, `beleg_status` je Position, Kautionszustand und „Beleg ausstehend“ im Eingangskorb, Kraftstoff-Warnung, Einsatzbezug | CLUB-F-SE-06 |
| 6 | Kasse | nur lesen: Stempeluhr-Zeiten für die Doppelzeit-Warnung bereitstellen (kein Umbau) | — |
| 7 | DP2 + Club App | Fahrgemeinschaften: Abfrage bei der Zusage, Vorschlag im Planer, Fahrer/Mitfahrer in der Meldung, km nur für Fahrer | DP2-F-SE-07 |
| 8 | Supabase + Club App | Meldefrist 3 Tage, tägliche Erinnerung per `pg_cron`, Liste „Meldung fehlt“, Kennzeichen „verspätet“ | DP2-F-SE-08 |
| 9 | Club App | Vorschuss-Verrechnung und Kaution-Zuordnung (Mitglied oder Club) im Eingangskorb | CLUB-F-SE-09 |
| 10 | Club App | Sprachbefehl „Sonderstunden melden“ (`SB_ZIELE`), optional | CLUB-F-SE-10 |

Jede Phase bekommt eine neue Build-/Versionsnummer (DP2 build248 ff., Club App 2.416.0 ff.) und durchläuft DEV → RC.

## 8. Tests und Definition of Done
- **Fahrgemeinschaft/Frist/Vorschuss:** km nur für Fahrer, Rückfrage bei mehreren Fahrern derselben Fahrgemeinschaft, Erinnerung genau einmal nach Tag 3 und nicht, wenn eine Sammelmeldung die Person schon enthält, Kennzeichen „verspätet“, Vorschuss-Verrechnung, Kaution aus Vorschuss geht an den Club, Kraftstoff ist beim eigenen Auto gesperrt, Sprachbefehl öffnet den Ablauf.
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

- Die Fahrzeit von zuhause bis zuhause zählt voll mit.
- Vorrangig werden Fahrgemeinschaften gebildet (§4.6).
- Meldefrist spätestens 3 Tage, sonst Erinnerung (§4.7).
- Eine Kaution geht an das Mitglied zurück, außer sie wurde aus einem Club-Vorschuss bezahlt; dann geht sie an den Club (§4.5).
- Mit dem eigenen Auto gibt es nur die km-Pauschale, keinen Kraftstoff (§4.5).

**„SB“ = Supabase** (vom Betreiber am 2026-10-15 bestätigt). Im Code steht es so in kc-start/Verwaltung (`<b>SB</b>`, `'Supabase ' → 'SB '`). Achtung: In der Club App heißen die Sprachbefehle intern ebenfalls `SB`; damit ist hier nichts gemeint.

**Noch offen:** keine.

## 10. Umsetzungsstand
**Phase 1, DP2 Build 254 (DP2-F-SE-01), fertig und getestet:**
- `src/core/special-events.js`: Sondereinsätze mit Termin `OFFEN`/`GEPLANT`/`FEST` und Folge-Einsätzen (das Datum wird aus dem Vorgänger berechnet, auch über Monatswechsel und mehrere Stufen). Wiederkehrend an Markttagen. Prüfregeln: Zyklus, ungültiges Datum, Abstand 0–60 Tage; Beenden nur mit Grund und erst, wenn keine Folge-Einsätze mehr daran hängen. Dazu Audit, Sync-Eintrag und Rechte (`roster.plan.edit` zum Bearbeiten, `roster.plan.publish` zum Veröffentlichen).
- `src/ui/special-events-ui.js`: Planer-Dialog, im Register Sollplan unter Menü **„★ Sondereinsätze“**.
- Supabase: Tabelle `kc_dp_special_events` und Funktion `kc_dp_special_events_publish`. RLS ist an; lesen dürfen DP2-Mitglieder, schreiben nur Planerrollen; anon ist gesperrt.
- Gespeichert wird im verschlüsselten lokalen Stand (`specialEvents`). `K.days` bleibt unverändert.
- Tests: `tools/test-special-events.mjs` (in `npm test`), erweiterter Supabase-Sicherheitsvertrag, Release-Prüfung (296 Dateien), TÜV-Syntax (219 Dateien). Alle vorhandenen Smoke-Tests sind grün. Der Dialog wurde im Browser geprüft (Handybreite, anlegen, Folge-Einsatz, Termin festlegen, veröffentlichen).
- **Auslieferung:** `docs/patches/dp3-build254-sondereinsaetze.patch`. Er wurde gegen dp3 `main` (Build 253) mit `git am` geprüft. Diese Sitzung hatte keinen Schreibzugriff auf dp3, deshalb liegt Build 254 nur als Patch vor.
- **Noch nicht ausgeführt:** Die Migration ist nicht in die produktive Supabase eingespielt. Das geschieht erst bei der Freigabe von Build 254.

**DP2 Build 255, Sonderstunden im Personenkonto (Pflicht laut §4.4), fertig und getestet:**
- **Bestätigte** Sonderstunden (Ist-Zeit mit Quelle `self_report` bzw. `specialEventId`) erscheinen im persönlichen Kontoauszug als eigene Zeile mit **„★ Einsatzname“**. In der Buchungsspalte steht die Quelle „Meldung“. Sie zählen zu „Ist geprüft“ und zu den Gesamtstunden; zusätzlich gibt es die Summe **„davon Sondereinsätze“**.
- **Gemeldete, noch offene** Stunden (`K.hourReports`, Status `gemeldet`) stehen in derselben Zeile kursiv und orange als „gemeldet, noch nicht bestätigt“. Am Datum steht „Meldung offen“, in der Zusammenfassung ein eigenes Feld **„nicht in der Summe“**.
- Der **Zeitraum** reicht standardmäßig von der Vorbereitung bis zum letzten Sondereinsatz bzw. zur letzten Meldung. Ein Kochtag im Januar ist also automatisch im Kontoauszug enthalten.
- Twinkey **„Meine erfassten Zeiten“** (DP2 und Club App) zeigt offene Meldungen markiert und den Einsatznamen.
- Tests: `tools/test-person-account-special.mjs` (in `npm test`). Smoke, Release (Build 255) und TÜV-Syntax sind grün, ebenso die Browsertests `test-twinkey`, `test-mobile-wish-matrix`, `test-wish-assistant` und `test-assistant-staffing` (mit Chromium statt Chrome). `test-twinkey-admin` und `test-twinkey-local-entry` scheitern hier auch ohne die Änderung, weil sie einen lokalen Testserver brauchen. Druckbild des Kontoauszugs im Browser geprüft.
- **Auslieferung:** `docs/patches/dp3-build255-personenkonto-sonderstunden.patch`. Er setzt auf Build 254 auf; beide wurden zusammen gegen dp3 `main` geprüft.
- **Offener Punkt:** Die Tabelle **Personenstunden** in der Stundenmatrix (`person-hours-block.js`) rechnet nur über die Markttage. Sonderstunden an Tagen außerhalb, z. B. im Januar, stehen deshalb im Kontoauszug, aber nicht in dieser Tabelle. Das wird in Phase 3 entschieden.
- Die Datenquelle `K.hourReports` und das Bestätigen, das daraus Ist-Zeiten erzeugt, kommen in Phase 2 und 3. Der Kontoauszug ist dafür schon vorbereitet.

**Wichtiger Befund zur Codebasis (2026-10-15):** Die aktuelle DP2-Linie ist **nicht** `main` (Build 253), sondern `codex/club-app-interface` (Build 282 RC, PR #5). Von dort übernimmt die Club App ihre DP2-Dateien. Die Arbeit wurde deshalb auf diese Linie gesetzt: Die Builds 254/255 der Patches oben heißen dort **283/284**. Die Patch-Dateien in `docs/patches/` sind damit überholt; maßgeblich sind die Branches.

**Phase 2: Stundenmeldung mit Sammelmeldung, fertig und getestet**
- **dp3**, Branch `claude/stundenerfassung-gruenkohl-ywgljy` auf `codex/club-app-interface`:
  - **Build 283:** Sondereinsätze.
  - **Build 284:** Personenkonto.
  - **Build 285:** Twinkey „Sonderstunden melden“ mit `core/hour-reports.js` und den Supabase-Objekten `kc_dp_hour_reports`, `kc_dp_hour_reports_pending` und `kc_dp_hour_report_decide`.
  - **Build 286:** In der Kollegenauswahl stehen nur Mitglieder.
  - Tests: Alle Smoke-Tests und alle 17 Browsertests sind grün (darunter neu `test-twinkey-hours`). Die Migrationen wurden lokal in PostgreSQL 16 mit nachgebildeten Supabase-Rollen geprüft: Rechte, „nur Planer“, Ablehnung nur mit Grund, Schutz vor doppelter Entscheidung (stale), 16-Stunden-Grenze.
- **KC-Clubapp**, Branch `claude/stundenerfassung-gruenkohl-ywgljy`, **2.417.0**:
  - DP2 Build 286 unverändert übernommen.
  - `kc-club`: `dienstwunsch_laden` liefert zusätzlich Einsätze, Meldungen und Mitglieder; neue Aktion `stunden_melden` mit Serverprüfung und Doppelschutz.
  - `dp2-club/daten.js` gibt die Daten an Twinkey weiter und schickt Meldungen über `kc-club`.
  - Der Vertragstest ist erweitert. Ein Ende-zu-Ende-Test der echten Dienstwunsch-Seite (mit nachgebildetem Server) besteht.
- **Reihenfolge beim Ausrollen:**
  1. Die beiden Migrationen aus dp3 einspielen.
  2. `kc-club` deployen.
  3. Club App 2.417.0 und DP2 ausrollen.
- **Offen aus dem Konzept:** Benachrichtigung der mitgemeldeten Kollegen (Push) sowie Fahrer/Mitfahrer bei der Meldung. Beides kommt mit Phase 5/7.

**Phase 3: Planer-Eingang, fertig und getestet** (dp3 **Build 287**, Club App 2.417.0 mit DP2 Build 287)
- Der Planer öffnet im Register Ist das Menü **„★ Sonderstunden-Eingang“**; der Weg geht auch über „★ Sondereinsätze“. Dort holt er die Club-App-Meldungen ab. Er sieht die Sammelmeldungen mit Summe, Bemerkung, „verspätet“ und Hinweisen, z. B. wenn sich die Zeit mit der Stempeluhr überschneidet.
- **Bestätigen**, einzeln oder alle: Zuerst wird in Supabase entschieden (Schutz vor doppelter Entscheidung). Danach bucht der vorhandene Ist-Kern die Zeit (`K.actual.saveActual`, Quelle `self_report`, Zone „Z · Einsatz“). Damit steht sie im **Kontoauszug mit ★** und in „davon Sondereinsätze“. Am selben Tag geplante Z-Dienste (Getränke) werden automatisch verknüpft.
- **Ablehnen** geht nur mit Grund. Es entsteht keine Ist-Zeit, und im Kontoauszug erscheint nichts.
- **Istplan abgeschlossen:** Der Nachtrag läuft über den vorhandenen Ablauf „wieder öffnen“, mit Begründung.
- **Recht:** `roster.actual.import` (Planer, Zeitprüfer, Admin). Bestätigte Meldungen gelten wie Stempeluhr-Zeiten als Import. Korrekturen brauchen weiter `roster.actual.correct`.
- **Tests:** `test-hour-reports-decide` und `test-hour-reports-ui` sind neu. Alle Smoke-Tests und alle 18 Browsertests sind grün, die Club-App-Vertragstests ebenso. Der Ende-zu-Ende-Test der Club App besteht erneut.

**Phase 4, 5, 7, 8 und 9: fertig und getestet** (dp3 **Build 288/289**, Club App **2.419.0**)
- **Build 288:**
  - Z-Dienst „Meldung ausstehend“: Für die Getränke-Kollegin ist ein Z-Dienst geplant. Solange keine Meldung bestätigt ist, wird er sichtbar als offen markiert und nie als OK.
  - Die Personenstunden enthalten jetzt auch die Tage der Sondereinsätze. Damit ist der offene Punkt aus Build 255 erledigt.
- **Build 289:**
  - Zusagen mit Anreise: „ich fahre“ mit freien Plätzen, „brauche Mitfahrt“ oder „komme selbst“. Als Startort wird nur ein Ort gewählt, keine Adresse.
  - DP2 schlägt Fahrgemeinschaften vor (gleicher Startort zuerst, keine Überbuchung). Der Planer übernimmt und veröffentlicht sie.
  - Die Fahrtrolle wird in der Meldung vorbelegt.
  - Über „🚗 Fahrtkosten / Auslagen erfassen“ öffnet sich die Erstattung der Club App vorausgefüllt.
- **Club App 2.419.0:** Die Versionsnummer 2.418.0 war parallel für die Startseiten-Vorschläge vergeben.
  - Push an mitgemeldete Kollegen.
  - Nachricht, wenn der Planer bestätigt oder ablehnt.
  - Erinnerung 3 Tage nach dem Einsatz: einmal, zwischen 9 und 20 Uhr, an alle, die zugesagt, aber nicht gemeldet haben.
  - Neue Erstattungsarten: Parken, Kraftstoff (nur für Miet- oder Clubfahrzeuge) und Kaution. Die Kaution zählt nicht zur Summe und geht ans Mitglied zurück; aus dem Vorschuss bezahlt geht sie an den Club.
  - „Bon/Quittung vorhanden“ je Position.
  - Vorschuss.
  - Hinweis an den Kassenwart, wenn ein Mitfahrer km abrechnet.
  - Büro-Eingangskorb „Nachverfolgen“ für Kautionen und Papierbelege.

**Ausrollen (2026-10-15):**
- **Supabase:** eingespielt und geprüft.
  - 5 Tabellen, alle mit RLS: `kc_dp_special_events`, `kc_dp_hour_reports`, `kc_dp_special_event_signups`, `kc_dp_carpools`, `kc_dp_hour_report_reminders`.
  - 5 Funktionen.
  - Datenvertrag `stunden_eingang` und `sondereinsatz_zusagen`.
  - Spiegel- und Resume-Regeln.
  - Spalte `kc_club_erstattung.vorschuss`.
- **PRs:**
  - Sire65/KC-Clubapp#38 (nach `main`): CI ist grün. Mit dem Merge wird `kc-club` 2.419.0 deployt.
  - Sire65/dp3#6 (nach `codex/club-app-interface`).
- **Hinweise:**
  - Die Edge Function ist nur per Syntaxprüfung kontrolliert, Deno läuft nicht lokal. Nach dem Deploy die Aktion `version` prüfen.
  - Mit der Club-App-Übernahme kommen auch die fremden RC-Builds 269–282 aus `codex/club-app-interface` mit.

**Build 290 / Club App 2.420.0: vorläufige Einteilung (DP2-F-SE-08)**
- Sondereinsätze haben jetzt das Feld **vorgesehen**. Eingetragen werden dürfen nur aktive Mitglieder. Die Vorgesehenen sehen in Twinkey „Du bist vorgesehen (vorläufig)“. Beim Melden sind sie schon als Kollegen ausgewählt. Nach Ablauf der Meldefrist werden sie wie Zugesagte erinnert, aber nur bei festem Termin.
- **Abgleich:** DP2 liest den veröffentlichten Stand aus Supabase. Das geschieht beim Öffnen von „★ Sondereinsätze“ und vor jedem Veröffentlichen. So gehen Einsätze, die direkt in Supabase eingetragen wurden, nicht verloren.
- **Eingetragen am 2026-10-15** (`kc_dp_special_events`, Status GEPLANT):
  - `SE-GK-2026-KOCHEN`: Grünkohl kochen am 28.11.2026, Krankenhaus Dortmund.
  - `SE-GK-2026-ABHOLUNG`: Grünkohl abholen und einlagern am 29.12.2026, Dortmund → Tiefkühler Hamm.
- **Wenn der Termin feststeht:** In DP2 auf „Termin fest“ stellen und veröffentlichen. Erst dann gilt die Meldefrist mit Erinnerung, und das Datum ist bei der Stundenmeldung fest vorgegeben.
