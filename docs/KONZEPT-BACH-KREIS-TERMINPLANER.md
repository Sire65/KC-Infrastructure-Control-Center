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
  gespielte Instrumente, Status (aktiv / pausiert / Gast / Aushilfe),
  Benachrichtigungswunsch je Kanal, Ruhezeit.
- **Register / Stimmgruppen** (Registry, nicht fest codiert):
  z. B. Sopran, Alt, Tenor, Bass, Violine I/II, Viola, Cello, Kontrabass,
  Holz, Blech, Pauke, Continuo/Orgel. Jeder Kreis pflegt seine Liste selbst.
- **Gruppen**: Chor, Orchester, Solisten, Vorstand – für zielgerichtete Einladungen.

### 3.2 Instrumente-DB (zwei Sichten)
1. **Instrumententypen** (Katalog): Violine, Cello, Oboe d'amore, Truhenorgel …
   → verknüpft mit Registern, dient der Besetzungsplanung.
2. **Inventar** (Instrumente im Besitz des Kreises): Inventarnr., Typ,
   Zustand, Standort, Versicherung/Wert, Wartung/Stimmung fällig,
   Fotos/Dokumente, **Ausleihe** an Teilnehmer (Workflow aus Club-Leihmodul).
   Ausbaustufe: Transport-/Aufbauplanung je Termin (z. B. Truhenorgel zum Konzertort).

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
| BK-F16 | Noten/Dokumente je Projekt (PDF-Anzeige) | Club Archiv + pdfjs | 3 |
| BK-F17 | Offline-/Notbetrieb (signierte Vorab-Antworten, Schreib-Eingang) | Club Notbetrieb | 3 |
| BK-F18 | Mandantenfähigkeit (`kreis_id`) für weitere Chöre/Ensembles | neu | optional |

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
bk_person_register(person_id, register_id, haupt bool)
bk_instrument_typ(id, name, register_id)
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
| 1 | BK-F01 … F10: Teilnehmer, Login, Termine, Antworten, Terminplan, Besetzungsampel, Push/Mail/WhatsApp, ICS | **nutzbarer Kern**, RC für Testgruppe |
| 2 | BK-F11 … F14: Instrumente, Präsenz, Auswertungen + CSV, Terminfindung | FINAL 1.0 |
| 3 | BK-F15 … F17: Mitfahrten, Noten, Notbetrieb | 1.x |

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
