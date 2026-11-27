# Weihnachtliche Naschereien – A5-Heft (KICC-ADVENT-NASCHHEFT)

Bastelanleitungen aus dem Adventskalender der Club-App als Heft, dazu 10 passende Ideen aus dem Internet. Jede Anleitung bekommt eine Seite mit Foto.
**Nicht in der Club-App** (Wunsch Hansi 27.11.2026), nur als PDF.

| Datei | Wofür |
|---|---|
| `Weihnachtliche-Naschereien-A5.pdf` | Heft zum Lesen am Handy oder Tablet, oder zum Drucken auf A5 (56 Seiten) |
| `Weihnachtliche-Naschereien-Heft-A4-Druck.pdf` | **Zum Drucken als Heft**: je 2 Seiten auf A4 quer, richtig sortiert (14 Blätter) |
| `fotos/AUFTRAG-CHATGPT.md` | Anleitung und Text zum Kopieren in ChatGPT, mit dem man freie Fotos findet |
| `fotos/quellen.csv` | Bildnachweis je Anleitung (Urheber, Lizenz, Link) |
| `bauen.py` | baut alles neu: `python3 bauen.py` |
| `daten-holen.mjs` | holt die Anleitungen neu aus der Club-App: `node daten-holen.mjs <kc-clubapp>/app.js` |

## Heft drucken
1. `Weihnachtliche-Naschereien-Heft-A4-Druck.pdf` öffnen und drucken mit: **beidseitig**, **an der kurzen Kante spiegeln** (manchmal „Kurze Seite“ genannt), **Tatsächliche Größe / 100 %**, also nicht „An Seite anpassen“.
2. Den Stapel so, wie er aus dem Drucker kommt, in der Mitte falten und mit 2 Heftklammern im Falz heften (Rückstichheftung). Wer keinen langen Hefter hat, näht mit Nadel und Faden durch den Falz.
3. Tipp: Erst nur das erste Blatt drucken. Auf der Rückseite müssen die Seiten 2 und 55 stehen.

## Fotos einsetzen
Für jede Anleitung ist ein Platz für ein Foto vorgesehen (Platzhalter „Foto folgt · 01-hexenhaus“).
1. Freie Fotos besorgen, z. B. mit `fotos/AUFTRAG-CHATGPT.md`. Nur freie Lizenzen sind erlaubt, Fotos von Rezeptseiten nicht.
2. Die Bilder genau mit den Namen aus der Liste als `fotos/01-hexenhaus.jpg` usw. ablegen (jpg, png oder webp).
3. In `fotos/quellen.csv` je Bild `art`, `urheber`, `lizenz` und `quelle` eintragen. Das ist bei CC BY Pflicht.
4. `python3 bauen.py` ausführen. Das Foto erscheint dann auf der Seite und im Bildnachweis. Bei langen Anleitungen wird das Bild automatisch etwas kleiner, damit kein Text abgeschnitten wird.

## Inhalt
- **23 Naschereien** aus `AK_NASCH` der Club-App, darunter Hexenhaus aus Butterkeksen, Lokomotive aus Dominosteinen, Lebkuchen-Kerze mit Mandel-Flamme, Schneemann aus Pfeffernüssen und Engel aus Nudeln
- **12 Bastel- und Deko-Anleitungen** aus den Türchen der Club-App (`AK_TUERCHEN`)
- **10 Ergänzungen** (`daten/ergaenzungen.json`), geprüft am 27.11.2026, mit selbst geschriebenen Texten; die Quelle steht auf jeder Seite
- Dazu: Vorwort, Inhaltsverzeichnis, Grundrezepte (Zuckerguss, Schokolade, Spritzbeutel), Einkaufsliste zum Abhaken (mit den Nummern der Anleitungen), Quellen und Bildnachweis, Notizseiten

Stand der Club-App-Daten: Commit `c25e0fb` (26.11.2026). Titelbild: Rathaus-Gestaltung aus dem Club-App-Adventskalender (`advent/rathaus.webp`, im Hochformat zugeschnitten).

## Prüfung
`node tests/advent-naschheft-check.js` prüft: Seitenzahl ist ein Vielfaches von 4, alle 45 Anleitungen sind drin, jede Ergänzung hat eine Quelle, die Tabelle `quellen.csv` ist vollständig, es sind keine Fotos von Rezeptseiten eingebunden und die PDFs haben die richtige Seitenzahl.
`drucken.cjs` bricht ab, wenn auf einer Seite Text abgeschnitten würde.

Kosten: keine (Playwright/Chromium und pypdf sind schon vorhanden, keine bezahlten Dienste). Die Daten enthalten keine Mitglieder-Daten und keine Chats (AGENTS.md Regel 19).
