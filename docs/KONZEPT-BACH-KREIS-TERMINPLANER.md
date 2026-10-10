# Konzept: Bach-Kreis-Terminplaner (abgeleitet aus KC Club App)

Status: **IDEE / KONZEPT** – es wird noch nichts gebaut.
Stand: 10.10.2026 · Basis-Analyse: `Sire65/KC-Clubapp` v2.220.0 RC

---

## 1. Ziel

Eine eigenständige PWA, mit der der Bach Kreis seine Proben, Premieren und
Orchestertermine plant, Zu-/Absagen einsammelt, die Besetzung je Termin
sicherstellt und das Ganze auswertet. Benachrichtigung per Push, E-Mail und
WhatsApp-Übergabe.

Leitsatz: **Bewährte Muster der Club-App übernehmen, aber nicht den Monolithen
forken.** Gleiche Grundsätze (Zero-Cost, DEV → RC → FINAL, Versionsvertrag,
atomares PWA-Update, Registry + Adapter).

---

## 2. Was die Club-App schon kann (und wir übernehmen)

| Bedarf Bach Kreis | Vorhanden in KC Club App | Übernahme |
|---|---|---|
| Termine mit Zusage / Vielleicht / Absage | `kc_club_treffen` + `kc_club_teilnahme` (`ja`/`nein`/`vielleicht` + Notiz), Server `treffen_*` | **Datenmodell 1:1 als Vorlage**, erweitert um Terminarten + Besetzung |
| Premiere / Konzert | `treffen.art = 'veranstaltung'` | wird zur echten **Terminart-Registry** |
| Terminfindung | `kc_club_terminumfragen*` (Doodle-artig, „festlegen“ erzeugt Termin) | übernehmen, z. B. für Zusatzproben |
| Erinnerungen / Nachfassen | Cron `wartung`: Vortags-Erinnerung, 3 Tage vorher Nachfassen bei fehlender Antwort | übernehmen, Fristen konfigurierbar |
| Kalender | „In meinen Kalender“ (Google/Outlook/.ics), **ICS-Abo-Feed** per Token | übernehmen |
| Push | Web Push (VAPID), Service-Worker-Handler | Muster übernehmen, **eigener Versand** (Club nutzt externen KC-Communicator) |
| E-Mail | über KC-Communication-Router (Brevo) | über austauschbaren Mail-Adapter |
| WhatsApp | `wa.me`-/`whatsapp://`-Übergabe, Fallback `navigator.share` → Zwischenablage | **1:1 übernehmen** (keine kostenpflichtige API) |
| Instrumente-DB | Leih-Modul (`leih_gegenstaende`, `ausleihen` mit Status angefragt → genehmigt → abgeholt → zurück) | Vorlage für **Inventar + Ausleihe von Instrumenten** |
| Teilnehmerliste je Termin | `druckTreffen` mit Zählern Zusage/Vielleicht/Absage/ohne Antwort | übernehmen, ergänzt um Besetzungsprüfung |
| Login ohne Passwort | persönlicher Link-Token + QR-Einrichtungskarte | übernehmen (einfach für ältere Mitglieder) |
| Rollen | admin / vorstand / Ämter, Guards `nurAdmin` usw. | auf Kreis-Rollen umdeuten |
| Offline / Notbetrieb | signierte Vorab-Antworten + Schreib-Eingang (auch für Zusagen) | **Phase 2**, Muster übernehmen |
| Update ohne Mischstand | `sw.js` mit `jetzt-aktivieren` → `skipWaiting`, Versionsvertrag-Test | 1:1 übernehmen |

### Bewusst NICHT übernommen
Spiele, Rezepte, Fitness, Börse, Erstattung/Kasse, Büro, Schulungen/Hausbesuche,
DP2/Twinkey-Dienstplan, Anruf/Video, Standort/SOS, Wetter, Köcheclub-Branding,
„Hansi“-Sonderlogik.

### Warum kein Fork
- `app.js` = 2,7 MB / 25.669 Zeilen, Server `kc-club/index.ts` = 11.875 Zeilen mit ~340 Aktionen.
- „Köcheclub Werne“ ~245×, „Hansi“ ~700× fest eingebaut, Supabase-Projekt-ID in 6+ Dateien.
- Hängt an externen Kernen (`kc_core_people`, KC-Communicator, Push-Tabellen), die es im Bach Kreis nicht gibt.
- Kein Mandantenfeld.

→ **Herauslösen statt Löschen:** Wir bauen ein schlankes neues Repo und
übernehmen gezielt Datenmodell, Algorithmen und UI-Muster (mit Quellverweis).

---

## 3. Fachliches Modell

### 3.1 Personen & Besetzung
- **Teilnehmer**: Name, Kontakt (Mail, Mobil für WhatsApp), Stimme/Register,
  Status (aktiv / pausiert / Gast / Aushilfe),
  Benachrichtigungswunsch je Kanal, Ruhezeit.
- **Register / Stimmgruppen** (Registry, nicht fest codiert):
  z. B. Sopran, Alt, Tenor, Bass, Violine I/II, Viola, Cello, Kontrabass,
  Holz, Blech, Pauke, Continuo/Orgel. Jeder Kreis pflegt seine Liste selbst.
- **Weitere Verteiler**: Chor, Orchester, Solisten, Vorstand – für zielgerichtete Einladungen.

### 3.1a Gruppen A / B / C / D
- Gruppen-Registry, Standard **A, B, C, D** (Name, Farbe, Sortierung, Beschreibung);
  weitere Gruppen kann die Leitung ergänzen – nichts fest codiert.
- Jeder Teilnehmer hat **genau eine Stammgruppe** (Zuordnung mit „gültig ab“).
- **Gruppenwechsel**:
  - **generell** – neue Stammgruppe ab Datum X; die alte Zuordnung bleibt als
    Historie erhalten (`gueltig_bis` wird gesetzt), Auswertungen der Vergangenheit
    bleiben korrekt.
  - **temporär** – Gastzuordnung zu einer anderen Gruppe für einen **Zeitraum**,
    ein **Projekt** oder **einzelne Termine** (z. B. „Anna spielt im
    Weihnachtsoratorium in Gruppe C mit“). Läuft automatisch aus; danach gilt
    wieder die Stammgruppe.
  - Wechsel durch Leitung; optional **Wechselwunsch** durch Teilnehmer
    (Antrag → Freigabe durch Leitung), jeweils mit Protokoll (wer, wann, warum).
- **Wirksame Gruppe** zu einem Termin = temporäre Zuordnung falls vorhanden,
  sonst Stammgruppe zum Termindatum. Diese Regel steuert Einladungen,
  Besetzungsampel, Notenzuteilung und Auswertungen.
- Termine können an eine oder mehrere Gruppen gerichtet sein
  („Probe Gruppe A + B“). Bei Gruppenwechsel nach Einladung: Einladung wird
  nachgezogen bzw. entfernt, bereits gegebene Antworten bleiben erhalten und
  werden markiert.
- Ansichten: Gruppenübersicht mit Mitgliedern je Register, Drag & Drop bzw.
  Auswahl-Dialog zum Verschieben (Auswahl statt Freitext), Filter „nur temporär
  verschobene“.

### 3.1b Mehrere Instrumente je Teilnehmer
- Ein Teilnehmer kann **beliebig viele Instrumente/Stimmen** haben
  (z. B. Violine + Viola, Sopran + Blockflöte).
- Je Zuordnung: **Hauptinstrument** ja/nein, optional Niveau/Bemerkung,
  „eigenes Instrument vorhanden“ ja/nein (sonst Bedarf aus Inventar).
- **Besetzung je Termin/Projekt**: Bei Mehrfach-Instrumentalisten legt die
  Leitung (oder der Teilnehmer bei der Zusage) fest, **mit welchem Instrument**
  er bei diesem Termin spielt. Standard = Hauptinstrument.
- Besetzungsampel zählt jede Person nur **einmal** pro Termin – in dem
  Register des gewählten Instruments; als „könnte auch“ werden alternative
  Instrumente angezeigt (Hilfe zum Ausgleichen roter Register).

### 3.2 Instrumente-DB (zwei Sichten)
1. **Instrumententypen** (Katalog): Violine, Cello, Oboe d'amore, Truhenorgel …
   → verknüpft mit Registern, dient der Besetzungsplanung.
2. **Inventar** (Instrumente im Besitz des Kreises): Inventarnr., Typ,
   Zustand, Standort, Versicherung/Wert, Wartung/Stimmung fällig,
   Fotos/Dokumente, **Ausleihe** an Teilnehmer (Workflow aus Club-Leihmodul).
   Ausbaustufe: Transport-/Aufbauplanung je Termin (z. B. Truhenorgel zum Konzertort).

### 3.2a Notenarchiv
**Aufbau**
- **Werk**: Komponist, Titel, BWV/Werkverzeichnis-Nr., Besetzung, Verlag/Ausgabe,
  Dauer, Schlagworte, Rechte-/Lizenzhinweis.
- **Stimme (Part)**: gehört zu einem Werk, z. B. „Partitur“, „Klavierauszug“,
  „Violine I“, „Oboe d'amore II“, „Continuo“, „Sopran“.
  Jede Stimme ist einem oder mehreren **Instrumententypen / Registern** zugeordnet.
- **Datei**: PDF (Ansicht im Browser via pdfjs, wie in der Club-App), optional
  Audio-Übungsdatei (z. B. Stimme zum Mitsingen); Version/Ausgabe, Upload-Datum.
- **Physisches Exemplar** (optional): Notenmappen/Hefte mit Inventarnr.,
  Ausgabe an Teilnehmer und Rückgabe – gleicher Ausleih-Workflow wie Instrumente.

**Zuordnung**
- Werk → **Projekt** („Weihnachtsoratorium 2026“: Kantaten I–III) und
  optional → **einzelne Termine** („heute: Nr. 1–9“) als Probenplan.
- Stimme → **Instrument/Register** (Grundregel) und bei Bedarf
  → **Gruppe** (z. B. Gruppe A spielt Violine I, Gruppe B Violine II)
  → oder direkt → **Person** (Sonderzuteilung, z. B. Solostimme).

**Wer sieht was** (automatisch, Auswahl statt Suche)
- Teilnehmer sieht unter „Meine Noten“ genau die Stimmen, die zu
  *seinen Instrumenten* × *seiner wirksamen Gruppe* × *seinen Projekten/Terminen*
  passen. Mehrfach-Instrumentalisten sehen alle passenden Stimmen, die für den
  Termin gewählte zuerst.
- Bei temporärem Gruppenwechsel wechseln die angezeigten Stimmen mit.
- Leitung/Notenwart sieht das gesamte Archiv inkl. Partituren.
- Hinweis in der Termin-Einladung: „Bitte mitbringen: Stimme Violine II, Nr. 1–9“.

**Rechte & Kosten**
- Nur Nutzer mit Login (Link-Token) erhalten Zugriff; Download über kurzlebige,
  signierte URLs; kein öffentlicher Ordner (anders als `dokumente/` der Club-App).
- Urheberrecht: Archiv kennzeichnet je Datei „gemeinfrei / lizenziert /
  nur intern“; Lizenzen werden nicht von der App geprüft – Verantwortung beim Kreis.
- **Speicher-Engpass**: Supabase Free Storage = 1 GB. Noten-PDFs schnell
  50–100 MB pro Werk → Speicher über austauschbaren Storage-Adapter
  (Supabase Storage, Cloudflare R2 Free 10 GB, ggf. vorhandenes B2-Backup aus
  KICC) – Zero-Cost-Check nötig.

### 3.3 Terminarten (Registry)
| Art | Typische Eigenschaften |
|---|---|
| Übungsprobe (regulär) | Serien-/Wiederholtermin (z. B. jeden Di 19:30), Zielgruppe Chor/Orchester/Register |
| Registerprobe | nur bestimmte Register eingeladen |
| Generalprobe | Pflichttermin, an Konzert gekoppelt |
| Premiere / Konzert | Treffpunkt, Einsingzeit, Kleiderordnung, Programm, Besetzungssoll |
| Orchestertermin | Orchesterprobe/Dienst, ggf. Aushilfen/Externe |
| Sonstiges | Vorstandssitzung, Ausflug … |

Termine können zu einem **Projekt** gehören (z. B. „Weihnachtsoratorium 2026“):
Projekt = Proben + Generalprobe + Aufführung(en) + Besetzungssoll + Noten.

### 3.4 Antworten
- `zusage` / `vielleicht` / `absage` / *keine Antwort* (wird **nie** als Zusage gezählt).
- Optional: Notiz („komme 20 min später“), Begründung bei Absage.
- **Antwortfrist** je Termin; danach Nachfassen, nach Frist Antwort nur noch durch Leitung.
- **Serien-Antwort**: „Ich kann alle Dienstage im November nicht“ (Abwesenheitszeitraum) → setzt Absagen automatisch, Einzeltermine bleiben änderbar.
- **Tatsächliche Anwesenheit** (Präsenzliste) getrennt von der Zusage – Grundlage für echte Auswertungen.

### 3.5 Besetzungsampel (neu, Kernnutzen)
Je Termin Soll-Besetzung pro Register (z. B. Sopran ≥ 4, Cello ≥ 2).
Anzeige pro Register: Zusagen / Vielleicht / Soll →
**grün** (erfüllt) · **gelb** (nur mit Vielleicht erfüllt) · **rot** (unterbesetzt) · **grau** (zu wenige Antworten = UNBEKANNT, nie grün).
Rot → Aktion „Aushilfe anfragen“ bzw. gezielte Nachricht an das Register.

---

## 4. Funktionen (mit vorläufigen Feature-IDs)

| ID | Funktion | Quelle | Phase |
|---|---|---|---|
| BK-F01 | Teilnehmerverwaltung + Register/Gruppen-Registry | Club Mitglieder (neu modelliert) | 1 |
| BK-F02 | Link-/QR-Login, Rollen (Leitung, Registerführer, Mitglied, Gast) | Club `link_erzeugen`, `ichAus` | 1 |
| BK-F03 | Terminarten-Registry, Einzel- & Serientermine, Projekte | `treffen` + neu | 1 |
| BK-F04 | Zusage / Vielleicht / Absage mit Notiz, Frist, Serien-Abwesenheit | `teilnahme` + neu | 1 |
| BK-F05 | Terminplan: Liste, Monat, „Meine Termine“, Filter nach Art/Projekt/Register | Club Kalender | 1 |
| BK-F06 | Besetzungsampel je Termin | neu | 1 |
| BK-F07 | Push-Benachrichtigung (neuer Termin, Änderung, Absage, Erinnerung, Nachfassen) | Club `sw.js` + VAPID | 1 |
| BK-F08 | E-Mail (Einladung mit .ics, Erinnerung) über Mail-Adapter | Club Router-Muster | 1 |
| BK-F09 | WhatsApp-Übergabe (Einzeln, Register, Gruppe; Textvorlagen) | Club `waSenden` | 1 |
| BK-F10 | ICS-Abo-Feed + „In meinen Kalender“ | Club `kalender_abo` | 1 |
| BK-F11 | Instrumente: Katalog + Inventar + Ausleihe | Club Leihmodul | 2 |
| BK-F12 | Präsenzliste (tatsächliche Anwesenheit) | neu | 2 |
| BK-F13 | Auswertungen + Export CSV/PDF | Club `druckTreffen` + neu | 2 |
| BK-F14 | Terminfindung (Doodle) für Zusatzproben | Club `terminumfragen` | 2 |
| BK-F15 | Mitfahrgelegenheiten zu Proben/Konzerten | Club `mitfahrt` | 3 |
| BK-F16 | Notenarchiv: Werke, Stimmen, Dateien, Zuordnung zu Instrument/Gruppe/Person/Projekt/Termin, „Meine Noten“ | Club Archiv + pdfjs + neu | **2** |
| BK-F17 | Offline-/Notbetrieb (signierte Vorab-Antworten, Schreib-Eingang) | Club Notbetrieb | 3 |
| BK-F18 | Mandantenfähigkeit (`kreis_id`) für weitere Chöre/Ensembles | neu | optional |
| BK-F19 | Gruppen A/B/C/D (Registry), Stammgruppe, Gruppenwechsel generell (mit Historie) und temporär (Zeitraum/Projekt/Termin), Wechselwunsch + Protokoll | neu | **1** |
| BK-F20 | Mehrere Instrumente je Teilnehmer (Haupt/Neben), Instrumentwahl je Termin/Projekt | neu | **1** |
| BK-F21 | Notenexemplare (Papier) ausgeben/zurücknehmen | Club Leihmodul | 3 |

---

## 5. Auswertungen

- **Je Termin**: Zusagen/Vielleicht/Absagen/offen, je Register, Besetzungsampel, Druckliste.
- **Je Person**: Antwortquote, Zusagequote, tatsächliche Anwesenheit (aus Präsenzliste), Pünktlichkeit der Antwort.
- **Je Register**: durchschnittliche Besetzung, „Problemtermine“.
- **Je Projekt**: Probenbeteiligung bis zur Aufführung, wer hat < X % der Proben besucht (Hinweis an Leitung, keine Automatik).
- **Zeitverlauf**: Beteiligung pro Monat/Saison.
- **Export**: CSV (fehlt in der Club-App heute) und PDF über Druckansicht.
- Datenschutz: Personenbezogene Quoten nur für Leitung sichtbar; Mitglieder sehen nur eigene Werte.
- Alle Kennzahlen mit Zeitstempel „Stand“; fehlende Daten werden als UNBEKANNT gezeigt, nie als 0 % oder OK.

---

## 6. Benachrichtigungen

Ein **Benachrichtigungs-Dienst** mit austauschbaren Kanal-Adaptern:

| Kanal | Adapter | Kosten |
|---|---|---|
| Push | Web Push (VAPID) direkt aus Edge Function | 0 € |
| E-Mail | SMTP-/Free-Tier-Adapter (z. B. Brevo-Free oder vorhandenes Postfach) | 0 € im Freikontingent – Limit prüfen |
| WhatsApp | **nur Übergabe** (`wa.me`, Share-API, Zwischenablage) – Mensch drückt „Senden“ | 0 € |
| Kalender | ICS-Anhang + Abo-Feed | 0 € |

Ereignisse: Termin neu · geändert · abgesagt · Erinnerung (Vortag / X Std.) ·
Nachfassen (keine Antwort bis Frist − 3 Tage) · Besetzung rot · Ausleihe fällig.
Je Person wählbar, welcher Kanal für welches Ereignis; Ruhezeit („nicht stören“).

WhatsApp-Business-API wird **nicht** genutzt (kostenpflichtig) – Zero-Cost-Gate.

---

## 7. Technische Architektur (Vorschlag)

- **Frontend**: Vanilla-JS-PWA wie die Club-App (kein Build, läuft auf alten
  Handys), aber **modular** (ES-Module pro Bereich statt eines 2,7-MB-Monolithen).
- **Backend**: Supabase Free (Postgres + Edge Functions + pg_cron).
  Zugriff wie in der Club-App ausschließlich über eine Edge Function,
  **zusätzlich** echte RLS-Policies als zweite Verteidigungslinie.
- **Hosting**: GitHub Pages oder Cloudflare Pages (Free).
- **Konfiguration statt Hartcodierung**: Name, Farben, Logo, Texte, Register,
  Terminarten, Fristen in Konfigurationstabelle; Projekt-URL nur an einer Stelle.
- **Adapter**: Mail, Push, Kalender jeweils hinter Interface (AGENTS.md Regel 4/18).
- **Übernommen 1:1**: `sw.js`-Update-Mechanik, Versionsvertrag (`version.json`
  + Test), Test „jede Client-Aktion existiert im Server“, Test „keine Secrets im Browser“.
- **KICC-Anbindung**: Bach-Kreis-App wird in der KICC-Produkt-Registry als
  Programm registriert (Heartbeat/Version), KICC bleibt aber reiner Beobachter
  (Regel 12: kein Single Point of Failure).

### Datenmodell-Skizze (Präfix `bk_`)
```
bk_person(id, name, mail, mobil, status, ruhezeit, login_token_hash, …)
bk_register(id, name, gruppe, sort)                     -- Registry
bk_gruppe(id, kuerzel, name, farbe, sort, aktiv)          -- Registry: A, B, C, D …
bk_gruppe_zuordnung(id, person_id, gruppe_id, art,        -- art: 'stamm' | 'temporaer'
          gueltig_von, gueltig_bis, projekt_id, termin_id, grund, erstellt_von)
bk_gruppe_wechselwunsch(id, person_id, ziel_gruppe_id, art, von, bis, status)
bk_instrument_typ(id, name, register_id)
bk_person_instrument(person_id, instrument_typ_id, haupt bool, niveau,
          eigenes_instrument bool, bemerkung)              -- n Instrumente je Person
bk_termin_besetzung(termin_id, person_id, instrument_typ_id)  -- „spielt heute mit …“
bk_werk(id, komponist, titel, werkverzeichnis, verlag, besetzung, rechte, …)
bk_stimme(id, werk_id, bezeichnung, sort)
bk_stimme_zuordnung(stimme_id, instrument_typ_id|register_id, gruppe_id NULL)
bk_stimme_person(stimme_id, person_id, projekt_id)         -- Sonderzuteilung
bk_notendatei(id, stimme_id, speicher_adapter, pfad, art, version, groesse, rechte)
bk_projekt_werk(projekt_id, werk_id, sort)
bk_termin_werk(termin_id, werk_id, abschnitt)              -- Probenplan „Nr. 1–9“
bk_notenexemplar(id, stimme_id, inventar_nr, zustand)     -- Phase 3
bk_instrument(id, inventar_nr, typ_id, zustand, standort, wert, wartung_faellig, …)
bk_ausleihe(id, instrument_id, person_id, von, bis, status)
bk_terminart(id, schluessel, name, farbe, pflicht bool)  -- Registry
bk_projekt(id, titel, von, bis, beschreibung)
bk_serie(id, regel, terminart_id, zielgruppe)
bk_termin(id, terminart_id, projekt_id, serie_id, titel, beginn, ende, ort,
          treffpunkt, antwort_frist, status, …)
bk_termin_einladung(termin_id, gruppe_id|register_id|person_id)
bk_termin_soll(termin_id, register_id, anzahl)
bk_antwort(termin_id, person_id, antwort, notiz, geaendert_am)
bk_abwesenheit(person_id, von, bis, grund)
bk_anwesenheit(termin_id, person_id, anwesend, erfasst_von)
bk_benachrichtigung_wahl(person_id, ereignis, kanal)
bk_versand_protokoll(id, ereignis, kanal, person_id, status, zeit)
bk_push_abo(person_id, endpoint, keys)
bk_kalender_abo(person_id, token_hash)
bk_konfig(schluessel, wert jsonb)
```

---

## 8. Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 0 | Entscheidungen (Abschnitt 9), Repo anlegen, Zero-Cost-Check, Grundgerüst aus Club-Mustern (sw.js, Versionsvertrag, Tests) | lauffähige leere PWA, DEV |
| 1 | BK-F01 … F10, F19, F20: Teilnehmer, Gruppen A–D inkl. Wechsel, Mehrfach-Instrumente, Login, Termine, Antworten, Terminplan, Besetzungsampel, Push/Mail/WhatsApp, ICS | **nutzbarer Kern**, RC für Testgruppe |
| 2 | BK-F11 … F14, F16: Instrumente-Inventar, Präsenz, Auswertungen + CSV, Terminfindung, **Notenarchiv** | FINAL 1.0 |
| 3 | BK-F15, F17, F21: Mitfahrten, Notbetrieb, Papier-Notenexemplare | 1.x |

Jede Phase: Regression, Visual-TÜV, Security, Release-TÜV (AGENTS.md Regel 9).

---

## 9. Offene Entscheidungen

1. **Eigenes Repo** (Vorschlag: `Sire65/BachKreis-Terminplan`) oder Unterordner? → Empfehlung: eigenes Repo.
2. **Eigenes Supabase-Projekt** oder Tabellen im bestehenden KC-Projekt? Supabase Free erlaubt nur 2 aktive Projekte → prüfen, welche schon belegt sind.
3. **Wer ist der Bach Kreis?** Nur Chor, Chor + Orchester, wie viele Personen (≈ 20 / 50 / 100+)? Bestimmt Register-Liste und Versandmengen.
4. **Instrumente-DB**: Inventar des Kreises, Instrumente der Mitglieder, oder beides?
5. **Login**: Link-Token wie Club-App (einfach) oder zusätzlich PIN?
6. **E-Mail-Absender**: eigene Adresse des Kreises? Welcher kostenfreie Dienst?
7. **Mandantenfähigkeit** von Anfang an (`kreis_id`) – sinnvoll, wenn später weitere Ensembles dazukommen.
8. **Externe/Aushilfen**: Sollen Aushilfsmusiker ohne Konto per Link zu-/absagen können (wie `termin.html` in der Club-App)?
9. **Datenschutz**: Wer darf Telefonnummern und Anwesenheitsquoten sehen?
10. **Verhältnis zu KICC**: nur Registrierung/Heartbeat, oder mehr?
11. **Bedeutung der Gruppen A–D**: Leistungs-/Besetzungsgruppen, Probengruppen
    (z. B. wechselnde Probenabende) oder Teilensembles? Gehört jeder Teilnehmer
    immer genau einer Gruppe an, oder gibt es auch „keine Gruppe“?
12. **Gruppenwechsel**: Darf der Teilnehmer selbst einen Wunsch stellen, oder nur die Leitung umsetzen?
13. **Notenzuteilung**: reicht Instrument (+ Gruppe), oder werden Stimmen oft individuell an Personen vergeben?
14. **Noten-Speicher**: geschätzte Menge (Anzahl Werke/PDFs)? Entscheidet über Storage-Adapter.
15. **Notenwart**: Gibt es eine eigene Rolle für die Pflege des Archivs?
