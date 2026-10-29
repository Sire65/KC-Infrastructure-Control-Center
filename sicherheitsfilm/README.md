# Erklärfilm „Wie sicher sind deine Daten?“ – Club-App

**Datei:** `Sicherheit-und-Datenschutz.mp4` · 1080×1920 (Hochformat 9:16) · ca. 2¾ Min. · H.264/AAC · Sprecher mit Untertiteln

Gehört zur Mitglieder-Info `docs/club-app-sicherheit/` (PDF). In der Club-App: Technik → 🔐 Sicherheit & Datenschutz
(`film/sicherheit-datenschutz.mp4`, FILME-Kennung `sicherheitsfilm`, kein Hinweis beim Start).

## Ablauf (18 Szenen, Text in `quellen/texte.json`)

Titel → persönlicher Zugang (nur Fingerabdruck gespeichert) → Link nicht weitergeben / Link verloren → Club-Server als Türsteher →
Verschlüsselung → Privatsphäre-Schalter (ab Werk aus) → Chat nur für Teilnehmer, geheime Abstimmung ohne Namen → Notfallpass nur
auf dem Handy → Handy weitergeben / neues Gerät → 5 Orte der Sicherung → täglicher Wiederherstellungs-Test (273/273) → Notbetrieb →
Wächter → regelmäßige Prüfung der gesamten App durch KI (Claude Code und ChatGPT) → Prüf-Kreislauf → DSGVO „Meine Daten“ → Tipps → Ende.

**Bewusst nicht im Film:** Was Admin oder Technik sehen und deren Werkzeuge (Wunsch Hansi 29.10.2026 „das bringt nur Unsicherheiten“),
die Wege der Mitglieder in der App. Alle gezeigten Inhalte sind Beispiele, keine echten Mitgliederdaten.

## Stimme, Lizenzen (Zero-Cost)
- Sprecher: Piper `de_DE-thorsten-medium` (Datensatz CC0, Piper MIT) – dieselbe Stimme wie Werbefilm und Erklär-Videos.
  Englische Wörter englisch gesprochen (`AUSSPRACHE` in `quellen/vo.py`), der Bildtext bleibt unverändert.
- Emojis: Noto Color Emoji (SIL OFL). Schriften: Inter / DejaVu (frei). Keine Musik.

## Neu erzeugen (`quellen/`)
Voraussetzungen: Node + Playwright (Chromium), ffmpeg, Python mit `piper-tts`, Club-App-Checkout für das Stimmmodell.

```bash
cd sicherheitsfilm/quellen
mkdir -p vo && python3 vo.py [Pfad/zu/de_DE-thorsten-medium.onnx]   # Sprecher → vo/*.wav + zeiten.json
node bild.mjs probe 3 20 40     # Probebilder probe/t<sek>.jpg (optional)
node bild.mjs voll              # Zeitplan plan.json + Bild → bild.mp4 (25 fps)
node mix.mjs                    # Ton einsetzen → Sicherheit-und-Datenschutz.mp4
```
Text ändern: `texte.json` (Untertitel = Sprechertext). Bildaufbau und Einblendzeiten (`data-ab`, Sekunden ab Sprechbeginn der Szene): `film.html`.
Die Szenenlängen ergeben sich automatisch aus der Sprechdauer.
