# Konzept: Erklärfilm „Der Kopf der Club-App“ (KC-CLUB-KOPFFILM)

**Wunsch Hansi 04.11.2026:** eigenes Erklärvideo nur über den Kopfbereich – Felder, Pfeile oben, Blättertasten (‹ › und « »),
gelbe Positionspunkte, dann die Karten (Termine, zu erledigen, Wetter mit langem Festhalten, Kommunikationszentrale, Fotos).
**Nicht zu lang, aber alle Funktionen. Kein Admin-Bereich – weder erwähnt noch gezeigt.**

Form wie „Deine App – so, wie du sie willst“: Hochformat 1080×1920, Sprecher (Thorsten) mit Untertiteln, nachgebautes Handy mit Finger,
Beispieldaten. Ziel: **ca. 3 Minuten**, 17 kurze Szenen.

## Bestandsaufnahme: was der Kopf kann (Club-App 2.856.0, nur Mitgliedersicht)

| Bereich | Funktion | Quelle im Code |
|---|---|---|
| Kopfzeile | Logo (antippen → Internetseite des Clubs), Begrüßung „Hallo …“, 🌙 Tag/Nacht/Automatik (A/T/N), ↻ Aktualisieren | `index.html` `.kopfzeile` |
| Pfeile oben | ⌃ rollt das Info-Feld ein, ⌃⌃ den ganzen Kopf; Pfeil blinkt bei Neuem | KC-CLUB-KOPF-ROLLO(-2), KOPF-PFEIL-NEU |
| Statusleiste | Status-Knopf „🟢 verfügbar ▾“: verfügbar, beschäftigt, im Urlaub, krank, nicht erreichbar (mit „bis“ und Hinweis); Lämpchen rechts = Verbindung (antippen: „in Ordnung“ / „Störung“) | `statusBlatt`, `verbindungBlatt` (Mitglieder: einfache Ansicht) |
| Info-Laufband | oben in der ersten Karte: nächstes Treffen mit ✔ Zusagen / ✖ Absagen, weitere Meldungen laufen durch | KC-CLUB-INFO-LAUFBAND |
| Drei Felder | 💬 neue Nachrichten (blinkt grün → orange → rot nach Alter), 👥 Mitglieder (wer ist online), 📅 Clubtreffen-Countdown – je antippen führt hin | `infoTreffen` |
| Blättern | ‹ › eine Karte weiter/zurück, « » sofort zur ersten/letzten Karte, im Feld wischen | `infoBlaettern`, KC-CLUB-INFO-SPRUNG |
| Gelbe Punkte | zeigen die Position (aktuelle Karte = gelber Balken), Punkt antippen springt hin | `infoPunkte` |
| Karte Schnellstart | Schreiben, Termin, Zettel, Foto, Standort, Suchen, SOS; ✏️ Symbole wählen (nur erweiterte Ansicht) | `infoSchnellstart` |
| Karte Wetter | heute groß, darunter Tagesleiste; Tag antippen = diesen Tag zeigen; **Tag lange festhalten = Details** (Wind, Böen, Regen, UV …); 📅 am Treffen-Tag | `infoWetter`, `wetterTagDetails` |
| Karte Für dich | „zu erledigen“: neue Nachrichten, zu-/absagen, Abstimmungen, Protokoll prüfen, offene Aufgaben, nächster Dienst, Geburtstage – Zeile antippen führt hin | `infoFuerDich` |
| Karte Demnächst | Termine der nächsten Wochen – antippen öffnet den Tag im Kalender | `infoDemnaechst` |
| Karte Neueste Fotos | die 4 neuesten Fotos – antippen öffnet groß; „Alle … Fotos ansehen“ | `infoFotos`, `infoFotoOeffnen` |
| Karte Kommunikationszentrale | Anzeige (online, neu, Push), Empfänger: Alle / Online / Keiner / Auswahl; dann 📞 Anrufen, 🎥 Video, ✊ Anklopfen, 🎤 Sprache, 💬 Chat, 📍 Standort, 📨 Termin; zusätzlich 🔔 Push, ✉️ E-Mail, 🟢 WhatsApp | `infoZentrale` |
| Startkarte | ⚙️ Mehr → „🪧 Info-Feld oben beim Start“: welche Karte zuerst kommt | KC-CLUB-INFOFELD 0.44.0 |
| Eselsohr | unten rechts doppelt tippen → Kopf dreht sich um (Uhr, Diashow, Tafel …) – **eigenes Video „Die Rückseite: Eselsohr“** | KC-CLUB-RUECKSEITE |
| Einfache Ansicht | nur die erste Karte, kein Blättern | `infoBlaettern` |

**Bewusst weggelassen:** Admin-Zentrale, Studio-Karte (nur mit Sonderrecht), Technik-Lämpchen und Werkzeuge des Admins, Lebenszeichen-Liste.

## Ablauf (Sprechertext gekürzt)

| # | Szene | Bild | Sprecher (Entwurf) | ca. |
|---|---|---|---|---|
| 1 | Titel | Kopf groß, Titel „Der Kopf der Club-App“ | Ganz oben in der App ist der Kopf. Hier siehst du alles Wichtige auf einen Blick. Ich zeige dir, was er kann. | 7 s |
| 2 | Überblick | Kopf mit vier farbigen Rahmen nacheinander | Er hat vier Teile: die Kopfzeile, die Statusleiste, das Info-Feld zum Blättern und die gelben Punkte darunter. | 8 s |
| 3 | Kopfzeile | Finger zeigt Logo, Mond, ↻ | Tippst du aufs Logo, kommst du zur Internetseite des Clubs. Mit dem Mond schaltest du zwischen Tag, Nacht und Automatik. Der Kreispfeil holt alles neu. | 10 s |
| 4 | Status & Lämpchen | Status-Knopf öffnet die Liste; Lämpchen grün | Mit dem Status-Knopf zeigst du den anderen, ob du verfügbar, beschäftigt oder im Urlaub bist. Die Lämpchen rechts zeigen die Verbindung: grün heißt alles in Ordnung. | 11 s |
| 5 | Pfeile oben | ⌃ und ⌃⌃ rollen ein, Pfeil blinkt | Die zwei Pfeile oben rollen den Kopf ein, für mehr Platz. Kommt etwas Neues, blinkt der Pfeil. | 8 s |
| 6 | Erste Karte | Laufband mit Treffen + ✔/✖, drei Felder | In der ersten Karte läuft oben dein nächstes Treffen – mit Zusagen und Absagen. Darunter drei Felder: neue Nachrichten, Mitglieder und die Tage bis zum Clubtreffen. Antippen führt direkt hin. | 13 s |
| 7 | Blättern | ‹ › und « » werden angetippt | Mit den Pfeilen links und rechts blätterst du eine Karte weiter. Der Doppelpfeil springt sofort zur ersten oder letzten Karte. Wischen geht auch. | 10 s |
| 8 | Gelbe Punkte | Punkte unten, gelber Balken wandert, Punkt antippen | Die gelben Punkte unten zeigen, wo du bist. Tippst du einen Punkt an, springst du direkt zu dieser Karte. | 8 s |
| 9 | Schnellstart | Karte mit 7 Symbolen, ✏️ | Im Schnellstart erreichst du das Wichtigste mit einem Tipp: schreiben, Termin, Zettel, Foto, Standort, Suchen und SOS. Mit dem Stift wählst du die Symbole. | 11 s |
| 10 | Wetter | Tagesleiste, Tag antippen, Tag festhalten → Details | Das Wetter für Werne: Tippst du einen Tag an, siehst du diesen Tag. Hältst du einen Tag länger fest, kommen die Einzelheiten – Wind, Böen und Regen. | 11 s |
| 11 | Für dich | Liste „zu erledigen“ | „Für dich“ zeigt, was zu erledigen ist: neue Nachrichten, Zusagen, Abstimmungen oder dein nächster Dienst. Eine Zeile antippen, und du bist da. | 10 s |
| 12 | Demnächst | Terminliste | Bei „Demnächst“ stehen die Termine der nächsten Wochen. Antippen öffnet den Tag im Kalender. | 7 s |
| 13 | Fotos | 4 Fotos, eines geht groß auf | Die neuesten Fotos aus dem Album: antippen, und das Foto öffnet sich groß. Darunter kommst du zu allen Fotos. | 9 s |
| 14 | Kommunikationszentrale | Empfänger wählen, Knöpfe | Die Kommunikationszentrale: Oben wählst du, an wen – alle, wer online ist, oder eine Auswahl. Dann anrufen, Video, anklopfen, Sprachnachricht, Chat, Standort oder Termin. Auf Wunsch zusätzlich per Push, E-Mail oder WhatsApp. | 16 s |
| 15 | Startkarte wählen | ⚙️ Mehr → Info-Feld oben beim Start | Welche Karte beim Start zuerst kommt, stellst du unter „Mehr“ ein, bei „Info-Feld oben beim Start“. | 7 s |
| 16 | Eselsohr | Ecke unten rechts, Hinweis aufs Video | Unten rechts ist ein Eselsohr. Doppelt tippen, und der Kopf dreht sich um. Dazu gibt es ein eigenes Video: „Die Rückseite“. | 8 s |
| 17 | Schluss | Logo, Hinweis Erklär-Videos | In der einfachen Ansicht siehst du nur die erste Karte. Alle Erklär-Videos findest du unter Technik. Viel Spaß! | 7 s |

**Gesamt: ca. 2 Min. 55 s.**

## Vermittlung
- In der App wie den Ansichtfilm anbieten: einmal beim Start für alle, danach oben in Technik → 🎬 Erklär-Videos; „👀 Wer hat ihn gesehen?“ für den Admin.
- Der Ansichtfilm verweist am Ende auf diesen Film (kurzer Satz), dieser Film auf „Oberfläche nach Wunsch“ und „Die Rückseite“.
