# Werbefilm „Köcheclub to go“ – Club-App

**Datei:** `Koecheclub-Werbefilm.mp4` · 1080×1920 (Hochformat 9:16, für WhatsApp-Status, Instagram, Handy) · 123 s · H.264/AAC

## Ablauf

| Zeit | Szene | Sprecher |
|---|---|---|
| 0–4 s | Logo, „Du bist Mitglied im Köcheclub Werne?“ – Stempel „Sehr gut! 👍“ | „Du bist Mitglied im Köcheclub Werne? Sehr gut!“ |
| 4–8 s | Handy springt aus der Jeanstasche | „Und weißt du schon? Den Köcheclub gibt es jetzt für die Hosentasche!“ |
| 8–12 s | Startbild der App | „Immer aktuell. Immer dabei. In deinem Handy.“ |
| 12–19 s | 📰 Neuigkeiten | „Neuigkeiten aus dem Club – bevor das Nudelwasser kocht.“ |
| 19–25 s | 💬 Clubchat 🔒 | „Chatte (gesprochen „Tschätte“) mit deinen Freunden. Und alles bleibt unter uns.“ |
| 25–32 s | 📅 Termine + ⏰ Erinnerung | „Alle Clubtermine im Blick – und auf Wunsch erinnert dich die App.“ |
| 32–39 s | 📸 Fotoalbum + Diashow | „Und die schönsten Momente? Im Fotoalbum, immer wieder.“ |
| 39–46 s | 🎄 Wunschdienst für den Weihnachtsmarkt: Twinkey 🧑‍🍳 fragt Tage, Wunschzeit und Vorne/Hinten ab, „Wunsch abschicken“ → „Danke!“ | „In der App gibst du ganz einfach deinen Wunschdienstplan für den Weihnachtsmarkt ein – wenn du magst, mit unserem Assistenten Twinkey.“ |
| 46–50 s | Zettel fliegen herein, großes Verbotsschild, Zettel fliegen weg | „Also: keine Zettelwirtschaft mehr!“ |
| 50–74 s | 🎤 Bühne: Club-Song „Seit einundneunzig“ als Karaoke (Pre-Chorus + Refrain), Schneebesen, Kochlöffel und Messer tanzen mit (im Refrain mit Pirouetten), Konfetti, hüpfende Kochmützen | – (Gesang) |
| 74–78 s | ✨ „… und noch viel mehr!“ – Kacheln: Pinnwand, Dienstpläne, Helfen & Leihen, Archiv, Vorschläge, Spiele, Werne-Rätsel, Bühne, SOS, Vorlesen, Themen, Frag Twinkey | „Und das ist noch lange nicht alles: Viele weitere Funktionen findest du in der App.“ |
| 78–93 s | 👍 Einfach zu bedienen: einfache Ansicht (Nächstes Treffen + 8 große Kacheln) → Tipp auf „🔧 Erweiterte Ansicht“ → Designs Küchengrün, Nordsee, Lagune, Nachtmodus, große Schrift | „Und das Gute: Die App ist einfach zu bedienen und stellt sich ganz auf dich ein. Beginne mit der einfachen Ansicht. Und wenn du dich ein bisschen zurechtgefunden hast, kannst du die App genau an deine Vorlieben und Bedürfnisse anpassen.“ |
| 93–105 s | 🤝 „Du bist nicht allein!“ – Twinkey winkt, Karten: ❓ Hilfe & Tipps, 🔍 Suche („Termin eintragen“ wird getippt), 🎬 Erklär-Videos zu jedem Thema | „Und du bist nicht allein! Hilfethemen, eine Suchfunktion – und zu jedem Thema ein Erklärvideo. Damit du dich in der App schnell zurechtfindest.“ |
| 105–108 s | 📲 Knopf „Installieren“ wird angetippt | „Installier die App – und probier alles aus!“ |
| 108–112 s | 💡 „Deine Idee? Immer her damit!“ + Kachel „💭 Feedback – Deine Meinung zur App“ | „Und wenn du Ideen hast: immer her damit! Die App wird ständig weiterentwickelt.“ |
| 112–117 s | ✅ „Schon installiert? Umso besser! Dann bist du immer up to date 🔄“ | „Und wenn du die App schon installiert hast: umso besser! Dann bist du immer up to date.“ |
| 117–123 s | Abspann: Logo, „Jetzt in der Club-App“, „Gemeinsam kochen, gemeinsam helfen“ | „Köcheclub Werne. Jetzt in der Club-App. Gemeinsam kochen, gemeinsam helfen.“ |

## Musik, Stimme, Lizenzen (Zero-Cost)

- **Club-Song** „Seit einundneunzig (Köcheclub Werne)“ – Melodie, Akkorde und Klangerzeugung 1:1 aus der Club-App
  (`KC-Clubapp/app.js`, Bühne, KC-CLUB-SONG 2.316.0), offline mit Web Audio gerendert. Werbefilm-Fassung:
  Intro → 16 Takte Begleitung unter dem Sprecher → 6 Takte unter dem Wunschdienst → Pre-Chorus → Refrain (Zeilen 1, 2, 5, 6) → 20 Takte Begleitung für „… noch viel mehr“, „einfach zu bedienen“ und „nicht allein“ → 2 Takte „schon installiert“ → Schlussakkord.
- **Sprecher:** Piper-Stimme `de_DE-thorsten-medium` (Datensatz CC0, Piper MIT) – dieselbe Stimme wie in den Erklär-Videos der App,
  Englische Wörter werden englisch gesprochen („App“ → „Äpp“, „Chatte“ → „Tschätte“, „Twinkey“ → „Twinki“, „up to date“ englisch) – Liste `AUSSPRACHE` in `quellen/vo.py`, Bildtext bleibt unverändert.
  lokal erzeugt. Die Stimme „dii“ ist bewusst **nicht** verwendet (nur nicht-gewerblich).
- **Emojis:** Noto Color Emoji (SIL OFL). Schriften: Liberation/DejaVu (frei).
- Inhalte im Handy (Namen, Termine, Nachrichten, Fotos) sind **Beispiele** – keine echten Mitgliederdaten.
- **Nur Mitgliederbereich:** Es werden nur Kacheln/Seiten gezeigt, die jedes Mitglied sieht – nichts aus Admin-, Leitungs-/Büro- oder Technikbereich (geprüft gegen `KACHELN` mit `nur:`-Bedingungen in der Club-App).

## Neu erzeugen (`quellen/`)

Voraussetzungen: Node + Playwright (Chromium), ffmpeg, Python mit `piper-tts`, Club-App-Checkout für das Stimmmodell.

```bash
cd werbefilm/quellen
curl -sSLo NotoColorEmoji.ttf https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.047/fonts/NotoColorEmoji.ttf
python3 vo.py            # Sprecher → vo/*.wav (Pfad zum Thorsten-Modell in vo.py anpassen)
node musik.mjs && ffmpeg -f s16le -ar 44100 -ac 2 -i musik.raw musik.wav   # Club-Song → musik.wav + karaoke.json
node bild.mjs voll       # Animation (film.html) → bild.mp4, 30 fps
./mix.sh                 # Ton mischen + zusammenfügen → Koecheclub-Werbefilm.mp4
```

`musik.js` ist ein Auszug aus `KC-Clubapp/app.js` (bwTon, bwRauschen, Disco-Bausteine, KS_TEXT, ksSpiel, ksSingen) plus der Werbefilm-Liedfolge.
Text oder Timing ändern: Sprechertexte in `vo.py`, Einsatzzeiten in `mix.sh` (`D=…`), Szenenzeiten in `film.html` (`zeige(t)`).
