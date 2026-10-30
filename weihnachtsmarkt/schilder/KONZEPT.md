# Weihnachtsmarkt – Schilder und Preislisten (KC-Schilderfamilie)

Stand 30.10.2026 · Status: **Probe Preisliste** – die übrigen Schilder folgen nach Freigabe.

## Ziel

Alle Schilder am Stand sehen gleich aus: gleicher Kopf, gleiche Schrift, gleiche Farben. Gestaltung wie die
vorhandenen Druckunterlagen des Köcheclubs (Kesselschilder, Übungsliste, Club-App-Anleitungen).

## Gestaltungsregeln (gelten für jedes Schild)

| Element | Festlegung |
|---|---|
| Kopf | Kochmütze + „Köcheclub Werne“ in Marineblau `#173765`, darunter „Weihnachtsmarkt“ in Grau `#5b6572`, Trennlinie `#173765` |
| Schrift | Carlito (frei, maßgleich zu Calibri), Ersatz Liberation Sans |
| Grundfarben | Marineblau `#173765` · Grün `#2e7d32` · Grau `#5b6572` · Weiß |
| Warengruppen | Alkohol Weinrot `#8b1e24` · Alkoholfrei Grün `#2e7d32` · Speisen Marineblau `#173765` – jeweils mit heller Zebrafarbe |
| Format | A4 (Preisliste quer, Hinweisschilder hoch oder quer), Druck „Originalgröße / 100 %“, zum Einlaminieren |
| Symbole | Gezeichnet als SVG (keine Bildlizenzen), Form angelehnt an Sicherheitszeichen: Warnung = gelbes Dreieck, Verbot = roter Kreis, Hinweis = blaues Feld |

## Die Schilder

| Nr. | Schild | Art | Symbol | Text (Vorschlag) |
|---|---|---|---|---|
| 1 | Nur Barzahlung | Hinweis | Geldschein + durchgestrichene Karte | **Nur Barzahlung** · „Keine Kartenzahlung möglich“ |
| 2 | Vorsicht Stufe | Warnung (gelb) | Dreieck mit Stufe/Person | **Vorsicht Stufe!** |
| 3 | Hier kein Durchgang | Verbot (rot) | Kreis mit Person, durchgestrichen | **Kein Durchgang** · „Bitte den Eingang vorne benutzen“ |
| 4 | Gebrauchtes Besteck | Hinweis (blau) | Gabel + Messer + Pfeil | **Gebrauchtes Besteck hier** |
| 5 | Preisliste im Stand | Tabelle | – | siehe unten |

## Preisliste im Stand (Nr. 5 – Probe liegt bei)

- Links die Artikel, oben die Anzahl **1 bis 10**, darunter der Preis für diese Anzahl **inklusive Pfand**.
- Reihenfolge der Warengruppen: **Getränke mit Alkohol → alkoholfreie Getränke → Speisen**; jede Gruppe mit
  farbigem Band, jede zweite Zeile in der hellen Gruppenfarbe.
- Spalte „1“ hervorgehoben (größer), unter jedem Getränk steht das enthaltene Pfand.
- „Schuss Rum / Amaretto“ als Zuschlagszeile (ohne Pfand) am Ende der Alkoholgruppe.
- Fußzeile: Pfandbeträge, Rückgabehinweis, „Nur Barzahlung“, Stand-Datum.
- **Preise werden nicht abgetippt**, sondern aus dem Artikelstamm der KC MarktKasse gelesen
  (`pos/app.js` → `PRODUCTS`, dieselbe Quelle wie Kesselschild und Kasse). Preisänderung in der Kasse →
  Liste neu erzeugen, fertig.
- Fehlt bei einem Getränk die Angabe Alkohol/alkoholfrei, wird nichts geraten: die Zeile wird rot markiert.

## Erzeugen

```bash
node weihnachtsmarkt/schilder/preisliste.cjs --kasse=PFAD/ZUM/Kasse   # optional --bis=8 für weniger Spalten
```

Ergebnis in `ausgabe/`: `Preisliste_Stand.pdf` (A4 quer) und `Preisliste_Stand_Vorschau.png`.
Braucht Node + Playwright (Chromium) – wie die übrigen Werkzeuge. Keine kostenpflichtigen Bausteine.

## Offen / zur Entscheidung

- Ablageort: endgültig in den vorhandenen Schilder-Ordner verschieben (Ordner bitte nennen).
- Anzahl-Spalten: 1–10 oder weniger (z. B. 1–8 für größere Zahlen)?
- Optional: Jugendschutz-Hinweis auf der Preisliste bzw. als eigenes Schild.
