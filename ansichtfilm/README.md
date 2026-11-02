# Erklärfilm „Deine App – so, wie du sie willst“ – Club-App

**Datei:** `App-selbst-einrichten.mp4` · 1080×1920 (Hochformat 9:16) · ca. 2 Min. · H.264/AAC · Sprecher mit Untertiteln
**Feature-ID:** KC-CLUB-ANSICHTFILM · **Anlass:** Kritik auf der Clubsitzung „die App ist zu voll“ (Wunsch Hansi 02.11.2026)

Drehbuch, Szenen und Vorschläge zur Vermittlung: [`DREHBUCH.md`](DREHBUCH.md).

## Ablauf (15 Szenen, Text in `quellen/texte.json`)

Anlass → 10 Minuten investieren → einfache Ansicht → erweiterte Ansicht (Club · Meins · Technik) → Kachel lange drücken →
verschieben → mit ✕ ausblenden + „Fertig“ → „Nur ausgeblendete zeigen“ und mit 👁️ zurückholen → Kopf mit ⌃ / ⌃⌃ einrollen →
Pfeil blinkt bei neuer Nachricht → ⚙️ Mehr → Ansagen, Töne & Tipps: Startmeldungen aus → den Rest einfach nicht antippen →
jederzeit änderbar → wo es weitere Erklär-Videos gibt → Ende.

Im Handy ist die Club-App nachgebaut (keine Bildschirmfotos): nur Mitglieder-Kacheln, Namen und Termine sind Beispiele,
keine echten Mitgliederdaten, keine Chat-Inhalte (Regel 19).

## In der Club-App (`clubapp-einbau.patch`)

Der Einbau liegt als Patch für **Sire65/KC-Clubapp** bei (Stand 2.803.0), weil diese Sitzung nur in dieses Repository schreiben darf:

- `FILME`-Eintrag `ansichtfilm` (`film/app-selbst-einrichten.mp4`, Vorschau `film/app-einrichten-vorschau.jpg`), `fuer: () => true`:
  **jedes Mitglied** bekommt den Film einmal beim Start angeboten (▶ ansehen / ⏰ später / Nein, danke).
- Oben in **Technik → 🎬 Erklär-Videos** steht die Film-Karte (`inVideos`), jederzeit wieder abspielbar.
- **Wer hat ihn gesehen:** Die Einstellung `filme` merkt je Mitglied ▶ angefangen / ✅ **bis zum Ende** (neu: `ende`) / 🙅 Nein, danke – dauerhaft
  und geräteübergreifend. Der Admin sieht in der Film-Karte **„👀 Wer hat ihn gesehen?“** (neue Server-Aktion `film_zuschauer`, nur Admin,
  liest ausschließlich die Einstellung `filme`). Start/Ende/Abbruch stehen zusätzlich 30 Tage in „👣 Wege der Mitglieder“.
- Filme mit eigenem Ort (`wo`) stehen nicht mehr zusätzlich im Büro unter 🎬 Anleitung; die Meldungen nennen den richtigen Ort.
- SRI-Prüfsumme für `teile/videos.js` in `app.js` aktualisiert; Test `tests/film-hinweis.test.mjs` erweitert.

Anwenden im Club-App-Checkout:

```bash
git apply /pfad/zu/ansichtfilm/clubapp-einbau.patch
cp /pfad/zu/ansichtfilm/App-selbst-einrichten.mp4 film/app-selbst-einrichten.mp4
cp /pfad/zu/ansichtfilm/vorschau.jpg film/app-einrichten-vorschau.jpg
node tests/film-hinweis.test.mjs
# dann Version gemäß Versionsvertrag erhöhen (APP_VERSION, sw.js, version.json, index.html ?v=, CHANGELOG) und Edge-Function kc-club ausrollen
```

## Stimme, Lizenzen (Zero-Cost)
- Sprecher: Piper `de_DE-thorsten-medium` (Datensatz CC0, Piper MIT) – dieselbe Stimme wie Werbefilm, Sicherheitsfilm und Erklär-Videos.
- Emojis: Noto Color Emoji (SIL OFL). Schriften: Inter / DejaVu (frei). Keine Musik.

## Neu erzeugen (`quellen/`)
Voraussetzungen: Node + Playwright (Chromium), ffmpeg, Python mit `piper-tts`, Club-App-Checkout für das Stimmmodell.

```bash
cd ansichtfilm/quellen
mkdir -p vo && python3 vo.py [Pfad/zu/de_DE-thorsten-medium.onnx]   # Sprecher → vo/*.wav + zeiten.json
node bild.mjs probe 20 45 80    # Probebilder probe/t<sek>.jpg (optional)
node bild.mjs voll              # Zeitplan plan.json + Bild → bild.mp4 (25 fps)
node mix.mjs                    # Ton einsetzen → App-selbst-einrichten.mp4
```
Text ändern: `texte.json` (Untertitel = Sprechertext). Einblendungen richten sich nach den gesprochenen Wörtern (`data-bei="Wort"`,
Funktion `W()` in `film.html`) – nach einer Textänderung passt sich das Timing von selbst an.
