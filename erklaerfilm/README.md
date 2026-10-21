# Erklärfilm Club-App (KC-CLUB-ERKLAERFILM)

Konzept: [`KONZEPT.md`](KONZEPT.md). Gezeigt wird die **echte Club-App** mit erfundenen Demodaten – keine echten Mitglieder, nichts geht an den Club-Server.

## Fertig

Jedes Kapitel gibt es zweimal: **…-Handy.mp4** (1080×1920, Hochformat für Handy/WhatsApp) und **…-Beamer.mp4** (1920×1080, Querformat für den Clubabend).

| Kapitel | Datei (ohne -Handy/-Beamer) | Länge | Inhalt |
|---|---|---|---|
| 1.6 Voreinstellungen (Muster) | `Teil1-Kap06-Voreinstellungen` | 1:33 | Mehr → Das Wichtigste, Neuigkeiten „Beides“, Nicht stören, Lieblingsfarbe (Küchengrün und zurück), Große Schrift an/aus, Fragezeichen |
| 2.1 Nachrichten | `Teil2-Kap01-Nachrichten` | 2:03 | Chat öffnen, antworten und senden, Haken ✓/✓✓, Foto & Mikrofon zeigen, neue Nachricht an Otto, Gruppen-Chat |
| 2.2 Termine & Zusagen | `Teil2-Kap02-Termine-Zusagen` | 2:23 | Termin öffnen, „Ich komme“, Mitfahrt mit 2 Plätzen anbieten, privaten Termin mit Erinnerung anlegen, Liste/Kalender/To-do |
| 2.3 Pinnwand | `Teil2-Kap03-Pinnwand` | 1:35 | Zettel lesen, erledigt, mit 👍 antworten, eigenen Zettel schreiben, anheften und wieder abnehmen |
| 2.4 Mitglieder & Status | `Teil2-Kap04-Mitglieder-Status` | 1:47 | Wer ist online, schreiben, anklopfen, anrufen (nur gezeigt), Status „im Urlaub“ mit Hinweis und zurück auf verfügbar |
| 2.5 Mein Dienst & Wunschdienst | `Teil2-Kap05-Mein-Dienst` | 2:34 | Wünsche für den Weihnachtsmarkt mit Twinkey (Tag, 16–22 Uhr, Vorne), speichern, eigene Dienste, Dienstplan, mit Erika vergleichen, Übersicht |
| 2.6 Fotoalbum | `Teil2-Kap06-Fotoalbum` | 1:44 | Foto ansehen und blättern, Album, Diashow, eigene Fotos hochladen (nur gezeigt) |
| 2.7 Mitteilungen richtig einrichten | `Teil2-Kap07-Mitteilungen` | 2:04 | je Bereich Handy/E-Mail, Häkchen setzen und zurück, Push auf diesem Handy, Test-Push, Meine Geräte, wenn nichts ankommt |

Jede Einstellung nimmt die Klickhand 👆 in der echten App vor (echte Tipps, Wirkung sichtbar); was verändert wurde, wird zurückgestellt oder der Rückweg gezeigt.
Gesendet, gespeichert oder hochgeladen wird nur gegenüber dem Demo-Server – im Club kommt nichts an.

- **Handy:** oben Kapitel und Schritt („5/7 · Lieblingsfarbe“), Mitte die App im Handy-Rahmen, unten große Untertitel.
- **Beamer:** links die Schritte zum Mitverfolgen (erledigt ✓, aktuell rot), Mitte das Handy, rechts der Untertitel in großer Schrift.

`Hoerprobe-Merksatz-Stimmen.mp3`: A = Kerstin (bisher), B = Sprecherin 26 (jetzt verwendet), C = 102, D = 71 – Umstellen: `SPRECHERIN=102 python3 vo.py …`.

## Stimmen, Musik, Lizenzen (Zero-Cost)

- **Sprecher:** Piper `de_DE-thorsten-medium` (Datensatz CC0, Piper MIT) – wie Werbefilm und Erklär-Videos der App.
- **Merksätze:** Piper `de_DE-mls-medium`, Sprecherin 26 – aus 236 Stimmen nach Tonhöhe, Klarheit und Rauschabstand gewählt.
  Datensatz Multilingual LibriSpeech (OpenSLR 94), Lizenz **CC BY 4.0** – Nennung: „Merksatz-Stimme: Piper mls, Multilingual LibriSpeech (Pratap et al., 2020), CC BY 4.0“.
  Die Stimme „dii“ wird nicht verwendet (nur nicht-gewerblich).
- **Musik:** Twinkeys „Küchen-Disco“ (Trainingsmusik der Bühne, 116 Schläge/Min.) – mit `musik-auszug.py` 1:1 aus `KC-Clubapp/app.js` übernommen und offline gerendert.
  Im Vorspann und auf der Schlusstafel voll, unter den Erklärungen leise; beim Sprechen wird sie zusätzlich abgesenkt (Stimme gut 10 dB über der Musik).
- **Klickhand, Pulsen, Tipp-Ring:** Aussehen der Erklär-Videos der App (`.rg-finger`, `.rg-tippring`, `.rg-puls` aus `index.html`).
- **Demodaten:** `KC-Clubapp/tools/anleitung/demo.mjs` (Max Mustermann, Erika Beispiel …) – dieselben wie in der PDF-Anleitung.
- **Fotos in Kapitel 2.6** (Bilder aus `KC-Clubapp/raetsel/`, Wikimedia Commons, Nachweis dort in `QUELLEN.md`):
  Altes Rathaus, Kirchhof – Vincent van Zeijst (CC BY-SA 4.0) · Stadtmuseum, Sprichwörterbrunnen, Kapuzinerkloster – Mbdortmund (GFDL 1.2) ·
  Moormann-Brunnen – Tasto (CC BY-SA 3.0) · Kochlöffel – Clément Bucco-Lechat (CC BY-SA 3.0) · Artischocken – Toby Hudson (CC BY-SA 3.0) ·
  Romanesco – George Chernilevsky (CC BY 4.0) · Zitrone – Ivar Leidus (CC BY-SA 4.0) · Paprika – AntanO (CC BY-SA 4.0). Keine Fotos von Mitgliedern.
- Schriften Inter/DejaVu (OFL/frei), Emojis Noto Color Emoji (OFL), ffmpeg, Playwright/Chromium – alles kostenlos.

## Neu erzeugen (`quellen/`)

Voraussetzungen: Node + Playwright (Chromium), ffmpeg, Python mit `piper-tts`, Club-App-Checkout (Standard `/home/user/sire65/kc-clubapp`, sonst `CLUB=…`).

```bash
cd erklaerfilm/quellen
mkdir -p stimmen && for f in de_DE-mls-medium.onnx de_DE-mls-medium.onnx.json; do
  curl -sSLo stimmen/$f https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/mls/medium/$f; done
(cd "$CLUB" && python3 -m http.server 8765 &)   # Club-App lokal; Server-Aufrufe ersetzt app.mjs durch Demodaten
python3 vo.py voreinstellungen.json             # Sprecher je Szene → vo/<id>/*.wav + dauer.json
python3 musik-auszug.py                         # nur wenn sich die Küchen-Disco in der App geändert hat
node aufnahme.mjs voreinstellungen.json         # echte App + Klickhand, Bild für Bild mitgeschnitten → aufnahme/<id>/
node bau.mjs voreinstellungen.json              # Rahmen, Untertitel, Ton → film/<id>-hoch.mp4 und film/<id>-quer.mp4
python3 blatt.py aufnahme/<id> pruef.jpg 12 30 45   # Kontaktbogen zum Prüfen (Bilder zu diesen Sekunden)
./alle.sh voreinstellungen t2-1-nachrichten …     # mehrere Kapitel nacheinander (nicht parallel – sonst ruckelt die Aufnahme)
```

**Ein Kapitel = eine JSON-Datei** (z. B. `voreinstellungen.json`): Schritte für die Liste, je Szene Sprechertext, Stimme und was die Hand tut
(`tipp`, `zeig`, `puls`, `weg` – mit `bei`: das Wort im Text, bei dem es passiert, oder Sekunden). Text ändern → `vo.py`, `aufnahme.mjs`, `bau.mjs` neu laufen lassen;
Bild, Ton und Untertitel kommen aus demselben Text und bleiben deshalb gleich.

Nur für den Film (nicht in der App geändert): Twinkeys Bewegungs-Einladung, die Kuckucksuhr und die einmalige Karte „Warum diese App?“ werden ausgeblendet,
die App spricht nicht selbst (der Sprecher kommt aus `vo.py`), und Mitteilungen gelten als erlaubt – das echte Erlaubnis-Fenster des Handys zeigt der Film später als Standbild.

## Hinweis an die Club-App

Beim Termin öffnet „📲 In meinen Kalender“ die Kalenderauswahl (`#kalWahlBlatt`) **hinter** dem Terminfenster (`#treffenInfo`) – im Aufnahme-Browser unsichtbar,
Tipps landen auf dem Terminfenster. Auf echten Handys noch nicht geprüft. Im Film wird der Knopf deshalb nur gezeigt.
