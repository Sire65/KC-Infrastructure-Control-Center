# Rätsel-Ecke – Hefte 2–12 (Club-Küche 2027)

Erzeugt am 11.11.2026 (Wunsch Hansi „Baue neue Bilderrätsel für die weiteren Ausgaben und Kreuzworträtsel für alle 12 Ausgaben“), eingebaut in der Club-App 2.922.0.

| Datei | Inhalt |
|---|---|
| `fehlerbild_nrNN.py` | Szene zum Monat, Bild A/B mit genau 10 Fehlern + Lösungsbild (SVG 400 × 300), Selbstprüfung |
| `nrNN-fehlerbild.json` | Fehlerliste `[x, y, Radius, Text]` wie in `MAG_AUSGABEN[n].raetsel.fehlerbild.fehler` |
| `hefte_woerter.py` | Begriffe und Fragen je Heft (Umlaute AE/OE/UE) |
| `kreuzwort_hefte.py` | legt und prüft die Gitter (nutzt `../kreuzwort.py`), wählt die Lösungswort-Felder |
| `nrNN-kreuzwort.json` | fertiges Rätsel im Format von `MAG_AUSGABEN[n].raetsel.kreuzwort` |

Die SVG-Bilder liegen in der Club-App unter `magazin/raetsel/nrNN-<thema>-{a,b,loesung}.svg` (die Skripte schreiben sie neben sich; nach dem Erzeugen dorthin kopieren).

## Kreuzworträtsel 2028 (Hefte 13–24)

Begriffe und Fragen in `hefte_woerter_2028.py` (ein Thema je Monat, Lösungswörter aus 2027 werden nicht wiederholt).
Erzeugen mit `python3 kreuzwort_hefte.py 2028` → `nr13-kreuzwort.json` … `nr24-kreuzwort.json`; ohne Argument entstehen wie bisher die Hefte 2–12.

## Hefte 13–24 (Club-Küche 2028)

Erzeugt am 13.11.2026 (Wunsch Hansi „Baue schon mal in alle Hefte die weiteren feststehenden Sachen ein“), eingebaut in der Club-App 2.942.0.
`fehlerbild_nr13.py` … `fehlerbild_nr24.py`, `nr13…nr24-*.json`; Kreuzworträtsel mit `python3 kreuzwort_hefte.py 2028` (Begriffe in `hefte_woerter_2028.py`).
Tipps, Witze, Küchenlatein, Termine, Kräuter und „Schon gewusst?“ 2028: `2028-texte/inhalte.json`, Einbau mit `2028-texte/einbauen.py` (Februar-Kraut: Gartenkresse statt Meerrettich).
