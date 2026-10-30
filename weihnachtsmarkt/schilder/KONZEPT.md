# Weihnachtsmarkt – Schilder und Preislisten (KC-Schilderfamilie)

Stand 30.10.2026 · Status: **Preisliste freigegeben (Gestaltung), Schilder 1–4 gebaut** – CD nach Vorgabe Hansi: Weinrot, Beige, Gold.

## Ziel

Alle Schilder am Stand sehen gleich aus: gleicher Kopf, gleiche Schrift, gleiche Farben. Gestaltung wie die
Club-CD der Club-App (Schilder-Druckerei, Briefbogen).

## Wo was liegt

- **Hinweisschilder (1–4)**: Club-App → Büro → 🪧 **Schilder-Druckerei** → Anlass 🎄 Weihnachtsmarkt
  (Repo KC-Clubapp, Version 2.765.0, KC-CLUB-SCHILDER-CD). Dort ändern, drucken, an Mitglieder senden, speichern.
- **Preisliste (5)**: dieser Ordner – wird aus dem Artikelstamm der Kasse erzeugt; das PDF kann über
  „📥 Einlesen“ im Büro-Ordner abgelegt werden.
- Vorschau aller vier Schilder: `ausgabe/Schilder_Vorschau.png`.

## Gestaltungsregeln (gelten für jedes Schild)

| Element | Festlegung |
|---|---|
| Farben (Club-CD, `KC_CD`) | Weinrot `#741521` · Beige `#f3e9dc` · Gold `#c9a227` |
| Fläche / Rahmen | Beige Fläche, weinroter Rahmen mit Goldlinie innen |
| Fuß | Weinrotes Fußband mit Goldkante: Kochmütze im weinroten Kreis, „Köcheclub Werne“ (beige) · „Weihnachtsmarkt 2026“ (gold) |
| Schrift | Club-Schrift Georgia (Ersatz Liberation Serif) |
| Warengruppen Preisliste | Alkohol Weinrot · Alkoholfrei Grün `#1e5631` · Speisen Gold `#9c7a12`, jeweils mit heller Zebrafarbe |
| Format | A4 (Preisliste quer, Hinweisschilder hoch), Druck „Originalgröße / 100 %“, zum Einlaminieren |
| Symbole | Selbst gezeichnet (keine Bildlizenzen, druckt überall gleich), Form nach Sicherheitszeichen: Warnung = gelbes Dreieck, Verbot = roter Kreis, Hinweis = weinrotes Feld |

## Die Schilder

| Nr. | Schild | Vorlage (Club-App) | Symbol | Text |
|---|---|---|---|---|
| 1 | Nur Barzahlung | `wm_bar` | Geldschein + durchgestrichene Karte | „Kartenzahlung ist leider nicht möglich. Vielen Dank für Ihr Verständnis!“ |
| 2 | Vorsicht Stufe! | `wm_stufe` | Gelbes Warndreieck mit Stufe | „Bitte achten Sie auf Ihre Schritte.“ |
| 3 | Hier kein Durchgang | `wm_kein_durchgang` | Verbotszeichen mit Person | „Bitte benutzen Sie den Weg vor dem Stand. Vielen Dank!“ |
| 4 | Gebrauchtes Besteck | `wm_besteck` | Gabel + Messer | „bitte hier ablegen. Danke schön!“ |
| 5 | Preisliste 2026 | dieser Ordner | – | siehe unten |

## Preisliste im Stand (Nr. 5)

- Links die Artikel, oben die Anzahl **1 bis 10**, darunter der Preis für diese Anzahl **inklusive Pfand**.
- Reihenfolge der Warengruppen: **Getränke mit Alkohol → alkoholfreie Getränke → Speisen**; jede Gruppe mit
  farbigem Band, jede zweite Zeile in der hellen Gruppenfarbe.
- Spalte „1“ hervorgehoben (größer), unter jedem Getränk steht das enthaltene Pfand.
- „Schuss Rum / Amaretto“ als Zuschlagszeile (ohne Pfand) am Ende der Alkoholgruppe.
- Kopf: „Preisliste 2026“ (Jahr in Gold, `--jahr=` änderbar). Fuß: Pfandbeträge, Rückgabehinweis, Fußband wie die Schilder mit „Nur Barzahlung“.
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

- Anzahl-Spalten: 1–10 oder weniger (z. B. 1–8 für größere Zahlen)?
- Optional: Jugendschutz-Hinweis auf der Preisliste bzw. als eigenes Schild.
