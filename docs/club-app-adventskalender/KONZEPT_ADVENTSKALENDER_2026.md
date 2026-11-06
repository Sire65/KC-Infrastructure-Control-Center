# Konzept: Neuer Adventskalender in der Club-App (Advent 2026)

Stand 06.11.2026 · Kennzeichen **KC-CLUB-ADVENT-2026** · baut auf **KC-CLUB-ADVENTSKALENDER** (Club-App 2.468.0 / 2.476.0) auf ·
Status: **Konzept – Fragen 1, 2 und 6 beantwortet (06.11.2026), Rest offen (Abschnitt 10)** · nur Text und Entwurfsbild, noch keine Funktion

Wunsch Hansi (06.11.2026): „Entwickle ein neues Konzept zum Adventskalender in der Club-App. Als Hintergrund soll das Rathaus-Bild aus der
TV-Präsentation sein. In den Türchen sind bisher nur Bastelanleitungen. Baue auch abwechselnd ein: weihnachtliche Bastelanleitung,
Weihnachts-Deko-Anleitung, einen Kinderriegel – 24. Türchen Einladung zum Frühstück im Januar oder Februar bei Hansi.“

![Entwurf: Kalender, Kinderriegel-Türchen, Türchen 24](entwurf.webp)

*Entwurf (`entwurf.html`): ① Kalender am 9. Dezember · ② Sonntags-Überraschung Kinderriegel · ③ Türchen 24 mit Einladung (Termin wird noch bekannt gegeben).*

## 1. Idee in einem Satz

Der Adventskalender bekommt das **weihnachtliche Rathaus von Werne** aus der Weihnachtsmarkt-Präsentation als Hintergrund, und hinter den
Türchen wechseln sich jetzt **vier Sorten** ab – Nascherei, Basteln, Deko und an den Adventssonntagen ein **Kinderriegel** –, bis am
**24. Dezember** die **Einladung zum Frühstück bei Hansi** wartet.

## 2. Was es heute schon gibt (bleibt erhalten)

| Baustein | Stand heute | Im neuen Konzept |
|---|---|---|
| 24 Türchen, gemischte Anordnung `AK_REIHE` | Weinrot/Beige, heutiges leuchtet golden | **bleibt** (gleiche Anordnung, Mitglieder finden sich zurecht) |
| Inhalt `AK_TUERCHEN` | 23 Nasch-Bastelanleitungen + „Frohe Weihnachten“ | Registry wird um **Sorte** erweitert (Abschnitt 4) |
| Frühere Türchen nachholen, spätere gesperrt | ja | **bleibt** |
| Geöffnete Türchen merkt sich das Gerät (`kc_club_advent_<Jahr>`) | ja, kein Server | **bleibt** – nur Kinderriegel und Einladung brauchen den Club-Server (Abschnitt 6/7) |
| Erinnerung im Info-Laufband | „🎄 Türchen … wartet auf dich“ | **bleibt**; an Sonntagen „🍫 Heute wartet eine Überraschung“ |
| Überraschung bis 30.11. (nur Admin sieht ihn) | 2.482.0 | **bleibt** |
| An/aus unter ⚙️ → ✨ Effekte | ja | **bleibt** |

**Keine Anleitung geht verloren:** Die 16 Nasch-Anleitungen, die nicht mehr hinter einem Türchen stehen, kommen in ein neues Fach
**„📖 Alle Naschereien“** unten im Kalender (ab 1.12. für alle sichtbar). So wird keine freigegebene Funktion entfernt (Entwicklervertrag Regel 1).

## 3. Hintergrund: das Rathaus aus der TV-Präsentation

- **Bild:** `assets/kasse-presentation/backgrounds/rathaus.png` aus der Weihnachtsmarkt-Präsentation (Repo *WM-Präsentation*, Gestaltung „Rathaus“ –
  dieselbe, die Hansi im Besuchsprotokoll als Variante „Rathaus“ abfragt). Nachtstimmung: Altes Rathaus mit Arkaden, Turm von St. Christophorus,
  Mondsichel, nasses Kopfsteinpflaster, Tannenbaum mit goldenen Kugeln, rechts eine weinrote Fläche.
- **Für die App verkleinert:** 1280 × 720 Pixel als WebP, **110 KB** statt 2,8 MB PNG (Datei liegt schon bei: `advent-rathaus.webp`). Wird erst geladen,
  wenn der Kalender geöffnet wird, und danach vom Service Worker zwischengespeichert – kein Ballast beim App-Start, kein Zusatz-Datenverkehr.
- **Handy (hochkant):** Das Bild ist Querformat. Ausschnitt `background-position: 24% center` – so steht das Rathaus mit Turm mittig hinter den
  Türchen, die Mondsichel oben. Ein leichter dunkler Verlauf oben und unten hält Überschrift und Hinweistext lesbar.
- **Tablet/PC (quer):** ganzes Bild; die Türchen stehen rechts auf der weinroten Fläche, das Rathaus bleibt links frei sichtbar.
- **Türchen:** halbdurchsichtig weinrot (`rgba(116,21,33,.72)`) mit beigem Rand – das Rathaus schimmert durch. Geöffnete Türchen beige wie bisher.
- **Schnee:** leiser Schneefall über dem Bild mit dem vorhandenen Jahreszeiten-Effekt der App (kein neuer Effekt). Wer unter ⚙️ „Bewegung
  verringern“ eingestellt hat, bekommt ein ruhiges Bild ohne Schnee.
- **Nachtmodus / große Schrift:** Die Türchenkarten bleiben beige mit dunkler Schrift (gut lesbar); bei großer Schrift 3 statt 4 Türchen je Reihe.
- **Herkunft geklärt (Antwort Hansi 06.11.2026: „Rathaus-Bild habe ich gemacht“):** Das Bild ist von Hansi selbst erstellt, die Club-App darf es
  verwenden. Beim Einbau bekommt es eine Quellenzeile („Rathaus Werne im Advent – Bild: Hansi, Köcheclub Werne“) – wie alle Bilder der App.

## 4. Abwechselnd: die vier Sorten

| Sorte | Symbol | Was hinter dem Türchen ist | Anzahl |
|---|---|---|---|
| **Nascherei** | 🍬 | Bastelanleitung für eine kleine süße Nascherei (wie bisher) | 7 |
| **Weihnachtliches Basteln** | ✂️ | Bastelanleitung ohne Essen: Sterne, Karten, Anhänger, Baumschmuck | 7 |
| **Weihnachts-Deko** | 🕯️ | Anleitung für Deko fürs Zuhause und die Festtafel | 6 |
| **Überraschung: Kinderriegel** | 🍫 | ein echter Kinderriegel als Gutschein (Abschnitt 6) | 3 |
| **Einladung** | ☕ | Frühstück bei Hansi im Januar/Februar (Abschnitt 7) | 1 |

**Rhythmus:** Nascherei → Basteln → Deko, immer reihum; an den **drei Adventssonntagen im Dezember** (6., 13., 20.12.2026) der Kinderriegel.
Der 6.12. ist zugleich **Nikolaus und 2. Advent** – passt perfekt.
Kleine Ecke oben links im geöffneten Türchen zeigt die Sorte, eine Legende unter dem Kalender erklärt die Symbole.

Registry-Erweiterung (Beispiel – nur `AK_TUERCHEN` ändern, wie es der Kommentar im Code schon vorsieht):

```js
{ art: "basteln", sym: "⭐", t: "Sterne aus Butterbrottüten", z: [...], s: [...], tipp: "..." }
{ art: "riegel",  sym: "🍫", t: "Ein Kinderriegel für dich!", gutschein: 1 }
{ art: "einladung", sym: "☕", t: "Einladung zum Frühstück", termine: [...] }
// art fehlt = "naschen" (alte Einträge laufen unverändert weiter)
```

## 5. Der Plan für alle 24 Türchen

| Tag | Wochentag | Sorte | Inhalt | Herkunft |
|---|---|---|---|---|
| 1 | Di | 🍬 Nascherei | Lokomotive aus Dominosteinen | bisher Türchen 1 |
| 2 | Mi | ✂️ Basteln | Sterne aus Butterbrottüten | neu |
| 3 | Do | 🕯️ Deko | Winter-Windlicht im Einmachglas (Salz-Schnee, Tannengrün, Kordel) | neu |
| 4 | Fr | 🍬 Nascherei | Nikolaus aus Schokokuss – „schon mal für Sonntag“ | bisher Türchen 6 |
| 5 | Sa | ✂️ Basteln | Nikolausstiefel aus Filz zum Aufhängen – rechtzeitig für heute Abend | neu |
| 6 | **So · 2. Advent · Nikolaus** | 🍫 Überraschung | **Kinderriegel-Gutschein 1/3** | neu |
| 7 | Mo | 🕯️ Deko | Girlande aus getrockneten Orangenscheiben (Backofen, 80 °C) | neu |
| 8 | Di | 🍬 Nascherei | Rentier aus Marshmallow | bisher Türchen 7 |
| 9 | Mi | ✂️ Basteln | Schneeflocken aus Papier falten und schneiden | neu |
| 10 | Do | 🕯️ Deko | Tannenzapfen-Wichtel mit Filzmütze | neu |
| 11 | Fr | 🍬 Nascherei | Schneeflocke aus Brezeln | bisher Türchen 15 |
| 12 | Sa | ✂️ Basteln | Engel aus Nudeln (Baumschmuck) | bisher Türchen 5 – war schon keine Nascherei |
| 13 | **So · 3. Advent · Lucia** | 🍫 Überraschung | **Kinderriegel-Gutschein 2/3** (+ Hinweis auf das Mandarinen-Licht im Fach „Alle Naschereien“) | neu |
| 14 | Mo | 🕯️ Deko | Duft-Orangen mit Nelken (Pomander) | neu |
| 15 | Di | 🍬 Nascherei | Schokolöffel für heiße Milch | bisher Türchen 12 |
| 16 | Mi | ✂️ Basteln | Weihnachtskarte mit Pop-up-Tannenbaum | neu |
| 17 | Do | 🕯️ Deko | Tannenzweige mit Lichterkette in der Bodenvase | neu |
| 18 | Fr | 🍬 Nascherei | Hexenhaus aus Butterkeksen | bisher Türchen 4 |
| 19 | Sa | ✂️ Basteln | Geschenkpapier mit Kartoffelstempel bedrucken | neu |
| 20 | **So · 4. Advent** | 🍫 Überraschung | **Kinderriegel-Gutschein 3/3** | neu |
| 21 | Mo | 🕯️ Deko | Servietten als Tannenbaum falten (für die Festtafel) | neu |
| 22 | Di | 🍬 Nascherei | Tannenbaum aus Eiswaffel | bisher Türchen 8 |
| 23 | Mi | ✂️ Basteln | Geschenkanhänger aus Pappe und Zimtstange – last minute | neu |
| 24 | **Do · Heiligabend** | ☕ Einladung | **Frohe Weihnachten + Einladung zum Frühstück bei Hansi** | neu (ersetzt „Frohe Weihnachten!“, der Gruß bleibt drin) |

**Ins Fach „📖 Alle Naschereien“** (unverändert): Schneemann aus Pfeffernüssen, Lebkuchen-Kerze, Pinguin, Zauberstäbe, Mandarinen-Licht, Päckchen aus
Dominosteinen, Marshmallow-Schneemann, Keks-Tannen, Naschglas-Schneekugel, Apfel-Igel, Stall aus Zwieback, Schneemann-Muffin, Zuckerstangen-Herz,
Obst-Tannenbaum, Schlitten aus Zuckerstangen – plus alle sieben aus dem Kalender. Eine Nascherei im Fach öffnet sich erst, wenn ihr Türchen dran war
bzw. ab dem 1.12. (die nicht mehr verwendeten).

### 5.1 Aufbau der neuen Anleitungen

Gleich wie die Nasch-Anleitungen, damit alles einheitlich aussieht: **🧺 Du brauchst** (3–5 Dinge, die man im Haus hat oder im Bastelladen
für wenige Euro bekommt) · **✂️ So geht's** (4 Schritte, je ein Satz) · **💡 Tipp**. Zusätzlich bei Basteln und Deko:

- **⏱️ Dauer** (z. B. „ca. 20 Minuten“) und **👧 Mit Kindern?** (✅ gut geeignet / ⚠️ mit Hilfe – Schere, Backofen, Kerze).
- **Sicherheitshinweis** bei Kerzen und Backofen (wie beim Mandarinen-Licht: „nie unbeaufsichtigt brennen lassen“).
- Der Kleber-Hinweis (Zuckerguss) erscheint nur noch bei Naschereien.
- Keine Fotos aus dem Netz: Symbol groß, optional eine selbst gezeichnete SVG-Skizze je Schritt (Stufe 2, Frage 5).
- 🔊 **Vorlesen** wie überall in der App (vorhandene Vorlese-Funktion).

Beispiel Türchen 2 – **Sterne aus Butterbrottüten** ✂️ · ca. 20 Min. · 👧 mit Kindern gut geeignet
- 🧺 7 Butterbrottüten (braun oder weiß), Klebestift, Schere, Faden
- ✂️ 1. Die Tüten flach aufeinanderkleben – immer unten einen breiten Streifen und senkrecht einen in der Mitte („T“-Form).
  2. Den Stapel oben spitz oder rund zuschneiden, Muster (Dreiecke, Herzen) seitlich herausschneiden.
  3. Die oberste und die unterste Tüte zusammenkleben – der Stern klappt auf.
  4. Faden durchziehen und ans Fenster hängen.
- 💡 Mit Lichterkette dahinter leuchtet der Stern wie eine Laterne.

## 6. Kinderriegel an den Adventssonntagen

Ein Adventskalender ohne Schokolade? Nicht im Köcheclub. An den drei Sonntagen gibt es **einen echten Kinderriegel** – digital als Gutschein:

1. **Türchen öffnen:** Ein Kinderriegel rutscht aus dem Türchen (kleine Animation, selbst gezeichnet – **kein Markenlogo**, nur der Schriftzug wie im
   Entwurf), Text „Ein Kinderriegel für dich!“, an Nikolaus „Der Nikolaus war da …“.
2. **Gutschein:** „🎟️ Gutschein Nr. 1 von 3 – zeig diese Karte am **Weihnachtsmarktstand** oder beim **nächsten Clubtreffen**, dort wartet dein Kinderriegel.
   Gültig bis 6. Januar, nur einmal einlösbar.“ Darunter der Name des Mitglieds (aus dem Profil, nur auf dem eigenen Gerät angezeigt).
3. **Einlösen:** Wer den Riegel ausgibt (Hansi oder Standdienst), tippt auf „✅ Eingelöst“. Der Club-Server vermerkt nur
   *Mitglied · Gutschein-Nr. · Zeitpunkt* (Vorschlag: neue kleine Tabelle `kc_club_advent_gutschein` – mit `enable row level security`,
   `revoke all … from public, anon, authenticated` und `grant … to service_role` nach KC-SUPABASE-GRANTS). Danach zeigt die Karte „🍫 Eingelöst am …“
   – auch auf einem zweiten Gerät des Mitglieds. **Ohne Netz** merkt sich die App den Haken und schickt ihn nach.
4. **Mehrere Gutscheine auf einmal:** Wer erst am 20.12. reinschaut, hat drei Gutscheine – die Karte zeigt „3 Kinderriegel warten auf dich“.
5. **Übersicht für Hansi** (nur Admin, im Kalender unten): „🍫 Ausgegeben: 37 · offen: 52“ – nur Zahlen, damit Hansi weiß, wie viele Riegel er mitnehmen muss.
6. **Einfache Variante ohne Server (Frage 3):** nur Vertrauen – Haken „Eingelöst“ bleibt auf dem Gerät. Kein Datenbankaufwand, aber doppeltes Einlösen
   auf zwei Geräten wäre möglich.

Kosten: Die Riegel bezahlt der Club (Packung mit 10 Riegeln ca. 2,50 €). Für die App selbst entstehen **keine Kosten** (kein neuer Dienst).

## 7. Türchen 24: Einladung zum Frühstück bei Hansi

Am Heiligabend öffnet sich das goldene Türchen 24 (im Kalender schon vorher mit kleinem ★ erkennbar):

1. **Weihnachtsgruß** (bleibt aus dem bisherigen Türchen 24): „Der Köcheclub Werne wünscht dir und deiner Familie frohe Weihnachten und gesegnete Festtage!“
2. **Einladungskarte** im Stil einer Briefkarte auf beigem Grund, das Rathaus groß im Hintergrund, kleiner Goldglanz beim Öffnen:
   „☕🥐🍳 **Einladung zum Frühstück** – Als Dankeschön für ein tolles Clubjahr lade ich dich im neuen Jahr zum Frühstück ein. Herzlich, euer Hansi 🧑‍🍳“
3. **📅 Termin:** „Im **Januar oder Februar** – der genaue Termin wird noch bekannt gegeben.“ (Antwort Hansi 06.11.2026: „Termin wird noch bekannt
   gegeben“ – deshalb **keine Terminauswahl** im Türchen.)
4. **🙋 Ich bin dabei!** / **Leider nicht** – nur „Hast du Lust?“, ohne Datum. Damit weiß Hansi früh, mit wie vielen er rechnen kann. Dafür wird der
   **vorhandene Abstimmungs-Baustein** genutzt (Vorschläge → 🗳️ Abstimmung, „❓ Eine Frage“): Hansi legt die Abstimmung „Frühstück im neuen Jahr“
   vorher **versteckt** an, Türchen 24 zeigt sie an. Kein Parallel-Baustein (Entwicklervertrag Regel 3).
5. **Bekanntgabe:** Sobald Hansi Tag, Uhrzeit und Ort festlegt, trägt er einen normalen **Termin** im 📅 Kalender ein – mit Zusage, Mitfahrt und
   Erinnerung wie gewohnt; die übliche Termin-Benachrichtigung geht an alle. Türchen 24 (und das Fach im Kalender bis Ende Februar) zeigt dann
   „📅 Jetzt steht's fest: … – Ort …“ mit Knopf „Im Kalender ansehen / zusagen“. Wer vorher „Ich bin dabei“ getippt hat, bekommt den Hinweis im
   Info-Laufband zuerst: „☕ Das Frühstück bei Hansi steht fest – sagst du zu?“
6. **Wer das Türchen erst später öffnet** (bis 31.12. – danach ist der Kalender wie bisher vorbei), kann trotzdem antworten. Ab 1.1. bleibt die
   Einladung über einen Hinweis im Info-Laufband erreichbar, bis der Termin vorbei ist.
7. **Ort und Uhrzeit** stehen in der Karte, sobald Hansi sie bekannt gibt.

## 8. Ablauf im Dezember (was das Mitglied sieht)

1. **1.12., erster App-Start:** Kurze Karte „🎄 Der Adventskalender ist da – mit Rathaus, Bastelideen, Deko und Überraschungen. Öffnen?“ (einmalig).
2. **Jeden Tag:** Erinnerung im Info-Laufband, solange das heutige Türchen zu ist (wie bisher). Sonntags: „🍫 Heute wartet eine Überraschung“.
3. **Türchen antippen:** Türchen klappt auf (bisherige Animation), Inhalt erscheint als Karte über dem Rathaus.
4. **24.12.:** Türchen 24 leuchtet golden mit Sternchen, nach dem Öffnen Goldglanz und Einladung.
5. **25.–31.12.:** alle Türchen offen zum Nachlesen; danach verschwindet der Kalender bis zum nächsten Jahr (Fach „Alle Naschereien“ bleibt in der Hilfe auffindbar).

## 9. Umsetzung, Tests, Definition of Done

- **Wo:** Club-App (`KC-Clubapp`): `app.js` (Registry `AK_TUERCHEN`, `akZeigen`, `akTuer`), `index.html` (CSS `.ak-*`), neues Bild `advent/rathaus.webp`,
  Club-Server (`supabase/functions/kc-club`) nur für den Gutschein-Haken (falls Frage 3 = Server). Hilfe-Eintrag „adventskalender“ anpassen
  („jeden Tag ein Türchen – Naschereien, Basteln, Deko, sonntags eine Überraschung, am 24. eine Einladung“).
- **Einspielen:** gebündelt zum 12- oder 20-Uhr-Termin (KC-DB-SPARSAM), spätestens im Bündel **Ende November**; vorher Vorschau für Admin (gibt es schon).
- **Tests** (neu `tests/advent-2026.test.mjs`):
  - genau 24 Einträge; Reihenfolge der Sorten wie Abschnitt 5; Sonntage 6./13./20.12.2026 sind `riegel`; Tag 24 ist `einladung`;
  - jede Anleitung hat 3–5 Zutaten/Materialien, 4 Schritte, Tipp; Basteln/Deko haben Dauer und Kinder-Hinweis;
  - alle 23 bisherigen Nasch-Anleitungen sind noch vorhanden (Kalender oder Fach „Alle Naschereien“);
  - Hintergrundbild ≤ 150 KB, im Service-Worker-Zwischenspeicher, Quellenzeile vorhanden;
  - Gutschein-Migration enthält RLS, `revoke` und `grant … to service_role` (läuft schon über `tests/migration-rechte.test.mjs`);
  - Browser-Prüfung Handy hochkant und Tablet quer: Rathaus sichtbar, Text lesbar (Kontrast ≥ 4,5 : 1), große Schrift → 3 Spalten.
- **Fertig, wenn:** alle Tests grün · Hansi hat die Vorschau am Handy abgenommen · Bildquelle vermerkt · Frühstücks-Abfrage „Hast du Lust?“ angelegt ·
  CHANGELOG-Eintrag · Hilfe-Text aktualisiert · Rückweg = vorherige App-Version.

## 10. Fragen an Hansi

1. ~~Rathaus-Bild: Woher stammt es?~~ ✅ **Beantwortet 06.11.:** von Hansi selbst gemacht – darf verwendet werden.
2. ~~„Kinderriegel“ oder „Kinderrätsel“?~~ ✅ **Beantwortet 06.11.:** **echter Riegel** (Gutschein wie in Abschnitt 6).
3. **Einlösen:** Haken auf dem Club-Server (sicher, Übersicht für Hansi) oder nur auf dem Gerät (einfacher)?
4. **Wo einlösen:** Weihnachtsmarktstand, Clubtreffen – oder auch per Post/Besuch für Mitglieder, die nicht kommen können?
5. **Skizzen:** Reichen große Symbole, oder sollen die neuen Bastel- und Deko-Anleitungen kleine selbst gezeichnete Schritt-Bilder bekommen?
6. ~~Frühstückstermine zur Auswahl?~~ ✅ **Beantwortet 06.11.:** Termin wird **noch bekannt gegeben** – Türchen 24 ohne Terminauswahl (Abschnitt 7).
7. **Partner:** Sollen beim Frühstück Partner/Partnerinnen Partner/Partnerinnen mit eingeladen sein (dann zusätzlich „Wir kommen zu zweit“ als Antwort)?
8. **Wer bekommt den Kalender:** alle Mitglieder wie bisher – auch Gäste und Kinder-Konten (Eltern-Handy)? Bei Kinder-Konten würde Türchen 24
   statt der Frühstückseinladung „Frohe Weihnachten“ zeigen.

---
Dateien in diesem Ordner: `KONZEPT_ADVENTSKALENDER_2026.md` (dieses Konzept), `entwurf.html` + `entwurf.webp` (Entwurfsbild, keine Funktion),
`advent-rathaus.webp` (Rathaus-Bild für die App vorbereitet, 1280 × 720, 110 KB). Zum Umsetzen in das Club-App-Repo unter `docs/` übernehmen.
