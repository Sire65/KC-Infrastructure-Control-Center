# Erklärfilm „Der Kopf der Club-App“ (KC-CLUB-KOPFFILM)

**Datei:** `Kopf-der-App.mp4` · 1080×1920 (Hochformat 9:16) · ca. 2¾ Min. · H.264/AAC · Sprecher mit Untertiteln
**Anlass:** Wunsch Hansi 04.11.2026 – eigenes Erklärvideo nur über den Kopfbereich, ohne Admin-Bereich. Konzept und Bestandsaufnahme: [`KONZEPT.md`](KONZEPT.md).

## Ablauf (18 Szenen, Text in `quellen/texte.json`)
Titel mit Filmlänge („ca. 3 Minuten“, erste Infozentrale, du steuerst eine Menge) → vier Teile im Überblick → Kopfzeile (Logo → Internetseite,
🌙 Tag/Nacht/Automatik, ↻) → Status-Knopf und Lämpchen → ⌃/⌃⌃ einrollen, Pfeil blinkt → erste Karte (Treffen mit Zusagen, drei Felder) →
‹ › blättern, « » Anfang/Ende, wischen → gelbe Punkte → Schnellstart → Wetter (Tag antippen, lange festhalten = Einzelheiten) → Für dich →
Demnächst → Neueste Fotos (groß öffnen) → Kommunikationszentrale → Startkarte wählen (⚙️ Mehr) → Szenen im Kopf (Herbst, Winter, Frühling,
Karibik, Halloween, Weltraum, Disco; ⚙️ Mehr → ✨ Effekte → 🔄 Automatik) → Eselsohr (eigenes Video „Die Rückseite“) → einfache Ansicht, Schluss.

**Nicht im Film:** Admin-Zentrale, Studio-Karte, Technik-Lampe und Werkzeuge des Admins. Alle Inhalte sind Beispiele (keine echten Mitgliederdaten, keine Chats).

## Stimme, Lizenzen (Zero-Cost)
Piper `de_DE-thorsten-medium` (CC0/MIT), ruhiger gesprochen als der Ansichtfilm (`length_scale` 1.0 – freundlich und sachlich). Emojis: Noto Color Emoji (OFL). Keine Musik.

## Neu erzeugen (`quellen/`)
```bash
cd kopffilm/quellen
mkdir -p vo && python3 vo.py [Pfad/zu/de_DE-thorsten-medium.onnx]
node bild.mjs probe 20 60 120   # optional
node bild.mjs voll && node mix.mjs   # → Kopf-der-App.mp4
```
Einblendungen richten sich nach den gesprochenen Wörtern (`W()` in `film.html`).
