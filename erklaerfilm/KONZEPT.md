# Erklärfilm Club-App – Konzept

**Feature-ID:** KC-CLUB-ERKLAERFILM · **Stand:** 21.10.2026 · **Status:** freigegeben (21.10.2026) – gebaut: Musterkapitel 1.6 und Teil 2 Kapitel 2.1–2.7, siehe `README.md`
**Bezug:** Club-App 2.553.0 (`Sire65/KC-Clubapp`), Werbefilm „Köcheclub to go“ (`werbefilm/`)

---

## 1. Ziel

Ein Erklärfilm in zwei Teilen, der Mitgliedern die Club-App **ruhig, logisch und ohne Fachwörter** zeigt:

| | Teil 1 – „So findest du dich zurecht“ | Teil 2 – „Die Funktionen im Einzelnen“ |
|---|---|---|
| Frage | Wie sieht die App aus, wie bediene ich sie, was stelle ich am Anfang ein? | Wie benutze ich die einzelnen Bereiche richtig? |
| Länge | ca. 8–9 Minuten am Stück | 14 kurze Kapitel à 1–3 Minuten, einzeln anschaubar |
| Für wen | alle, besonders Neue und wer wenig mit dem Handy macht | alle, die einen Bereich genauer wissen wollen |

**Zielgruppe:** Mitglieder des Köcheclub Werne. Viele sind älter, lesen ohne Brille schlecht und haben Sorge, „etwas kaputtzumachen“.
Der Film nimmt diese Sorge: Er zeigt jeden Handgriff langsam, sagt, was passiert, und zeigt immer auch den Weg zurück.

---

## 2. Grundidee: das echte Programm, keine Nachbildung

Anders als der Werbefilm (nachgebaute Handy-Bilder in `werbefilm/quellen/film.html`) zeigt der Erklärfilm **die echte Club-App**.

- **Echte Oberfläche:** Die App läuft lokal im Browser (Chromium, Handygröße). Was man im Film sieht, sieht man genauso im Handy.
- **Erfundene Daten:** Statt echter Mitglieder kommen die vorhandenen Demodaten aus `KC-Clubapp/tools/anleitung/demo.mjs`
  („Max Mustermann“, „Erika Beispiel“, „Clubabend Oktober“ …) – dieselben wie in der PDF-Anleitung. Kein Mitgliedername, keine echte Nachricht im Film.
- **Klickhand:** Der vorhandene Zeigefinger 👆 der Erklär-Videos (`rgFinger`, KC-CLUB-VIDEO-LIVE) fährt zum Knopf, tippt (Ring), drückt lange, wischt, zieht.
  Was gerade erklärt wird, **pulsiert** (KC-CLUB-ERKLAERVIDEOS-PULS).
- **Einstellungen werden wirklich vorgenommen:** Weil der Server im Film durch Demodaten ersetzt ist, darf die Klickhand Schalter
  tatsächlich umlegen, Farben wählen, große Schrift einschalten – man sieht die echte Wirkung. Nichts davon erreicht den echten Club-Server.
- **Stimme:** Piper `de_DE-thorsten-medium` (CC0/MIT) – dieselbe Stimme wie im Werbefilm und in den Erklär-Videos der App. Aussprache-Liste aus `werbefilm/quellen/vo.py` wird übernommen („App“ → „Äpp“, „Twinkey“ → „Twinki“ …).
- **Vorhandenes wiederverwenden (Entwickler-Vertrag Regel 3):** Die Club-App hat bereits über 50 Erklär-Rundgänge (`RUNDGAENGE` in `app.js`) mit Texten,
  Finger-Aktionen und Markierungen. Der Film baut **auf diesen Rundgängen auf** – es entsteht keine zweite, parallele Erklärwelt.
  Wird ein Text für den Film verbessert, wird er auch im Rundgang der App verbessert. So stimmen Film und App immer überein.

---

## 3. Gestaltungsregeln („bedienerfreundlich“)

1. **Ein Gedanke pro Szene.** Erst sagen, was kommt – dann zeigen – dann kurz die Wirkung stehen lassen (ca. 1 Sekunde Ruhe).
2. **Klickhand immer gleich:** hinfahren (langsam) → kurzer Halt → Tipp-Ring → Wirkung. Nie zwei Dinge gleichzeitig.
3. **Langsames Tempo:** Sprecher ca. 10 % langsamer als im Werbefilm; nach jedem Kapitel eine kurze Kapiteltafel.
4. **Untertitel immer an** (groß, unten, gut lesbar) – hilft bei leisem Handy und schlechtem Hören.
5. **Immer den Rückweg zeigen:** „Und so kommst du wieder zurück.“ Jede Einstellung, die verändert wird, wird am Ende des Abschnitts wieder zurückgestellt oder es wird gesagt, wie.
6. **Merksatz am Kapitelende** als Tafel, z. B. „Merke: Unten ist immer die Leiste – damit kommst du überall zurück.“
7. **Duzen, Alltagssprache,** keine Fachwörter (statt „Push-Benachrichtigung“: „Mitteilung aufs Handy“; das Wort „Push“ wird einmal erklärt).
8. **Nur Mitgliederbereich:** nichts aus Admin, Büro, Clubleitung oder Technik-Verwaltung (Prüfung gegen `nur:`-Bedingungen, wie beim Werbefilm). Eigene Filme für die Clubleitung später.
9. **Musik:** Twinkeys „Küchen-Disco“ aus der Bühne der App – im Vorspann und auf der Schlusstafel voll, unter den Erklärungen leise und beim Sprechen zusätzlich abgesenkt (Entscheidung Hansi).
10. **Merksätze mit weiblicher Stimme** (Chatterbox, MIT, Stimmfarbe einer echten Sprecherin aus dem CC0-Kerstin-Datensatz – nach zwei Rückmeldungen von Hansi), Erklärungen mit Thorsten – so hört man sofort: Das ist zum Merken.

**Bildaufbau (Hochformat 9:16, 1080×1920):**

```
┌───────────────────────────┐
│ Teil 1 · Voreinstellungen │  ← schmale Kapitelzeile (Weinrot/Beige)
│ ┌───────────────────────┐ │
│ │                       │ │
│ │   echte Club-App      │ │  ← App im Handy-Rahmen, ca. 85 % der Höhe
│ │        👆             │ │  ← Klickhand + Pulsen
│ │                       │ │
│ └───────────────────────┘ │
│  Untertitel, zwei Zeilen  │  ← groß, hoher Kontrast
└───────────────────────────┘
```

Optional eine **Beamer-Fassung 16:9** für den Clubabend: Handy in der Mitte, links Kapitelübersicht, rechts Merksatz. Gleiche Aufnahme, nur anderer Rahmen.

---

## 4. Teil 1 – „So findest du dich zurecht“ (ca. 8–9 Min.)

Grundlage: Rundgänge `ueberblick`, `einfach`, `einstellungen` (Abschnitt „Das Wichtigste“), `oberflaeche`, `hilfe` aus der Club-App.
Die App startet im Film in der **einfachen Ansicht** – so, wie neue Mitglieder sie zuerst sehen.

| Nr. | Zeit | Kapitel | Bild & Klickhand | Sprecher (Entwurf) |
|---|---|---|---|---|
| 1.0 | 0:00–0:20 | **Vorspann** | Logo mit Kochmütze, „Teil 1: So findest du dich zurecht“ | „Hallo! In diesem Film zeige ich dir die Club-App vom Köcheclub Werne. Ganz in Ruhe, Schritt für Schritt. Du musst nichts mitmachen – schau einfach zu.“ |
| 1.1 | 0:20–0:45 | **App öffnen** | Handy-Startbildschirm (Standbild), 👆 tippt auf die Kochmütze, App öffnet sich | „Die App erkennst du an der weißen Kochmütze auf weinrotem Grund. Ein Tipp – und sie öffnet sich.“ |
| 1.2 | 0:45–2:00 | **Die Startseite (einfache Ansicht)** | Oben pulsiert „Nächstes Treffen“, dann nacheinander die 8 großen Kacheln: Termine, Nachrichten, Pinnwand, Mein Dienst, Mitglieder, Meine Dokumente, Spiele, SOS | „Das ist die Startseite. Ganz oben siehst du das nächste Treffen. Darunter acht große Knöpfe – wir nennen sie Kacheln. Jede Kachel öffnet einen Bereich …“ (je Kachel ein Satz) |
| 1.3 | 2:00–2:40 | **Zahlen auf den Kacheln** | Kachel „Nachrichten“ mit roter 2 pulsiert, 👆 tippt, Nachricht wird gelesen, Zahl verschwindet | „Steht oben auf einer Kachel eine Zahl, wartet dort etwas auf dich – zum Beispiel zwei neue Nachrichten. Hast du sie angeschaut, ist die Zahl weg.“ |
| 1.4 | 2:40–3:20 | **Die Leiste unten** | Leiste pulsiert: Start, Termine, Nachrichten, Mitglieder, Mehr; 👆 tippt „Termine“, dann „Start“ | „Ganz unten ist immer diese Leiste. Egal, wo du gerade bist: Mit ‚Start‘ kommst du immer wieder hierher zurück.“ – **Merke:** „Unten ist immer der Weg zurück.“ |
| 1.5 | 3:20–4:00 | **Der Kopf** | Kopf pulsiert; Status, Info-Laufband, drei kleine Felder, Mond für Tag/Nacht | „Oben im Kopf: dein Status, das Info-Laufband mit den Neuigkeiten und drei kleine Felder – neue Nachrichten, wer gerade in der App ist und wie lange es bis zum nächsten Treffen dauert.“ |
| 1.6 | 4:00–5:35 | **Voreinstellungen – einmal einrichten** ✅ Muster gebaut | 👆 tippt „Mehr“ → „Das Wichtigste“. Dann **echt eingestellt**: (a) Mitteilungen aufs Handy einschalten, (b) „Nicht stören“ 22–7 Uhr, (c) Farbe wählen – Küchengrün, Startseite färbt sich um, danach zurück auf Klassik, (d) große Schrift an – alles wird größer – und wieder aus, (e) Fragezeichen-Hilfe an lassen | „Jetzt richten wir die App einmal ein. Das dauert zwei Minuten und du musst es nur einmal machen. Tippe unten auf ‚Mehr‘ …“ – je Einstellung: was sie bewirkt, Klick, Wirkung zeigen. |
| 1.7 | 6:30–7:20 | **Einfach oder erweitert?** | 👆 tippt „🔧 Erweiterte Ansicht“ → Register Club / Meins / Technik, 👆 wischt einmal zum nächsten Register → 👆 tippt „🟢 Einfache Ansicht“, zurück | „Wenn du dich eingewöhnt hast, kannst du alle Funktionen einschalten: die erweiterte Ansicht. Und genauso schnell geht es zurück. Du entscheidest.“ |
| 1.8 | 7:20–8:20 | **Hilfe – du bist nicht allein** | 👆 tippt „?“ unten rechts → Hilfe zum Bereich; Lupe → „Termin eintragen“ wird getippt; Twinkey; 👆-Knopf „Was kann ich antippen?“ rahmt alles rot ein; Liste der Erklär-Videos | „Wenn du mal nicht weiterweißt: Das Fragezeichen erklärt dir die Seite, auf der du gerade bist. Mit der Lupe findest du jede Funktion. Und zu fast jedem Thema gibt es ein Erklär-Video.“ |
| 1.9 | 8:20–8:45 | **Abschluss** | Startseite, Logo, Vorschau-Kacheln von Teil 2 | „Das war Teil 1. Probier ruhig alles aus – kaputt machen kannst du nichts. In Teil 2 zeige ich dir die einzelnen Bereiche genauer.“ |

**Systemfenster des Handys** (Erlaubnis für Mitteilungen, „Zum Startbildschirm hinzufügen“) gehören nicht zur App und lassen sich nicht direkt aufnehmen.
Sie werden als **nachgestellte Standbilder** gezeigt, deutlich beschriftet: „So oder ähnlich fragt dein Handy – tippe auf ‚Zulassen‘.“

---

## 5. Teil 2 – „Die Funktionen im Einzelnen“ (14 Kapitel)

Reihenfolge: zuerst das, was man jede Woche braucht, dann Einstellungen für Fortgeschrittene, zum Schluss Freizeit und Hilfe bei Problemen.
Jedes Kapitel beginnt mit „Wo finde ich das?“ (Kachel zeigen) und endet mit einem Merksatz.

| Nr. | Kapitel | Inhalt (Klickhand zeigt …) | Länge | Grundlage (Rundgang) |
|---|---|---|---|---|
| 2.1 | 💬 **Nachrichten** | Unterhaltung öffnen, antworten, Foto anhängen, Sprachnachricht, ✓✓ gelesen, „+ Neu“ an eine Person / an eine Gruppe | 3 Min. | `nachricht`, Auszug `chatprofi` |
| 2.2 | 📅 **Termine & Zusagen** | Termin öffnen, „Ich komme / Vielleicht / Kann nicht“, Mitfahrt anbieten, Erinnerung, privaten Termin eintragen | 3 Min. | `zusagen`, `termin` |
| 2.3 | 📌 **Pinnwand** | Zettel lesen, mit Emoji antworten, eigenen Zettel schreiben und anheften | 1,5 Min. | `pinnwand` |
| 2.4 | 👥 **Mitglieder & mein Status** | Wer ist online (grüner Punkt), schreiben, anklopfen, anrufen; eigenen Status „Urlaub bis Sonntag“ setzen | 2 Min. | `mitglieder`, `status` |
| 2.5 | 🗓️ **Mein Dienst & Wunschdienst** | Wünsche für den Weihnachtsmarkt eintragen (auch mit Twinkey), eigene Dienste, Dienstplan, „Wer kann wann?“ | 3 Min. | `dienst` |
| 2.6 | 📷 **Fotoalbum** | Fotos ansehen, Diashow, eigene Fotos hochladen | 1,5 Min. | `fotos` |
| 2.7 | 🔔 **Mitteilungen richtig einrichten** | je Bereich Handy/E-Mail wählen, „Test an mich“, was tun, wenn nichts ankommt | 3 Min. | `push` |
| 2.8 | 🔒 **Privatsphäre** | Wer sieht was: online, zuletzt da, Geburtstag, Kontaktdaten; Handy weitergeben, abmelden | 3 Min. | `privat` |
| 2.9 | 🎨 **Die App nach meinem Geschmack** | Farben, Schrift, Kacheln verschieben/verbergen, Schnellstart, Effekte abschalten | 3 Min. | `oberflaeche`, `anpassen` |
| 2.10 | 📄 **Dokumente, Protokolle & meine Daten** | Protokoll nachlesen, Meine Dokumente, neue Anschrift melden | 2 Min. | `lesen`, `meinedaten` |
| 2.11 | 🤝 **Mitmachen** | Helfen & Leihen, Vorschlag für die nächste Sitzung, Erstattung beantragen, Feedback | 3 Min. | `helfen`, `vorschlag`, `erstattung`, `feedback` |
| 2.12 | 🆘 **SOS – im Notfall** | Notrufnummern, „Wo bin ich?“, Notfallpass | 1,5 Min. | `sos` |
| 2.13 | 🎲 **Freizeit** | Spiele, Werne-Rätsel, Bühne mit Club-Song (nur wenn freigeschaltet) | 2,5 Min. | `spiele`, `raetsel`, `buehne` |
| 2.14 | 🛠️ **Wenn etwas nicht klappt** | App neu öffnen, Update, Lämpchen, wann man Hansi fragt | 2,5 Min. | `probleme` |

Gesamt Teil 2: ca. 35 Minuten – **nie am Stück gedacht**, sondern als Kapitel. Zusätzlich gibt es eine Gesamtdatei mit Kapitelmarken.

---

## 6. Technische Umsetzung (alles kostenlos)

```
Demodaten (demo.mjs) ─┐
                      ├─► echte Club-App lokal (python3 -m http.server) in Chromium/Playwright, Handygröße
Rundgang-Texte ──┬────┘        │  Rundgang starten: rundgangStart(false, "<id>")  → Klickhand, Pulsen
(RUNDGAENGE)     │             ▼
                 │       Bildfolge 30 fps (wie werbefilm/quellen/bild.mjs) ─► bild.mp4
                 └─► Piper „thorsten“ (offline) ─► ein WAV je Station ─► Taktgeber: Station dauert = Sprechzeit + 1 s
                                                                      ─► Untertitel (SRT) aus denselben Texten
ffmpeg: Bild + Stimme + leise Musik (nur Vor-/Abspann) + Untertitel eingebrannt ─► MP4 je Kapitel + Gesamtfassung
```

- **Gleiche Textquelle für Bild, Ton und Untertitel** → sie können nicht auseinanderlaufen.
- **Bildfolge statt Bildschirmmitschnitt:** Wie beim Werbefilm wird Bild für Bild aufgenommen – der Film ruckelt nicht, egal wie schnell der Rechner ist.
- **Kleine Ergänzung in der Club-App nötig (eigene Feature-ID dort):** ein **Filmmodus** für Rundgänge, der
  (a) die Browser-Stimme stumm schaltet, (b) das Weiterblättern einem äußeren Taktgeber überlässt und (c) den Finger etwas größer zeichnet.
  Teil 1 wird als **neuer Eintrag in `RUNDGAENGE`** aus vorhandenen Stationen zusammengestellt – damit gibt es ihn automatisch auch in der App unter „🎬 Erklär-Videos“.
- **Bildgröße:** Aufnahme 1080×1920; zum Verteilen zusätzlich 720×1280, damit jede Datei klein bleibt (WhatsApp, GitHub Pages, unter 50 MB je Datei).
- **Ablage:** Quellen und Anleitung in diesem Ordner (`erklaerfilm/`, wie `werbefilm/`); fertige Filme in der Club-App unter `film/` und in der Liste der Erklär-Videos.
- **Lizenzen / Zero-Cost:** Piper + Thorsten (CC0/MIT), Noto Emoji (OFL), Liberation/DejaVu, ffmpeg, Playwright – alles frei. Die Stimme „dii“ wird nicht verwendet (nur nicht-gewerblich). Keine Bezahldienste.

---

## 7. Ablauf bis zum fertigen Film

| Schritt | Ergebnis | Wer |
|---|---|---|
| 1 | Dieses Konzept freigeben (offene Fragen unten beantworten) | Hansi |
| 2 | Sprechertexte Teil 1 ausformulieren und vorlesen lassen (Hörprobe als WAV) | Claude → Hansi prüft |
| 3 | **Musterkapitel 1.6 „Voreinstellungen“** (ca. 2,5 Min.) komplett bauen – zeigt Klickhand, Tempo, Untertitel, Bildaufbau | Claude |
| 4 | Abnahme Musterkapitel, Änderungswünsche | Hansi |
| 5 | Teil 1 komplett, Abnahme | Claude → Hansi |
| 6 | Teil 2 Kapitel für Kapitel (je Kapitel eine kurze Abnahme) | Claude → Hansi |
| 7 | Einbinden in die Club-App (Erklär-Videos), neue App-Version | Claude |

---

## 8. Definition of Done

- [ ] Teil 1 als MP4 (1080×1920 und 720×1280), Untertitel eingebrannt, ca. 8–9 Minuten
- [ ] Teil 2: 14 Kapitel als einzelne MP4 + Gesamtfassung mit Kapitelmarken
- [ ] Nur Demodaten sichtbar, kein echter Name, keine echte Nachricht (Bild für Bild geprüft)
- [ ] Nichts aus Admin, Büro oder Clubleitung zu sehen
- [ ] Jede gezeigte Einstellung wird im Film wieder zurückgestellt oder der Rückweg wird erklärt
- [ ] Bild und Text stimmen überein (Stichprobe je Kapitel: Gesagtes = Gezeigtes)
- [ ] Texte gleichlautend im passenden Rundgang der Club-App
- [ ] README in `erklaerfilm/` mit Ablauf, Sprechertexten, Lizenzen und „Neu erzeugen“ (wie `werbefilm/README.md`)
- [ ] Zero-Cost-Check: keine kostenpflichtige Abhängigkeit

---

## 9. Entscheidungen (Hansi, 21.10.2026)

1. **Format:** Hochformat fürs Handy **und** Beamer-Fassung 16:9 – beide aus derselben Aufnahme.
2. **Sprecher:** Thorsten ✔ – Merksätze mit weiblicher Stimme (zuerst Kerstin; „noch nicht so gut“ → Piper mls; „passt nicht“ → Chatterbox mit echter Stimmvorlage).
6. **Vorspann** (Wunsch Hansi): Begrüßung, warum die App, Vorteile, Aufbau des Films – `quellen/t0-vorspann.json`.
3. **Musik:** Twinkeys Disco-Musik als Untermalung.
4. **Reihenfolge:** zuerst die Probe (Musterkapitel 1.6 Voreinstellungen), dann die ersten sieben Kapitel von Teil 2.
5. **Start-Ansicht:** offen – Teil 1 beginnt vorerst in der einfachen Ansicht.

**Abweichung vom Entwurf in 1.6:** „Tag/Nacht“ steht in der einfachen Ansicht nicht unter „Das Wichtigste“ und ist deshalb nicht im Musterkapitel;
es kommt in Kapitel 1.5 (Mond oben im Kopf) bzw. 2.9. Die Länge ist mit 1:33 kürzer als geschätzt – ruhiges Tempo, nichts weggelassen.
