# Erklärfilm Club-App (KC-CLUB-ERKLAERFILM)

Konzept: [`KONZEPT.md`](KONZEPT.md). Gezeigt wird die **echte Club-App** mit erfundenen Demodaten – keine echten Mitglieder, nichts geht an den Club-Server.

## Fertig

| Datei | Inhalt | Format | Länge |
|---|---|---|---|
| `Teil1-Kap06-Voreinstellungen-Handy.mp4` | **Musterkapitel** Teil 1 · Voreinstellungen | 1080×1920 (Hochformat, Handy/WhatsApp) | 1:33 |
| `Teil1-Kap06-Voreinstellungen-Beamer.mp4` | dasselbe für den Clubabend | 1920×1080 (Querformat, Beamer) | 1:33 |

**Ablauf Musterkapitel:** Vorspann-Tafel → Mehr öffnen → Das Wichtigste → Neuigkeiten „Beides“ → Nicht stören (22–7 Uhr) →
Lieblingsfarbe Küchengrün, Startseite ansehen, zurück auf Klassik → Große Schrift an und wieder aus → Fragezeichen → Merksatz → Schlusstafel „Als Nächstes: Einfach oder erweitert?“.
Jede Einstellung nimmt die Klickhand 👆 in der echten App vor (echte Tipps, Wirkung sichtbar); was verändert wurde, wird wieder zurückgestellt.

- **Handy:** oben Kapitel und Schritt („5/7 · Lieblingsfarbe“), Mitte die App im Handy-Rahmen, unten große Untertitel.
- **Beamer:** links die 7 Schritte zum Mitverfolgen (erledigt ✓, aktuell rot), Mitte das Handy, rechts der Untertitel in großer Schrift.

## Stimmen, Musik, Lizenzen (Zero-Cost)

- **Sprecher:** Piper `de_DE-thorsten-medium` (Datensatz CC0, Piper MIT) – wie Werbefilm und Erklär-Videos der App.
- **Merksätze:** Piper `de_DE-kerstin-low` – weibliche Stimme, Datensatz **CC0** ([dataset-voice-kerstin](https://github.com/rhasspy/dataset-voice-kerstin)).
  Die Stimme „dii“ wird nicht verwendet (nur nicht-gewerblich).
- **Musik:** Twinkeys „Küchen-Disco“ (Trainingsmusik der Bühne, 116 Schläge/Min.) – mit `musik-auszug.py` 1:1 aus `KC-Clubapp/app.js` übernommen und offline gerendert.
  Im Vorspann und auf der Schlusstafel voll, unter den Erklärungen leise; beim Sprechen wird sie zusätzlich abgesenkt (Stimme gut 10 dB über der Musik).
- **Klickhand, Pulsen, Tipp-Ring:** Aussehen der Erklär-Videos der App (`.rg-finger`, `.rg-tippring`, `.rg-puls` aus `index.html`).
- **Demodaten:** `KC-Clubapp/tools/anleitung/demo.mjs` (Max Mustermann, Erika Beispiel …) – dieselben wie in der PDF-Anleitung.
- Schriften Inter/DejaVu (OFL/frei), Emojis Noto Color Emoji (OFL), ffmpeg, Playwright/Chromium – alles kostenlos.

## Neu erzeugen (`quellen/`)

Voraussetzungen: Node + Playwright (Chromium), ffmpeg, Python mit `piper-tts`, Club-App-Checkout (Standard `/home/user/sire65/kc-clubapp`, sonst `CLUB=…`).

```bash
cd erklaerfilm/quellen
mkdir -p stimmen && for f in de_DE-kerstin-low.onnx de_DE-kerstin-low.onnx.json; do
  curl -sSLo stimmen/$f https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/kerstin/low/$f; done
(cd "$CLUB" && python3 -m http.server 8765 &)   # Club-App lokal; Server-Aufrufe ersetzt app.mjs durch Demodaten
python3 vo.py voreinstellungen.json             # Sprecher je Szene → vo/<id>/*.wav + dauer.json
python3 musik-auszug.py                         # nur wenn sich die Küchen-Disco in der App geändert hat
node aufnahme.mjs voreinstellungen.json         # echte App + Klickhand, Bild für Bild mitgeschnitten → aufnahme/<id>/
node bau.mjs voreinstellungen.json              # Rahmen, Untertitel, Ton → film/<id>-hoch.mp4 und film/<id>-quer.mp4
python3 blatt.py aufnahme/<id> pruef.jpg 12 30 45   # Kontaktbogen zum Prüfen (Bilder zu diesen Sekunden)
```

**Ein Kapitel = eine JSON-Datei** (z. B. `voreinstellungen.json`): Schritte für die Liste, je Szene Sprechertext, Stimme und was die Hand tut
(`tipp`, `zeig`, `puls`, `weg` – mit `bei`: das Wort im Text, bei dem es passiert, oder Sekunden). Text ändern → `vo.py`, `aufnahme.mjs`, `bau.mjs` neu laufen lassen;
Bild, Ton und Untertitel kommen aus demselben Text und bleiben deshalb gleich.

Nur für den Film (nicht in der App geändert): Twinkeys Bewegungs-Einladung und die einmalige Karte „Warum diese App?“ werden ausgeblendet,
die App spricht nicht selbst (der Sprecher kommt aus `vo.py`), und Mitteilungen gelten als erlaubt – das echte Erlaubnis-Fenster des Handys zeigt der Film später als Standbild.
