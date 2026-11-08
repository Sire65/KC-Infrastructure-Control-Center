# Konzept: Club-Magazin „Club-Küche“ für die Club-App

Feature-ID: **wird bei Aufnahme in der Club-App vergeben** · Status: **KONZEPT** (nicht freigegeben, nicht veröffentlicht, nichts umgesetzt) · Stand: 2026-11-08 (Profi-Check und Rätsel-Ecke ergänzt, Abschnitte 10–12)

Betrifft: Club-App (`KC-Clubapp`). Dieses Dokument liegt im KICC-Repository nur als Ideenablage.

## 1. Idee
Ein Newsletter in der Club-App, aufgebaut wie eine Zeitschrift: Titelbild, Inhaltsverzeichnis, Rubriken. Über die Infozeile wird immer ein Thema angezeigt (z. B. „Neues Kuchenrezept“); ein Tipp öffnet den Artikel oder einen Link.

## 2. Bewertung
| Idee | Nutzen | Entscheidung |
|---|---|---|
| Rezepte, Backen, Küchentipps von Mitgliedern | hoch – passt zum Köcheclub, gibt es sonst nirgends, stärkt die Gemeinschaft | **aufnehmen** |
| Saisonkalender | hoch – einmal anlegen, kehrt jedes Jahr wieder | **aufnehmen** |
| Klickbare Infozeile mit Club-Bezug | hoch | **aufnehmen** |
| Garten, Heimwerken, Stricken/Häkeln | mittel – nur, wenn ein Mitglied dafür schreibt | **später, bei Bedarf** |
| Stündliche Tagesnachrichten als Schlagzeilen | gering – haben Mitglieder schon überall; überdeckt Club-Meldungen | **nicht vorgesehen**, höchstens abschaltbar und standardmäßig aus |
| Medizin | gering bis riskant – Haftung bei falschen oder veralteten Inhalten | **nur Links** auf seriöse Quellen (z. B. gesund.bund.de), keine eigenen Texte |
| Mode | gering, kein Club-Bezug | **nicht vorgesehen** |
| Wetter für Werne (1× täglich) | mittel – passt zu Kochen/Grillen, ohne Pflege | **optional** |

Grundsatz: **von Mitgliedern für Mitglieder.** Ein Magazin, das veraltet aussieht, schadet mehr als es nützt – deshalb lieber eine Ausgabe im Monat als tägliche Inhalte.

## 3. Aufbau
**Ausgabe** (monatlich, z. B. „Ausgabe November 2026“): Titelbild, Inhaltsverzeichnis, Artikel je Rubrik. Ältere Ausgaben bleiben im Archiv.

| Rubrik | Inhalt | Quelle |
|---|---|---|
| 🍲 Rezept des Monats | Rezept eines Mitglieds mit Foto | Einreichung |
| 🎂 Backstube | Kuchen, Plätzchen (vor Weihnachten besonders) | Einreichung |
| 🥕 Saisonkalender | Was gerade frisch ist | Redaktion, wiederkehrend |
| 👨‍🍳 Küchentipp | Kurzer Kniff | Einreichung oder Twinkey |
| 📸 Rückblick | Bilder vom letzten Treffen | Fotoalbum |
| 🙋 Mitglied im Porträt | Kurzes Interview | Redaktion |
| 🧶 Hobbyecke | Garten, Heimwerken, Handarbeit | Einreichung (nur wenn vorhanden) |
| 🔗 Linktipps | Ausgesuchte Links nach außen | Redaktion |
| 🧩 Rätsel-Ecke | Fehlerbild, Kreuzworträtsel mit Lösungswort (siehe Abschnitt 11) | Redaktion, Vorrat |

Artikelfelder (Auswahl statt Freitext, wo möglich): Rubrik, Titel, Bild, Text **oder** externer Link, Autor (Mitglied), bei Rezepten zusätzlich Zutaten, Schritte, Zeit (Auswahl), Schwierigkeit (Auswahl), Portionen.

## 4. Ablauf: Einreichen → Freigabe → Ausgabe
1. Mitglied reicht über ein Formular ein (Rezept + Foto, Rubrik per Auswahl).
2. Redaktionsrolle prüft, korrigiert, gibt frei oder lehnt mit Begründung ab.
3. Freigegebene Artikel landen im Vorrat und werden einer Ausgabe zugeordnet.
4. Ausgabe wird zu einem festen Datum veröffentlicht; die Infozeile kündigt die neuen Artikel an.
5. Lücken füllt der Vorrat an zeitlosen Inhalten (Saisonkalender, Grundrezepte).

## 5. Infozeile
- Wechselnde Einträge, jeder ist antippbar: öffnet Artikel in der App oder einen externen Link (externe Links deutlich als solche gekennzeichnet).
- Beispiele: „🎂 Neu im Magazin: Omas Apfelkuchen“, „📅 Nächstes Treffen: Donnerstag 18 Uhr“, „🥕 Jetzt Saison: Kürbis“, „🎄 Noch 5 Tage: Wunschdienst eintragen“.
- **Vorrang:** wichtige Club-Meldungen und Termine vor Magazin-Hinweisen, Magazin vor optionalen Zusätzen (Wetter).
- Abgelaufene Einträge (z. B. vergangener Termin) werden automatisch entfernt.

## 6. Regeln
- **Urheberrecht:** keine fremden Rezepte oder Texte kopieren; fremde Inhalte nur verlinken. Fotos nur mit Einverständnis der abgebildeten Personen.
- **Zero-Cost:** nur eigene Inhalte und Links; keine kostenpflichtigen Dienste oder Feeds.
- **Vorhandenes nutzen:** auf bestehende Club-App-Funktionen aufbauen (Neuigkeiten, Themen, Archiv, Fotoalbum, Vorlesen, Twinkey) statt ein paralleles System zu bauen. Vorlesen kann Rezepte vorlesen, Twinkey kann z. B. „Was koche ich mit Kürbis?“ beantworten.
- **Nur Mitgliederbereich:** Inhalte sind nur für angemeldete Mitglieder sichtbar.

## 7. Vorgeschlagener Start (Stufe 1)
Rezept des Monats, Backstube, Saisonkalender, klickbare Infozeile. Nach zwei bis drei Ausgaben über das Feedback abfragen, was gelesen wird; weitere Rubriken erst aufnehmen, wenn sich Mitglieder finden, die dafür schreiben.

## 8. Definition of Done (für die spätere Umsetzung)
- Einreichen, Freigeben und Veröffentlichen einer Ausgabe funktioniert Ende-zu-Ende.
- Infozeile zeigt Einträge nach Vorrang, Tipp öffnet Artikel bzw. Link.
- Einfache Ansicht und große Schrift werden unterstützt; Vorlesen funktioniert für Artikel.
- Tests für Ablauf und Infozeilen-Vorrang; Zero-Cost-Check bestanden.

## 9. Offene Fragen
- Wer übernimmt die Redaktionsrolle?
- Erscheinungstag der Ausgabe (z. B. jeweils am 1. des Monats)?
- Sollen Schlagzeilen/Wetter überhaupt angeboten werden?

## 10. Profi-Check: Kann das Magazin mit Kiosk-Zeitschriften mithalten? (2026-11-08)
Geprüft wurde dieses Konzept. Die bereits gebaute Club-App (`KC-Clubapp`) war in der Prüfsitzung nicht zugänglich – ob dort schon etwas umgesetzt ist, ist **nicht geprüft (UNKNOWN)**.

**Gesamturteil:** Inhaltlich eine gute Grundlage (klare Rubriken, Redaktionsablauf, Archiv, monatlicher Rhythmus, Urheberrecht geregelt). Damit es sich wie eine *Zeitschrift* anfühlt und nicht wie eine Linksammlung, fehlen vor allem **Heftdramaturgie, ein Schwerpunktthema je Ausgabe, feste Gestaltungsregeln und Unterhaltung**. Mit den Punkten unten erreicht es das Niveau eines guten Kunden- oder Verbandsmagazins; bei Fotoqualität (Mitgliederfotos statt Food-Studio) bleibt der Abstand zu Kiosktiteln – das gleicht ein Foto-Leitfaden zum Teil aus.

| Bereich | Bewertung | Was Profi-Magazine haben | Empfehlung |
|---|---|---|---|
| Aufbau | ausbaufähig | feste Reihenfolge: Titel → Inhalt/Editorial → Aktuelles → Titelgeschichte → Rubriken → Service → Unterhaltung → Vorschau/Impressum | Heftaufbau unten verbindlich machen |
| Sortierung | ausbaufähig | Rubriken stehen jede Ausgabe an derselben Stelle, Leser „blättern blind“ | feste Reihenfolge, Rubrikfarbe/-symbol als Leitsystem |
| Titelseite | fehlt im Detail | Logo, Ausgabe/Monat, ein starkes Bild, 3–4 Titelzeilen | Titel-Vorlage mit festen Feldern (Auswahl statt Freitext) |
| Editorial | fehlt | persönliches Vorwort mit Foto und Unterschrift | „Liebe Clubmitglieder …“ vom Vorstand/Redaktion, max. 1200 Zeichen |
| Schwerpunkt | fehlt | jede Ausgabe hat ein Titelthema | Monatsthema (z. B. Dezember „Weihnachtsbäckerei“, Januar „Suppen“), Rubriken greifen es auf |
| Themenvielfalt | gut für Stufe 1 | Mischung aus Service, Menschen, Wissen, Unterhaltung | ergänzen: Warenkunde „Produkt des Monats“, Fachbegriff erklärt, Resteküche/Nachhaltigkeit, Getränk/Wein zum Rezept, Erzeuger aus der Region, Clubgeschichte(n), Termine |
| Rezeptstandard | gut, unvollständig | einheitliche Rezeptkarte | Zutaten in Reihenfolge der Verwendung, Mengen in g/ml, **14 Hauptallergene** per Auswahl, Siegel „Im Club nachgekocht“ |
| Aufmachung | fehlt | Gestaltungsraster, 2 Schriften, feste Farbwelt, Bildsprache | Club-CD (Weinrot, Beige, Gold), Serifenschrift für Überschriften, serifenlos für Text, Lesezeit-Angabe, Zitat-Kästen, Foto-Leitfaden (Tageslicht, von oben/45°, ruhiger Hintergrund) |
| Unterhaltung | fehlt | Rätsel, Gewinnspiel, Leserpost | **Rätsel-Ecke** (Abschnitt 11) + Leserecho/„Nachgekocht“-Fotos |
| Bindung | schwach | Vorschau „Im nächsten Heft“, Gewinnspiel, Leserbriefe | Vorschau-Kasten, Lösungswort-Verlosung beim Clubabend |
| Impressum | fehlt | V. i. S. d. P., Redaktion, Erscheinungsweise | Impressum-Seite (Verantwortliche/r, Redaktion, Bildnachweise) |
| Druck/PDF | fehlt | Print-Ausgabe | Druckansicht/PDF je Ausgabe für Mitglieder ohne Smartphone (Browser-Druck, zero-cost) |
| Barrierefreiheit | gut | – | große Schrift, Vorlesen, Kontraste beibehalten |

**Empfohlener Heftaufbau (feste Reihenfolge):**
1. Titelseite · 2. Inhalt + Editorial · 3. Clubleben (Rückblick, Termine, Kurzmeldungen) · 4. Titelthema des Monats · 5. Rezept des Monats · 6. Backstube · 7. Saisonkalender + Produkt des Monats · 8. Küchentipp + Fachbegriff erklärt · 9. Mitglied im Porträt · 10. Hobbyecke (nur wenn vorhanden) · 11. **Rätsel-Ecke** · 12. Linktipps · 13. Vorschau „Im nächsten Heft“ + Impressum.

**Nachtrag 2026-11-08 (Abgleich mit der Club-App 2.888.0):** Die Club-App hatte bereits Titelblatt mit Schlagzeilen, Vorwort, Inhaltsverzeichnis mit Sprüngen, feste Rubriken-Reihenfolge, Impressum, Archiv aller Ausgaben, Druck/PDF, Einsendungen an die Redaktion und den Fortsetzungsroman – die Tabelle oben bewertete nur dieses Konzept. Umgesetzt in Club-App **2.889.0** (Arbeitszweig `claude/club-kueche-profi-raetsel`, noch nicht eingespielt): Rätsel-Ecke mit Auflösung im nächsten Heft, Küchenlatein, Seite „Im nächsten Heft“, Lesezeit im Roman. Offen (Entscheidung der Redaktion): Titelthema je Ausgabe, Allergene in der Rezeptkarte, Produkt des Monats, Gewinnspiel.

## 11. Rätsel-Ecke
Arbeits-ID: **KC-CLUB-MAGAZIN-RAETSEL** (endgültige Feature-ID bei Aufnahme in der Club-App). Spielbarer Prototyp: [`club-magazin-raetselecke/index.html`](club-magazin-raetselecke/index.html).

**Stufe 1 (Prototyp vorhanden):**
- **Fehlerbild „Finde die 10 Fehler“:** eigene Zeichnung einer Clubküche (Bild A/B), Fehler antippen, Zähler, Tipp, Auflösen, Lösungsbild. Beide Bilder werden aus *einer* Szenenbeschreibung erzeugt; das Bauskript prüft, dass genau 10 Abweichungen wirken.
- **Kreuzworträtsel „Küche & Backstube“:** 20 Fachbegriffe und Geräte (z. B. Julienne, Tranchieren, Legieren, Ganache, Mürbeteig, Schneebesen, Mörser), Lösungswort aus gelben Feldern (KÖCHECLUB). Gitter wird automatisch gelegt und geprüft (keine ungewollten Buchstabenfolgen). Umlaute wie im Kreuzworträtsel üblich als AE/OE/UE; Eingabe von „ü“ wird automatisch zu „UE“. Prüfen, Wort aufdecken, Auflösen, Drucken; Fortschritt bleibt auf dem Gerät gespeichert.
- **Gewinnspiel:** Lösungswort in der App einsenden, Verlosung beim Clubabend, Auflösung in der nächsten Ausgabe.

**Weitere Ideen (Vorrat für spätere Ausgaben):**
| Idee | Kurzbeschreibung | Aufwand |
|---|---|---|
| Rezept-Puzzle | Arbeitsschritte eines Rezepts in die richtige Reihenfolge ziehen | gering |
| Küchen-Quiz | 10 Fragen mit Auswahlantworten („Bei wie viel Grad gerinnt Eigelb?“) | gering |
| Buchstabensalat | Gewürze/Zutaten im Buchstabengitter finden | gering, automatisch erzeugbar |
| Silbenrätsel | Aus Silben Küchenbegriffe bilden, Anfangsbuchstaben ergeben Lösungssatz | gering |
| Küchen-Sudoku | Sudoku mit 4×4 bzw. 6×6 Küchensymbolen statt Zahlen (seniorenfreundlich) | gering |
| Was ist das? | Nahaufnahme eines Küchengeräts/Gemüses erraten | gering, eigenes Foto |
| Schätzfrage | „Wie viele Linsen sind im Glas?“ – Auflösung beim Clubabend | sehr gering |
| Rebus | Bilderrätsel, das ein Gericht ergibt (z. B. Bild „Kohl“ + „Rouladen“) | mittel |
| Wer kocht hier? | Kinderfoto eines Mitglieds am Herd erraten (nur mit Einwilligung) | gering |
| Gewürz-Detektiv | Beim Clubabend: Gewürze blind riechen, Ergebnis in der App eintragen | gering |

Schwierigkeit je Ausgabe wechseln (leicht/mittel), im Dezember eine Weihnachts-Ausgabe. Rätsel immer mit Druckansicht.

**Regeln:** nur eigene Zeichnungen, Fotos und Rätseltexte (keine Rätsel aus Zeitschriften kopieren); Einsendungen nur Lösungswort + Mitglied, kein Freitext nötig; Verlosung ohne Kosten (Sachpreis des Clubs).

**Definition of Done (Rätsel-Ecke in der Club-App):**
- Fehlerbild und Kreuzwort laufen in der App, auch mit großer Schrift und auf dem Handy; Druckansicht vorhanden.
- Rätsel einer Ausgabe werden mit der Ausgabe veröffentlicht, Auflösung erscheint automatisch in der Folgeausgabe.
- Lösungswort-Einsendung (eine je Mitglied und Ausgabe) mit Auslosung durch die Redaktionsrolle.
- Tests: Treffer-/Fehlklick-Erkennung, Kreuzwort-Prüfung inkl. Umlaut-Eingabe, Gitterprüfung im Bauskript; Zero-Cost-Check bestanden.

## 12. Offene Fragen (Ergänzung)
- Wer schreibt das Editorial (Vorstand oder Redaktion)?
- Welche Sachpreise für die Verlosung?
- Sollen Mitglieder eigene Rätsel einreichen dürfen (gleicher Freigabeablauf wie Artikel)?
