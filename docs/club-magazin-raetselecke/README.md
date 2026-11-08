# Rätsel-Ecke – Prototyp (KC-CLUB-MAGAZIN-RAETSEL)

Status: **KONZEPT / Prototyp** für das Club-Magazin „Club-Küche“ (siehe `../KONZEPT-CLUB-MAGAZIN.md`, Abschnitt 11). Nicht Teil des KICC-Builds.

| Datei | Inhalt |
|---|---|
| `index.html` | spielbarer Prototyp (offline, eine Datei) – **erzeugt**, nicht von Hand bearbeiten |
| `vorlage.html` | Seitenvorlage (Layout, Logik) |
| `fehlerbild.py` | zeichnet Küchenszene A/B mit genau 10 Fehlern + Lösungsbild, prüft jeden Fehler |
| `kreuzwort.py` | Begriffe + Fragen, legt und prüft das Gitter, wählt Lösungswort-Felder |
| `bauen.py` | führt beides aus und baut `index.html` |
| `fehlerbild-*.svg`, `*.json` | erzeugte Bilder und Daten (auch für Druck/Club-App verwendbar) |

Neu bauen: `cd docs/club-magazin-raetselecke && python3 bauen.py`

Neues Kreuzworträtsel: Begriffe/Fragen in `WORDS` in `kreuzwort.py` ändern, `LOESUNGSWORT` setzen, `bauen.py` ausführen. Neues Fehlerbild: in `fehlerbild.py` die Szene und die Liste `FEHLER` anpassen.
