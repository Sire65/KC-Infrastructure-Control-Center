# Konzept „frooters Team-App“ (Arbeitstitel)

**Stand:** 29.10.2026 (Fassung 2: Franchise, Kundenbereich, frooters-Design) · **Status:** KONZEPT (vor DEV) · **Feature-Präfix:** `FR-`
**Grundbaustein:** KC-Clubapp (Köcheclub Werne), Aufbau, Kerne und Regeln werden übernommen.
**Vertrag:** Es gilt der KC-Entwicklervertrag (`AGENTS.md`), vor allem Zero-Cost, Registry/Adapter, „UNKNOWN nie als OK“, atomare Updates, keine Secrets im Browser und DEV → RC → FINAL.

---

## 1. Recherche: Wer ist frooters?

| Thema | Ergebnis der Recherche | Folge für die App |
|---|---|---|
| Betreiber | Genussmanufaktur GmbH & Co. KG, gegründet 2011. Gründer und Inhaber ist Christian Kötterheinrich (vorher Modebranche, ab 2010 Berater). | Mandant „Genussmanufaktur“ ist die oberste Ebene, Inhaberrolle mit Sicht auf alles. |
| Marken | **frooters** (Wellness-Food) und seit 2016 **Pick-Nick**, der „kleine Bruder“. | Ebene **Marke** zwischen Unternehmen und Filiale, damit Pick-Nick später ohne Umbau dazukommen kann. |
| Filialen (offizielle Seite) | Essen (Limbecker Platz), Kempten (Reischmann), Minden (Kaufhaus Hagemeyer), Oberhausen (Westfield Centro, Promenade), Ochtrup (Designer Outlet), Sinsheim (Therme). | Filialen werden als Stammdaten gepflegt, nicht im Code. |
| Weitere Standorte (nur Verzeichnisse, ungeprüft) | Dortmund (Thier-Galerie), Oldenburg, Essen-Altenessen. Die Einträge sind teils älter. | Beim Start mit dem Inhaber abgleichen, welche Filialen es aktuell gibt. |
| Flächen und Lage | 15 bis 90 m², fast immer in Einkaufszentren, Kaufhäusern, Outlet oder Therme. | Eigene **Öffnungszeiten je Filiale**, oft vom Center vorgegeben (z. B. 10 bis 20 Uhr, Fr/Sa bis 22 Uhr, Outlet sonntags zu). Kleine Teams und Einzelbesetzung kommen vor, daher Alleinarbeit und Springer mitdenken. Das WLAN im Center ist oft schwach, deshalb **Offline-Fähigkeit**. |
| Sortiment | Frozen Yogurt mit Saucen und Toppings, Obstsalate, Smoothies, frisch gepresste Säfte, handgemachtes Eis am Stiel, Quark und Pudding, neu Porridge und Milchreis, außerdem Waffeln, Baguettes und Toast. | Daraus ergeben sich die **Warengruppen** fürs Rezeptbuch (Kap. 6.4). |
| Qualitätsversprechen | Täglich frisch von Hand zubereitet, mehrmals am Tag nachgefüllt, regionale Lieferanten wo möglich. Fast alles ist glutenfrei (Ausnahme Waffeln und einige Toppings). | **Hygiene** und **Allergene** sind Kernfunktionen. Standzeiten und Nachproduktion gehören in die Tagesaufgaben. |
| Motto | „Du hast die Wahl. Du hast die Fantasie.“ | Passt zu Frootie und zum Ton der App. |
| Auszeichnungen | Retailer-Award 2012 (ECE), Store of the Year 2013 (HDE), 2014 nominiert als Bahnhofsshop des Jahres (DB). | Können im Startbild und in den Infos zum Unternehmen erscheinen. |
| Franchise | frooters ist auch ein Franchise-Konzept (Angabe des Auftraggebers, öffentlich nicht weiter belegt). | Die App muss **mandantenfähig** sein: eigene Filialen und Franchisenehmer auf einer Plattform, Daten streng getrennt (Kap. 4.4). |
| Design | Auf frooters.de: Salbei `#A3A983`, Rot `#C10230`, Grün `#76BC21`, Schrift fast schwarz `#1D1D1B`. Schriften Arvo (Überschriften), Didact Gothic (Text), Quicksand (Seitentitel). Logo als SVG mit Apfel-Bildmarke. | Grundlage für das Design der App, verbindlich erst nach Freigabe durch frooters. |
| Wachstum | Ziel sind frooters-Filialen in vielen Städten. Bewerbungen gehen initiativ mit Angabe des Standorts an bewerbungen@frooters.eu. | Das System muss mit vielen Filialen und Bezirken skalieren. Bewerbung und Einstellung kann später ein Modul werden. |

Quellen stehen am Ende (Kap. 15). Die Angaben zu Standorten widersprechen sich teilweise. Vor dem Start müssen Filialliste, Firmierung und Rollen mit dem Inhaber bestätigt werden.

---

## 2. Zielbild

**Eine Plattform mit drei Oberflächen und einem Server:**

| Oberfläche | Für wen | Wofür |
|---|---|---|
| 📱 **Team-App** (Handy, PWA wie die Club-App) | alle: Aushilfe bis Inhaber | Nachrichten, Termine, Pinnwand, Rezepte, eigener Dienstplan, Wünsche, Fehltage, Stempeln, Hygiene-Aufgaben, Frootie, Videos |
| 📟 **Stand-Tablet** (Kiosk-Modus, je Filiale ein Gerät) | Team am Stand | Stechuhr (Ausweis-QR), Hygiene-Tagesliste zum Abhaken, Messwerte, Tagesinfo. Funktioniert auch ohne privates Handy. |
| 🖥️ **frooters Zentrale** (PC, Browser/PWA) | Shopleitung, Bezirksleitung, Inhaber, Büro, Franchisenehmer, Systemzentrale | Stammdaten, Mitarbeiter aufnehmen, Rezepte pflegen, Hygienepläne, große Einsatzplanung, Auswertungen pro Shop und kumuliert, Lohnexport, Rechte, Audit |
| 🛒 **Kundenbereich** (Web-App für Kunden + Bestellterminal im Shop) | Kunden | Sortiment mit Fotos, Allergenen und Preisen je Filiale, Becher zusammenstellen, Warenkorb, Vorbestellung zur Abholung (Kap. 6.11) |

Die drei Mitarbeiter-Oberflächen sprechen nur mit **einem Server** (Supabase Edge Function `fr-app`, Muster wie `kc-club`). Der Kundenbereich hat einen **eigenen, getrennten Server** (`fr-kunde`), der nur Sortiment lesen und Bestellungen anlegen kann. Die Datenbank ist für keine Oberfläche direkt offen.

```
 Handy-PWA ─┐
 Stand-Tablet ─┼──TLS──► Edge Function fr-app ──► Supabase Postgres (Frankfurt, RLS)
 PC-Zentrale ─┘          (Rechte, Regeln,          │  Storage (Fotos, Belege)
                          Audit, Push/Mail)        │
                                                   ├─► Neon-Spiegel Frankfurt (alle 6 h) + Tagesbackup
                                                   └─► verschlüsselte Kopie außer Haus (B2, unveränderlich)
 KICC (Leitstand) ◄── Heartbeat/Status (lesend, kein Single Point of Failure)
```

---

## 3. Was aus der Club-App übernommen wird

| Club-App-Baustein (vorhanden) | In der frooters-App | Änderung |
|---|---|---|
| 💬 Nachrichten (KC Communicator, Lesebestätigung ✓✓, Anlagen) | 💬 **Nachrichten** an Person, Filiale, Bezirk, Rolle, alle | Neu ist die **Pflicht-Info**: Anweisungen müssen mit „Gelesen und verstanden“ bestätigt werden, die Leitung sieht, wer offen ist (wie „📭 Ungelesen“). |
| 📅 Termine (Zu-/Absage, Erinnerung am Vortag) | 📅 **Termine**: Teamrunde, Schulung, Inventur, Lieferung, Belehrung | Termine können für eine Filiale, einen Bezirk oder alle gelten. |
| 📌 Pinnwand (Zettel, Farben, wichtig/erledigt, Push) | 📌 **Pinnwand** je Filiale und unternehmensweit | Zettel können ablaufen, zum Beispiel „Aktion bis Sonntag“. |
| 📖 Rezeptbuch (Kategorie, Portionen umrechnen, drucken) | 📖 **Rezepte nach Warengruppen** | Neu: Allergene, Becher- und Größenvarianten, Freigabe durch die Zentrale, Arbeitsvideo (Kap. 6.4). |
| 🗓️ Dienstpläne, Mein Dienst (Wunsch → Soll → Ist), 📝 Dienstwunsch mit Twinkey | 🗓️ **Einsatzplanung** + 📝 **Wünsche** mit Frootie | Stark ausgebaut für mehrere Filialen, Regeln und Springer (Kap. 6.6). |
| 🪪 Ausweis-QR für Kasse und Stechuhr, `kc_dp_stempel` und Stempel-Paare | ⏱️ **Stechuhr** | Stand-Tablet, Pausen, Korrekturen mit Freigabe (Kap. 6.5). |
| 🟢 Mein Status (Urlaub, krank, abwesend) | 🏖️ **Fehltage**: Antrag, Genehmigung, Konten | Wird ein Arbeitszeit-Fachmodul (Kap. 6.7). |
| 🎬 Erklär-Videos (Rundgänge mit Ton, Piper-Stimme), ❓ Hilfezentrum, 🔍 Suche, 🧭 Einstellungen erklärt | 🎬 **Videoanleitungen für jede Funktion** + Arbeitsvideos | Gilt als Pflicht je Feature (Kap. 8). |
| 🧑‍🍳 Twinkey (Frag Twinkey, Tipps, Dienstwunsch-Dialog) | 🍓 **Frootie** | Neue Figur, gleiche Mechanik (Kap. 7). |
| Kacheln mit `nur:`-Bedingungen, einfache/erweiterte Ansicht, Register | Kacheln je **Rolle und Filiale** | Kap. 9 |
| 🎓 Schulungen, 📚 Meine Dokumente, 🔐 Meine Daten, ✏️ Änderung melden, 💭 Feedback, 🙋 Unterstützung | gleich | Schulungen bekommen Pflichtschulungen und Nachweise (Hygiene-Belehrung). |
| Persönlicher Zugangslink (Token nur als SHA-256, sofort aus der Adresszeile) | gleich, plus Geräte-PIN | Kap. 11 |
| Versionsvertrag (`APP_VERSION` = `sw.js` = `version.json`), atomares Update | gleich | Kein Mischstand alter und neuer Dateien. |
| Gebündeltes Einspielen (12/20 Uhr), „Ruhe prüfen“, Programmteile nachladen (`teile/`) | gleich, aber Einspielen **außerhalb der Öffnungszeiten** | Nicht während Stoßzeiten im Shop. |
| Neon-Spiegel, Backup-Worker, Verify, Notbetrieb | gleich, eigenes Projekt | Kap. 10 |

**Nicht übernommen** (vereinsspezifisch): Clubabend, Vorschläge/Abstimmungen, Spiele, Bühne/Club-Song, Helfen & Leihen, Aktionen/Reisen, Erstattung. Spiele und Abstimmungen könnten später als „Team-Spaß“ zuschaltbar sein.

---

## 4. Organisations- und Rollenmodell

### 4.1 Ebenen

```
Unternehmen (Genussmanufaktur GmbH & Co. KG)
 └─ Marke (frooters, Pick-Nick …)
     └─ Bezirk (z. B. „Ruhr“, „Nord“, „Süd“)
         └─ Filiale (Essen Limbecker Platz, Minden Hagemeyer …)
             └─ Station (Theke, Froyo-Maschine 1, Kühlvitrine, Lager …)  ← für Hygiene und Geräte
```

Eine Person kann **in mehreren Filialen** arbeiten (Springer, Aushilfe für zwei Shops). Deshalb wird die Rolle nicht an die Person gehängt, sondern an die **Beschäftigung**: Person × Filiale bzw. Bezirk × Rolle × Zeitraum.

### 4.2 Rollen

| Rolle | Geltungsbereich | Kurzbeschreibung |
|---|---|---|
| 🧃 **Aushilfe** (Minijob, Werkstudent, Saison) | eigene Filiale(n) | Eigene Daten, Stempeln, Wünsche, Hygiene abhaken, Rezepte lesen |
| 🍓 **Mitarbeiter** (Teil-/Vollzeit) | eigene Filiale(n) | wie Aushilfe, dazu Schichttausch anbieten, Pinnwand |
| 🥝 **Stellv. Shopleitung** | eine Filiale | vertritt die Shopleitung. Was sie darf, legt die Shopleitung fest (Standard: planen, genehmigen, aber keine Lohndaten). |
| 🍍 **Shopleitung** | eine Filiale (selten zwei) | Einsatzplanung, Genehmigungen, Korrekturen, Hygiene-Kontrolle, Team-Nachrichten, Auswertung der Filiale |
| 🗺️ **Bezirksleitung** | mehrere Filialen (Bezirk) | alles der Shopleitung für ihre Filialen, Vergleich der Filialen, Springer zwischen Filialen, Eskalationen |
| 👑 **Inhaber / Geschäftsführung** | Unternehmen | sieht alles, **pro Shop und kumuliert**, Freigaben unternehmensweit |
| 🗂️ **Büro / Lohn** (optional) | Unternehmen | Personalstammdaten, Lohnexport, Fehltage, keine Einsatzplanung |
| 🧪 **Hygiene- und Qualitätsbeauftragte** (optional) | Unternehmen oder Bezirk | pflegt Hygienepläne und Rezepte und kontrolliert die Dokumentation |
| 🛠️ **Admin / Technik** | System | Technik, Zugänge, Systemstatus. Ohne Zusatzrecht **keine** Personal- und Gesundheitsdaten. |

| 🤝 **Franchisenehmer** | eigener Betreiber (seine Filialen) | wie der Inhaber, aber nur für die eigenen Filialen und die eigenen Mitarbeiter |
| 🧭 **Franchise-Betreuung** (Systemzentrale) | zugeordnete Franchisenehmer | sieht vereinbarte Kennzahlen (Hygiene-Quote, Umsatz, Bestellungen), **keine** Personaldaten der Franchisenehmer |
| 🏛️ **Systemzentrale** (Franchisegeber) | ganzes System | pflegt Rezepte, Artikel, Hygienepläne, Videos, Design und Systemhandbuch für alle |

Rollen und Rechte liegen in Tabellen (Registry), nicht im Code. Neue Rollen, zum Beispiel „Azubi“ oder „Trainer“, legt die Zentrale ohne Programmänderung an.

### 4.3 Berechtigungsmatrix (Standard)

L = lesen, E = eigene, B = bearbeiten, G = genehmigen/freigeben, – = nein

| Funktion | Aushilfe | Mitarb. | Stv. SL | Shopleitung | Bezirksl. | Inhaber | Büro |
|---|---|---|---|---|---|---|---|
| Nachrichten senden an Filiale | – | – | B | B | B (Bezirk) | B (alle) | B |
| Pflicht-Info verschicken | – | – | B | B | B | B | – |
| Termine anlegen | – | – | B | B | B | B | B |
| Pinnwand | B | B | B | B | B | B | L |
| Rezepte | L | L | L | L + Hinweis | L + Hinweis | G | – |
| Rezepte pflegen (PC) | – | – | – | – | – | G / QS-Rolle | – |
| Stempeln | E | E | E | E | E | E | – |
| Stempelzeiten korrigieren | Antrag | Antrag | G | G | G | G | L |
| Dienstwünsche abgeben | E | E | E | E | – | – | – |
| Einsatzplan erstellen | – | – | B | B / G | B / G | L | L |
| Schicht tauschen | Antrag | Antrag | G | G | G | – | – |
| Urlaub beantragen | E | E | E | E | E | – | – |
| Urlaub genehmigen | – | – | G (wenn erlaubt) | G | G (Shopleitung selbst) | G | L |
| Krankmeldung | E | E | E + L Team | L Team | L Bezirk | L | L |
| Hygiene abhaken | B | B | B | B | – | – | – |
| Hygiene kontrollieren | – | – | L | G | G | L | – |
| Hygienepläne pflegen | – | – | – | Filiale ergänzen | Bezirk | G | – |
| Mitarbeiter aufnehmen | – | – | – | Antrag / B | B | B | B |
| Stundenlöhne / Lohnexport | – | – | – | L (optional) | L | B | B |
| Auswertungen | eigene | eigene | Filiale | Filiale | Bezirk (je Shop + Summe) | alle (je Shop + Summe) | Lohn |

Die Prüfung der Rechte läuft **immer auf dem Server** (Edge Function und RLS). Die Kacheln in der App blenden nur aus, sie sind keine Sicherheitsgrenze.

### 4.4 Franchise-Modell (FR-MANDANT)

Rechtlich ist jeder Franchisenehmer ein **eigener Arbeitgeber** und für die Daten seiner Mitarbeiter selbst verantwortlich. Die Plattform trennt deshalb zwei Welten:

```
Systemzentrale (Franchisegeber, Genussmanufaktur)
 ├─ Systeminhalte für alle: Artikel, Rezepte, Warengruppen, Hygienepläne, Videos, Design, Systemhandbuch, Pflicht-Infos
 ├─ Betreiber „eigene Filialen“ (Genussmanufaktur) ─ Bezirke ─ Filialen
 ├─ Betreiber „Franchisenehmer A GmbH“ ─ Filialen
 └─ Betreiber „Franchisenehmer B“ ─ Filialen
```

| Thema | Regel |
|---|---|
| Mandant | Neue Ebene **Betreiber** zwischen Marke und Bezirk. Jede Zeile mit Personen- oder Betriebsdaten trägt `betreiber_id`, RLS trennt streng. |
| Systeminhalte | Rezepte, Artikel, Hygienepläne und Videos pflegt die Systemzentrale. Franchisenehmer bekommen sie **verbindlich** (Systemstandard) und dürfen nur freigegebene Felder ergänzen, z. B. eigene Preise, lokale Aktionen, eigene Geräte. |
| Personaldaten | Mitarbeiter, Stempelzeiten, Löhne, Fehltage und Einsatzpläne sieht **nur** der jeweilige Betreiber. Die Systemzentrale sieht sie nicht. |
| Kennzahlen für die Systemzentrale | Nur, was im Franchisevertrag vereinbart ist, z. B. Hygiene-Erfüllungsquote, Umsatz- und Bestellzahlen, Erfüllung von Pflicht-Infos und Schulungen. Gezeigt wird je Filiale und kumuliert, ohne Personenbezug. |
| Kommunikation | Systemzentrale → alle Franchisenehmer (Rundschreiben, Pflicht-Infos). Innerhalb eines Betreibers wie bisher. |
| Datenschutz | Jeder Franchisenehmer schließt einen **Auftragsverarbeitungsvertrag** mit dem Betreiber der Plattform. |
| Aufnahme | Neuer Franchisenehmer = neuer Betreiber per Assistent in der Zentrale: Firma, Filialen, erster Admin, Einladung. Systeminhalte sind sofort da. |
| Ende des Vertrags | Export aller Daten des Franchisenehmers (CSV/PDF), Zugänge enden zum Stichtag, danach Löschung nach den Fristen. Aufbewahrungspflichtige Unterlagen bekommt der Franchisenehmer vorher als Export. |
| Kosten | Mehr Betreiber bedeutet mehr Daten und Nutzer. Ob die kostenlosen Tarife reichen, oder ob eine Lizenzgebühr je Filiale einen bezahlten Tarif trägt, ist eine **Geschäftsentscheidung** des Franchisegebers. |

Technisch bleibt es **ein Supabase-Projekt mit strenger Mandantentrennung**. Ein eigenes Projekt je großem Franchisenehmer bleibt über den Adapter möglich, ist aber nicht der Standard.

---

## 5. Datenmodell (Grundriss)

Präfix `fr_`, alle Tabellen mit RLS. Zugriff nur über `service_role` in der Edge Function, Rechte werden in jeder Migration ausdrücklich vergeben (Regel KC-SUPABASE-GRANTS).

| Bereich | Tabellen (Auswahl) |
|---|---|
| Organisation | `fr_unternehmen`, `fr_marke`, `fr_betreiber` (eigene Filialen oder Franchisenehmer), `fr_bezirk`, `fr_filiale` (Adresse, Center, Öffnungszeiten je Wochentag, Sonderöffnungen), `fr_station` |
| Personen | `fr_person` (an `kc_core_people`-Muster angelehnt), `fr_beschaeftigung` (Person × Filiale/Bezirk × Rolle × von/bis × Vertragsart × Wochenstunden), `fr_qualifikation`, `fr_person_qualifikation` (inkl. Ablaufdatum, z. B. Belehrung) |
| Rechte | `fr_rolle`, `fr_recht`, `fr_rolle_recht`, `fr_vertretung` |
| Zugang | `fr_zugang` (Token-Hash, Gerät, PIN-Hash, zuletzt gesehen), `fr_geraet` (Stand-Tablets) |
| Kommunikation | KC Communicator (Threads, Nachrichten, Anlagen), `fr_pflicht_info_bestaetigung` |
| Termine/Pinnwand | `fr_termin`, `fr_termin_antwort`, `fr_pinnwand` |
| Rezepte | `fr_warengruppe`, `fr_rezept`, `fr_rezept_version`, `fr_rezept_zutat`, `fr_zutat` (Allergene, Zusatzstoffe), `fr_rezept_variante` (Bechergröße) |
| Zeit | `fr_stempel` (Ereignisse, nur anhängen), Ansicht `fr_stempel_paare`, `fr_stempel_korrektur` (Antrag, Begründung, Freigabe) |
| Planung | `fr_schicht_vorlage`, `fr_bedarf` (Filiale × Wochentag × Zeitblock × Mindestbesetzung × Qualifikation), `fr_wunsch`, `fr_plan`, `fr_plan_schicht`, `fr_tausch`, `fr_plan_version` (veröffentlicht) |
| Fehlzeiten | `fr_abwesenheit_art` (Registry), `fr_abwesenheit`, `fr_konto` (Urlaub, Stunden) |
| Hygiene | `fr_hyg_plan` (Vorlage), `fr_hyg_aufgabe` (Takt, Zeitfenster, Eingabeart, Grenzwerte, Station), `fr_hyg_faellig` (erzeugte Tagesaufgaben), `fr_hyg_erledigt` (nur anhängen, mit Hash-Kette), `fr_hyg_abweichung` (Maßnahme) |
| Parameter | `fr_parameter` (Mindestlohn, Minijob-Grenze, ArbZG-Grenzen, Standzeiten …) mit Gültigkeit von/bis, damit nichts im Code steht |
| Hilfe | `fr_hilfe`, `fr_video` (Feature-ID ↔ Video), `fr_frootie_frage` |
| Kundenbereich | `fr_artikel` (Verkaufsartikel, verweist auf Rezept), `fr_artikel_bild`, `fr_artikel_filiale` (Preis, verfügbar, ausverkauft), `fr_bestellung`, `fr_bestellung_position`, `fr_abholfenster`, `fr_kunde` (optional, nur mit Konto) |
| Audit | `fr_audit` (wer, was, wann, vorher/nachher), nur anhängen |

---

## 6. Module im Detail

### 6.1 💬 Nachrichten (FR-NACHRICHTEN)
- Empfänger auswählen statt eintippen: Person, Filiale, Bezirk, Rolle („alle Shopleitungen“), alle.
- Lesebestätigung ✓✓, Anlagen (Foto, PDF), Diktieren wie in der Club-App.
- **Pflicht-Info** (FR-PFLICHTINFO): zum Beispiel „neue Reinigungsanweisung Froyo-Maschine“. Jeder bestätigt mit „Gelesen und verstanden“, die Leitung sieht offene Bestätigungen. Diese Bestätigungen werden mitgeschrieben und gelten als Unterweisung.
- Ruhezeiten: Außerhalb der eigenen Arbeitszeit kommen keine Push-Nachrichten, außer bei „dringend“ (Einstellung je Person). Das schützt die Freizeit der Mitarbeiter.

### 6.2 📅 Termine (FR-TERMINE)
- Teamrunde, Schulung, Inventur, Lieferung, Center-Aktion, Belehrung, Begehung.
- Zu-/Absage, Erinnerung am Vortag. Wer zur Arbeitszeit eingeladen ist, bekommt den Termin auch im Einsatzplan.
- **Fristen-Termine**: Die App erzeugt Termine selbst, zum Beispiel wenn eine Folgebelehrung nach IfSG ansteht oder ein Gerät gewartet werden muss.

### 6.3 📌 Pinnwand (FR-PINNWAND)
- Filial-Pinnwand und unternehmensweite Pinnwand. Zettel in Farben, wichtig/erledigt, optional mit Ablaufdatum.
- Typische Zettel: „Topping Mango aus, nachbestellt“, „Center-Aktion Samstag“, „Wer hat den Schlüssel?“.

### 6.4 📖 Rezepte nach Warengruppen (FR-REZEPTE)

**Warengruppen** (aus dem Sortiment abgeleitet, in der Zentrale pflegbar):

| # | Warengruppe | Beispiele |
|---|---|---|
| 1 | 🍦 Frozen Yogurt | Basis-Froyo, Sorten, Becher S/M/L |
| 2 | 🍫 Toppings & Saucen | Fruchtsaucen, Schoko, Crunch, exotische Toppings |
| 3 | 🍉 Obstsalate & Fruchtbecher | Klassik, Exotik, Saisonbecher |
| 4 | 🥤 Smoothies | Grün, Beere, Tropical |
| 5 | 🍊 Frisch gepresste Säfte | Orange, Mix, Ingwer-Shot |
| 6 | 🍭 Eis am Stiel (handgemacht) | Fruchtstiel, Joghurtstiel |
| 7 | 🥣 Porridge & Milchreis | warm, Topping-Varianten |
| 8 | 🍮 Quark & Pudding | Quarkbecher, Pudding |
| 9 | 🧇 Snacks | Waffeln, Baguettes, Toast (enthält Gluten) |
| 10 | ☕ Getränke & Sonstiges | falls angeboten |
| 11 | 🌸 Saison & Aktionen | Sommer-/Winterkarte, Aktionsprodukte |
| 12 | 🧺 Pick-Nick | eigene Karte der Schwestermarke |

**Rezeptkarte:**
- Foto des fertigen Produkts, Zubereitung Schritt für Schritt mit Fotos und **Arbeitsvideo**
- Zutaten mit Mengen je **Bechergröße/Variante**. Portionen umrechnen wird aus der Club-App übernommen (für Vorproduktion: „10 Obstsalat-Becher M vorbereiten“).
- **Allergene** (14 Hauptallergene nach LMIV) und Zusatzstoffe werden automatisch aus den Zutaten berechnet. Kennzeichen „glutenfrei“ gibt es nur, wenn keine Zutat Gluten enthält.
- Standzeit/Haltbarkeit (z. B. „Obstsalat höchstens x Std. in der Vitrine“, Wert aus `fr_parameter`) erzeugt automatisch eine Hygiene-Aufgabe „Standzeit prüfen“.
- Lagerung und Temperatur, Hinweise zum Anrichten
- **Kalkulation** (Wareneinsatz je Becher) nur in der PC-Zentrale für Inhaber und QS
- **Versionen und Freigabe**: Rezepte werden zentral gepflegt und freigegeben, in den Filialen nur gelesen. Filialen können über „💡 Hinweis“ einen Vorschlag schicken. Alte Versionen bleiben im Archiv.
- **Allergen-Aushang** für die Theke auf Knopfdruck als PDF im frooters-Design

### 6.5 ⏱️ Stechuhr (FR-STECHUHR)

**Erfassungswege** (Auswahl je Filiale in der Zentrale):
1. **Stand-Tablet + persönlicher Ausweis-QR** aus der App oder als gedruckte Karte. Das ist der Standardweg und funktioniert auch ohne privates Handy.
2. **Handy scannt den Filial-QR** auf dem Tablet. Der Code wechselt alle 30 Sekunden, damit niemand von zu Hause stempeln kann.
3. Optional: Kurz-PIN am Tablet als Notweg, nur wenn die Filiale es erlaubt.

Es gibt **kein** GPS-Tracking. Höchstens wird beim Stempeln einmal geprüft „bin ich in der Filiale“, und das nur mit Einwilligung.

**Ablauf:** Kommen → Pause Anfang/Ende → Gehen. Beim Kommen optional die Bestätigung „Ich habe keine Krankheitsanzeichen nach § 42 IfSG“ (Hygiene, Kap. 6.8).

**Regeln** (Werte aus `fr_parameter`, nicht im Code):
- ArbZG: Pausenhinweis ab 6 Std. (30 Min.) und ab 9 Std. (45 Min.), höchstens 10 Std. am Tag, 11 Std. Ruhezeit. Verstöße erscheinen als Hinweis bei der Shopleitung.
- Jugendliche (JArbSchG): eigene Grenzen, Kennzeichen kommt aus dem Geburtsdatum.
- Minijob: Grenze je Monat beobachten (Ist + Plan) und rechtzeitig warnen.
- Fehlendes Gehen zeigt „⚠️ offen“ an, nie „OK“. Am Folgetag folgt ein Korrekturantrag.

**Korrekturen:** Antrag mit Begründung → Freigabe durch Shopleitung oder Stellvertretung. Das Original bleibt erhalten, die Korrektur wird als eigenes Ereignis gespeichert (Audit).

**Offline:** Das Tablet speichert Stempel mit Gerätezeit und Laufnummer und überträgt sie später. Solche Stempel werden als „offline erfasst“ markiert.

**Soll/Ist:** Stempelzeiten werden neben den Plan gelegt (Muster `kc_dp_stempel_paare`). Daraus ergeben sich Stundenkonto, Überstunden und Minusstunden.

**Export Lohnbuchhaltung:** CSV (z. B. im DATEV-Importformat), kostenlos, ohne bezahlte Schnittstelle. Das Format kommt über einen Adapter, damit andere Lohnprogramme austauschbar bleiben.

### 6.6 🗓️ Einsatzplanung (FR-PLANUNG)

**Für die Shopleitung (PC und Tablet):**
1. **Bedarf festlegen**: Öffnungszeiten der Filiale → Zeitblöcke → Mindestbesetzung (z. B. Sa 12 bis 18 Uhr: 3 Personen, davon 1 mit Schlüssel und 1 mit Kassenabschluss). Vorlagen je Wochentag, Saison (Sommer = Froyo-Hochsaison) und Center-Events.
2. **Schichtvorlagen**: Früh (Öffnen + Vorproduktion), Mittel, Spät (Schließen + Maschinenreinigung).
3. **Wunschphase** mit Frist: Mitarbeiter geben über die App ab, an welchen Tagen sie **möchten**, **können** oder **nicht können**, dazu Wunsch-Frei und Wunsch-Stunden je Woche. Das geht auch im Gespräch mit Frootie: „Ich kann nächste Woche nur vormittags“.
4. **Planvorschlag auf Knopfdruck**: Die App verteilt nach festen Regeln (keine KI, keine Kosten):
   - harte Regeln: Verfügbarkeit, Abwesenheit, Qualifikation, ArbZG/JArbSchG, Minijob-Grenze
   - weiche Regeln: Wünsche, Vertragsstunden, faire Verteilung von Wochenende und Spätschicht, möglichst wenige Wechsel
   - Ampel zeigt pro Zeitblock: unterbesetzt 🔴, knapp 🟡, passt 🟢, unbekannt ⚪ (nie grün)
5. **Feinschliff** per Ziehen auf dem Zeitbalken (wie Dienstpläne in der Club-App).
6. **Veröffentlichen**: Der Sollplan geht an alle (Push). Es gibt eine Mindest-Vorlaufzeit (Parameter, Standard 4 Tage, vgl. Arbeit auf Abruf § 12 TzBfG). Spätere Änderungen werden markiert und müssen vom Betroffenen bestätigt werden.
7. **Tauschbörse**: Ein Mitarbeiter bietet eine Schicht an, ein Kollege übernimmt, die Shopleitung bestätigt. Die App prüft vorher alle Regeln.
8. **Offene Schichten und Einspringen**: Bei einer Krankmeldung wird die Schicht automatisch offen. Passende Kollegen bekommen eine Push-Nachricht „Kannst du einspringen?“, wer zuerst zusagt, übernimmt nach Freigabe.
9. **Springer im Bezirk**: Die Bezirksleitung sieht freie Kapazitäten aller Filialen und kann Personen filialübergreifend einplanen.

**Für Mitarbeiter (App):** „🗓️ Mein Dienst“ wie in der Club-App: Wunsch → Plan → Ist-Zeiten, Kalender-Export (ICS), Erinnerung am Vorabend.

**Für Bezirk und Inhaber:** Planübersicht aller Filialen, Unterbesetzung auf einen Blick, geplante Stunden und Kosten im Vergleich zum Budget.

### 6.7 🏖️ Fehltage (FR-FEHLZEITEN)

Die Abwesenheitsarten stehen in einer Registry und sind erweiterbar:

| Art | Ablauf |
|---|---|
| 🤒 Krank | Meldung in der App (erster Tag, voraussichtlich bis), sofort an Shopleitung. Die AU kommt bei gesetzlich Versicherten als **eAU** über den Arbeitgeberabruf. Die App erinnert nur daran, ab wann eine AU nötig ist. **Diagnosen werden nie gespeichert.** |
| 👶 Kind krank | wie krank, eigene Art |
| 🏖️ Urlaub | Antrag → Shopleitung (bei Shopleitung selbst die Bezirksleitung) → genehmigt/abgelehnt mit Begründung. Urlaubskonto mit Anspruch, genommen, geplant und Rest. Urlaubssperren (z. B. Hauptsaison, Inventur) und eine Anzeige, wie viele gleichzeitig weg sind. |
| 🎓 Schule / Berufsschule / Prüfung | für Aushilfen, Studenten und Azubis, auch als wiederkehrende Nicht-Verfügbarkeit |
| ⏳ Freizeitausgleich, 💤 unbezahlt, 📚 Schulung, 🏢 Dienstreise | jeweils mit Genehmigung |

Abwesenheiten sperren die Planung automatisch und erzeugen offene Schichten, wo nötig. Das Team sieht nur „abwesend“, **nicht den Grund**. Den Grund sehen Shopleitung, Bezirksleitung, Inhaber und Büro.

### 6.8 🧼 Hygiene (FR-HYGIENE)

**Grundlage:** HACCP-Eigenkontrollen nach VO (EG) 852/2004, LMHV, Personalhygiene und Belehrung nach §§ 42, 43 IfSG, Allergeninformation nach LMIV. Die Inhalte prüft die QS-Rolle bzw. der Inhaber. Die App liefert **Vorlagen**, keine Rechtsberatung.

**Aufbau:**
- **Hygieneplan-Vorlage** (zentral) → wird Filialen zugewiesen → jede Filiale kann um eigene Stationen und Geräte ergänzen.
- Jede Aufgabe hat: Station, Takt (täglich, mehrmals täglich, wöchentlich, monatlich, jährlich), Zeitfenster, zuständige Rolle bzw. Schicht, **Eingabeart** (Haken, Messwert mit Grenzwert, Foto, Auswahl, Unterschrift), Anleitung und Video.
- Jeden Morgen erzeugt der Server aus den Öffnungszeiten die **Tagesliste** der Filiale.

**Beispiel Tagesliste einer Filiale** (Werte als Parameter):

| Zeitpunkt | Aufgabe | Eingabe |
|---|---|---|
| Öffnung | Temperatur Kühlvitrine Obst (Grenzwert z. B. ≤ +7 °C) | Messwert |
| Öffnung | Temperatur Tiefkühler/Eisvorrat (≤ −18 °C) | Messwert |
| Öffnung | Froyo-Maschine: Temperatur, Sichtkontrolle | Messwert + Haken |
| Öffnung | Handwaschplatz: Seife, Desinfektion, Papiertücher | Haken |
| Öffnung | Personalhygiene: saubere Kleidung, Haare, kein Schmuck | Haken je Person (beim Kommen) |
| Wareneingang | Lieferung: Temperatur, MHD, Verpackung, Lieferant | Messwert + Auswahl + Foto bei Mangel |
| alle x Std. | Standzeit Obstsalate/geschnittenes Obst prüfen, Rest verwerfen | Haken + Menge verworfen |
| alle x Std. | Toppings-Behälter wechseln/reinigen, Theke und Arbeitsflächen wischen | Haken |
| Mittag | Temperatur Kühlvitrine (zweite Messung) | Messwert |
| Schließung | Froyo-Maschine reinigen/desinfizieren nach Herstellervorgabe | Haken + Foto |
| Schließung | Saftpresse, Mixer und Smoothie-Geräte zerlegen und reinigen | Haken |
| Schließung | Böden, Abfall, Kühlschrankdichtungen | Haken |
| wöchentlich | Grundreinigung Kühlgeräte, Abtauen | Haken + Foto |
| monatlich | Schädlingsmonitoring, Kontrolle der Eismaschinen-Dichtungen | Auswahl |
| jährlich / alle 2 Jahre | Folgebelehrung IfSG (mind. alle 2 Jahre, § 43 Abs. 4), Hygieneschulung | Schulungsnachweis |

**Am Stand abhaken:**
- Auf dem **Stand-Tablet** steht die Tagesliste groß und farbig: ⚪ noch nicht fällig, 🟡 jetzt fällig, 🔴 überfällig, 🟢 erledigt. Wer abhakt, meldet sich mit dem Ausweis-QR an, dadurch ist klar, wer es war.
- Optional hängt an jeder Station ein **QR-Aufkleber** (Kühlvitrine 1, Froyo-Maschine 2). Scannen öffnet genau diese Aufgabe und belegt, dass man vor Ort war.
- **Messwert außerhalb des Grenzwerts**: Die Korrekturmaßnahme ist Pflicht (z. B. „Ware geprüft/verworfen“, „Techniker gerufen“, „nachgemessen nach 30 Min.“). Die Shopleitung bekommt sofort eine Push-Nachricht.
- **Eskalation**: Ist eine Aufgabe überfällig, bekommt die Schicht eine Nachricht. Ist sie nach x Min. immer noch offen, geht die Meldung an die Shopleitung, am Tagesende an die Bezirksleitung.
- **Unveränderbar**: Einträge werden nur angehängt (Hash-Kette). Korrekturen sind sichtbar als Nachtrag mit Zeit und Person. Nachträglich abgehakte Aufgaben zeigen „nachgetragen um …“ an.

**Kontrolle und Nachweis:**
- Shopleitung: Tagesabschluss „Hygiene geprüft“
- Bezirksleitung und Inhaber: **Erfüllungsquote je Filiale und gesamt**, Abweichungen, häufige Ausfälle, Gerätewarnungen (z. B. Kühlvitrine dreimal zu warm → Wartung)
- **PDF-Export** je Filiale und Zeitraum für die Lebensmittelüberwachung, im frooters-Design und mit Prüfsumme
- **Notbetrieb**: Eine leere Tagesliste als PDF zum Ausdrucken liegt bereit, falls Tablet oder Netz ausfallen. Die Papierliste wird später abfotografiert und als Beleg angehängt.

### 6.9 📊 Auswertungen (FR-AUSWERTUNG, PC-Zentrale)

Jede Auswertung gibt es **pro Filiale**, **pro Bezirk** und **kumuliert über alle Filialen**, mit frei wählbarem Zeitraum und Vergleich zum Vorjahr bzw. Vormonat:

| Kennzahl | Inhalt |
|---|---|
| Stunden | Soll/Ist je Person, Filiale und Summe, Überstunden, Minusstunden |
| Personalkosten | Ist-Stunden × Stundensatz (+ Zuschläge laut Parameter), Plan im Vergleich zum Budget |
| Personalkostenquote | nur wenn Umsätze per **CSV-Import** aus dem Kassensystem vorliegen (Adapter, kein festes Kassensystem) |
| Fehlzeiten | Krankenquote (ohne Diagnosen), Urlaubsstand, Resturlaub |
| Planqualität | Unterbesetzte Stunden, kurzfristige Planänderungen, erfüllte Wünsche in % |
| Arbeitszeitrecht | Hinweise auf Pausen, Ruhezeiten und Minijob-Grenze |
| Hygiene | Erfüllungsquote, Abweichungen, Messwert-Verläufe (Temperaturkurven je Gerät) |
| Schulungen | fällige Belehrungen und Pflichtschulungen |
| Kommunikation | offene Pflicht-Infos |

Fehlende oder veraltete Daten erscheinen als „⚪ keine Daten“ oder „⏳ Stand vom …“, nie als 0 oder OK. Exporte gibt es als CSV und PDF.

### 6.10 🎓 Einarbeitung und Schulungen (FR-SCHULUNG)
- Checkliste für den ersten Arbeitstag: Belehrungsnachweis vorhanden, Kleidung, Rundgang, erste Videos ansehen, Probe-Stempeln.
- Pflichtschulungen mit Video, kurzem Quiz und Nachweis (z. B. Hygiene, Allergene, Kasse, Maschinenreinigung)
- Die Folgebelehrung nach IfSG wird automatisch als Termin angelegt (Kap. 6.2).

### 6.11 🛒 Kundenbereich und Vorbestellung (FR-KUNDE, FR-BESTELLUNG)

**Ziel:** Kunden sehen das Sortiment ihrer Filiale mit Fotos und können vorbestellen. Der Shop bereitet vor, der Kunde holt ab und bezahlt. Dasselbe läuft im Shop als **Bestellterminal**, damit die Schlange an der Theke kürzer wird.

**Für Kunden:**
- **Filiale wählen** (Liste oder „in meiner Nähe“, Standort nur mit Erlaubnis und nur einmal)
- **Sortiment** nach Warengruppen: Foto, Beschreibung, Preis, **Allergene und Zusatzstoffe**, „glutenfrei“, „vegan“, Größen. Ausverkaufte Artikel sind sichtbar markiert.
- **Selbst zusammenstellen** (passend zum Motto „Du hast die Wahl“): Froyo-Becher → Größe → Toppings → Sauce, mit laufendem Preis und laufender Allergenliste
- **Warenkorb** → **Abholzeit** wählen (nur Zeitfenster, die die Filiale freigegeben hat) → Name und Handynummer oder E-Mail → **Bestellnummer** und Abhol-QR
- Status: „angenommen“, „in Zubereitung“, „abholbereit“ (Web-Push, wenn erlaubt)
- **Ohne Kundenkonto** möglich. Ein Konto ist freiwillig, zum Beispiel für Lieblingsbecher und später eine Treuekarte.

**Im Shop:**
- **Bestellterminal** auf einem Tablet im Kundenbereich (Kiosk-Modus, kein Zugriff auf Mitarbeiterfunktionen): zusammenstellen → Bestellnummer → an der Kasse bezahlen und abholen
- **Bestellmonitor** auf dem Stand-Tablet bzw. einem zweiten Bildschirm: neue Bestellungen mit Ton, nach Abholzeit sortiert, „angenommen“ → „fertig“ → „abgeholt“. Nicht abgeholte Bestellungen werden nach x Min. markiert.
- **Steuerung durch die Shopleitung:** Vorbestellung ein/aus, Abholfenster, Höchstzahl je Fenster (damit die Theke nicht überläuft), Artikel ausverkauft schalten
- Vorbestellungen fließen in die Vorproduktion („heute 14 Uhr: 6 Becher M Exotik“) und in die Auswertung.

**Bezahlen und Kasse:**
- Start: **Bezahlen bei Abholung** an der vorhandenen Kasse. Die Vorbestellung ist kein Verkauf. Der Verkauf wird wie bisher in der zertifizierten Kasse mit TSE gebucht (KassenSichV), die App ersetzt die Kasse nicht.
- **Online-Bezahlung** später als austauschbarer Adapter. Zahlungsanbieter kosten Gebühren je Zahlung und brauchen eine Geschäftsentscheidung (Zero-Cost-Regel).
- Anbindung an das Kassensystem (Artikel, Preise, Umsatz) nur über Adapter und CSV-Import, kein fest eingebautes Kassensystem.

**Daten:** Kunden sehen **Verkaufsartikel**, nie Rezepte. Ein Artikel verweist auf ein Rezept, daraus kommen die Allergene automatisch. Rezepte, Mengen und Kalkulation bleiben intern. Preise und Verfügbarkeit gelten je Filiale, bei Franchisenehmern legt der Betreiber seine Preise selbst fest.

**Recht:** Allergene und Pflichtangaben müssen **vor dem Absenden der Bestellung** sichtbar sein (LMIV Art. 14 für Fernabsatz), Endpreise nach Preisangabenverordnung, Impressum und Datenschutzerklärung des jeweiligen Betreibers, Cookie-frei bzw. nur technisch nötige Speicherung.

**Sicherheit:** eigener Server `fr-kunde`, getrennt vom Mitarbeiter-Server. Er kann nur Sortiment lesen und Bestellungen anlegen bzw. den eigenen Status abfragen. Dazu Begrenzung der Anfragen, ein kostenloser Bot-Schutz und eine Höchstzahl offener Bestellungen je Telefonnummer. Kundendaten werden nach Abholung bzw. nach kurzer Frist gelöscht, wenn kein Konto besteht.

---

## 7. 🍓 Frootie: der Assistent (statt Twinkey)

**Figur:** eine fröhliche Erdbeere bzw. Frucht mit frooters-Kappe (Gestaltung nach dem frooters-Design, Varianten für Begrüßung, Tipp, Lob, Warnung). Frootie duzt, ist kurz und freundlich, im Sinn von „Du hast die Wahl. Du hast die Fantasie.“

**Was Frootie macht** (Mechanik von Twinkey übernommen):

| Funktion | Beispiel |
|---|---|
| 🍓 **Frag Frootie** (tippen oder 🎤 sprechen) | „Wie reinige ich die Froyo-Maschine?“ → Antwort + Video. „Wann habe ich Spätschicht?“ → eigener Plan |
| 📝 **Wunsch-Dialog** | Frootie fragt Woche, Tage, Uhrzeit und Filiale ab → „Wunsch abschicken“ |
| 🏖️ **Urlaubs- und Krankmeldung im Gespräch** | „Ich bin krank“ → Frootie fragt „Ab heute? Voraussichtlich bis?“ → Meldung an die Shopleitung |
| 🧼 **Hygiene-Coach** | „Kühlvitrine zu warm, was tun?“ → Schritte der Korrekturmaßnahme |
| 💡 **Tipp des Tages** und Hinweise auf Neues | wie die Twinkey-Tipps (neueste Tipps zuerst) |
| 🎉 **Lob** | „Alle Hygiene-Aufgaben heute erledigt 🎉“ |

**Technik (Zero-Cost):** Wie bei Twinkey gibt es keine kostenpflichtige KI-Schnittstelle. Frootie arbeitet mit Hilfeartikeln, Schlagwort- und Synonymsuche, festen Dialogen und den Videos. Was Frootie nicht beantworten kann, landet im Eingang der Zentrale. Die Antwort wird nachgeliefert und danach in die Hilfe aufgenommen.

---

## 8. 🎬 Videoanleitungen für alle Funktionen (FR-VIDEO)

**Zwei Arten:**
1. **App-Rundgänge** (wie die Club-App-„Erklär-Videos“, `teile/videos.js`): Die App zeigt die echte Oberfläche Schritt für Schritt mit Markierungen und spricht dazu (freie Piper-Stimme `de_DE-thorsten-medium`, CC0/MIT). Dafür ist kein Videospeicher nötig, und die Rundgänge sind nach jedem Update automatisch aktuell.
2. **Arbeitsvideos** (echt gefilmt im Shop, 30 bis 90 Sekunden): Rezepte zubereiten, Maschinen reinigen, Wareneingang, Kassenabschluss. Hochformat, komprimiert (720p, wenige MB), abgelegt im kostenlosen Speicher mit Zero-Cost-Check.

**Regeln:**
- **Jede Feature-ID hat mindestens einen Rundgang** (Zuordnung in `fr_video`). Ein Vertragstest bricht den Build ab, wenn eine Kachel oder Funktion kein Video hat. Release-Gate: kein FINAL ohne Video.
- Videos gibt es auch je Rolle, zum Beispiel „Erste Schritte als Aushilfe“, „Erste Schritte als Shopleitung“, „Einsatzplan in 5 Minuten“.
- Untertitel immer dabei, weil im Shop oft kein Ton möglich ist. Sprachen: Deutsch, dazu Englisch (Aushilfen, Studenten), weitere nach Bedarf.
- Zugang über 🎬 Kachel, über ❓ an jedem Fenster, über die 🔍 Suche und über Frootie.

---

## 9. Bedienung und Kacheln

Übernommen aus der Club-App: **einfache Ansicht** (wenige große Kacheln) und **erweiterte Ansicht**, Designs (hell, dunkel, große Schrift), Register oben, Zahl-Badges, Lämpchen.

| Register | Kacheln (Auswahl, je nach Rolle) |
|---|---|
| 🏪 **Mein Shop** | ⏱️ Stempeln · 🧼 Hygiene heute · 💬 Nachrichten · 📌 Pinnwand · 📅 Termine · 📖 Rezepte · 👥 Team heute |
| 🙋 **Meins** | 🗓️ Mein Dienst (Wunsch → Plan → Ist) · 📝 Wünsche · 🏖️ Urlaub & Fehltage · ⏳ Mein Stundenkonto · 🪪 Ausweis-QR · 🎓 Meine Schulungen · 🔐 Meine Daten · ⚙️ Einstellungen |
| 🍍 **Leitung** (ab Stv. SL) | 🗓️ Einsatzplan · ✅ Genehmigungen (Urlaub, Tausch, Korrekturen) · 🔴 Offene Schichten · 🧼 Hygiene-Kontrolle · 📭 Pflicht-Info offen · 📊 Filiale heute |
| 🛒 **Bestellungen** (Shop, wenn Vorbestellung an) | 📥 Bestellmonitor · ⏸️ Vorbestellung pausieren · 🚫 Artikel ausverkauft |
| 🗺️ **Bezirk / Unternehmen** (Bezirksleitung, Inhaber, Franchisenehmer) | 🏪 Filialauswahl (eine, mehrere, alle) · 📊 Kennzahlen je Shop und gesamt · 🧼 Hygiene-Ampel aller Filialen · 🔁 Springer · 🗂️ Freigaben |
| ❓ **Hilfe** | 🍓 Frag Frootie · 🎬 Videos · ❓ Hilfe & Tipps · 💭 Feedback · 🔄 Update · 🛡️ Sicherheits-Check |

**Startbild „Heute“:** nächste Schicht, Stempelstatus, fällige Hygiene-Aufgaben, neue Nachrichten und Pflicht-Infos, offene Genehmigungen (Leitung).

**Filialwahl oben** (ab Bezirksleitung): „Alle Shops“ zeigt die Summe, Antippen einer Filiale zeigt den Einzelwert.

**Corporate Design:** Grundlage sind die Farben und Schriften von frooters.de (Salbei `#A3A983`, Rot `#C10230`, Grün `#76BC21`, Arvo / Didact Gothic / Quicksand, Apfel-Logo). Verbindlich wird das Design erst nach Freigabe durch frooters. Franchisenehmer bekommen dasselbe Design, damit alle Filialen gleich aussehen (Regel wie `CORPORATE_DESIGN.md` der Club-App: alle Ausdrucke nur über einen zentralen Druckrahmen).

---

## 10. Technik, Betrieb und Datensicherung

| Thema | Lösung |
|---|---|
| Hauptsystem | **Eigenes Supabase-Projekt** in **eu-central-1 Frankfurt**, getrennt von den KC-Projekten. Postgres, RLS, Edge Function `fr-app`, Storage, pg_cron. Am besten in einer Supabase-Organisation, die frooters selbst gehört, weil frooters Verantwortlicher im Sinne der DSGVO ist. |
| Frontend | PWA ohne Build-Schritt wie die Club-App (`index.html`, `app.js`, `sw.js`, `teile/`). Hosting statisch (z. B. GitHub Pages oder Cloudflare Pages, kostenlos). PC-Zentrale = dieselbe Codebasis mit eigenem Einstieg und Desktop-Layout, oder ein eigenes Repo mit geteilten Kernen. |
| Spiegel | **Neon-Projekt in aws-eu-central-1 Frankfurt**: Spiegel alle 6 Std. (Muster `kc-db-mirror-worker`) |
| Datensicherung | Tägliches Backup in Neon (Muster `kc-db-backup-worker` + `kc-db-backup-verify`), Aufbewahrung 7 Tage, 4 Wochen und 3 Monate. Dazu eine **verschlüsselte, unveränderliche Kopie außer Haus** (B2, Plan wie `PLAN-KC-DB-BACKUP-B2.md`), damit die 3-2-1-Regel erfüllt ist. |
| Wiederherstellung | Wöchentlicher automatischer Probe-Restore mit Prüfsumme. Ziel: RPO höchstens 6 Std., RTO wenige Stunden. Ablauf dokumentiert wie `NOTFALL_DATEN_ZURUECKHOLEN.md`. |
| Notbetrieb | Stand-Tablet arbeitet offline weiter (Stempel und Hygiene in der Warteschlange). Papiervorlagen (Stempelliste, Hygiene-Tagesliste) liegen als PDF bereit. **KICC ist kein Single Point of Failure**: Ohne KICC läuft die App normal weiter. |
| Überwachung | Eintrag im KICC-Produktregister, Heartbeat und Status. Messwerte in eigenen Tabellen statt teurer Log-Abfragen (Regel KC-SPARSAM-PROTOKOLLE). |
| Updates | Versionsvertrag und atomares Update wie in der Club-App. Gebündelt einspielen und **nicht während der Öffnungszeiten der Filialen** (z. B. morgens vor 9 Uhr oder nach Ladenschluss). |
| Kosten | Ziel Zero-Cost: Supabase Free (500 MB DB, Datenmenge von Text- und Zeitdaten ist klein), Neon Free, B2 bis 10 GB frei, Pages frei, Push frei (Web Push), Mail über vorhandenes Konto. **Zu entscheiden:** Für einen gewerblichen Betrieb mit vielen Mitarbeitern kann der Supabase-Pro-Tarif (Point-in-Time-Recovery, Support) sinnvoll sein. Das ist eine Entscheidung des Inhabers und gehört nicht in den Code. |
| Tests | Vertragstests wie in der Club-App (`tests/*.test.mjs`): Rechte-Matrix, RLS/Grants, Video-Pflicht, Versionsvertrag, Hygiene-Hash-Kette, ArbZG-Regeln, Playwright-Oberflächentests je Rolle |

---

## 11. Sicherheits- und Datenschutzkonzept

### 11.1 Recht und Organisation
- **DSGVO + § 26 BDSG** (Beschäftigtendaten): Zweckbindung (Arbeitszeit, Planung, Hygiene, Kommunikation), Verzeichnis der Verarbeitungstätigkeiten, Datenschutzinformation für Mitarbeiter, ggf. Datenschutz-Folgenabschätzung für die Zeiterfassung.
- **AV-Verträge** mit Supabase, Neon, Backblaze und dem Hosting-Anbieter. Datenhaltung in der EU (Frankfurt), Backup in der EU.
- **Betriebsrat** (falls vorhanden): Mitbestimmung bei technischen Einrichtungen zur Leistungs- und Verhaltenskontrolle (§ 87 Abs. 1 Nr. 6 BetrVG). Die Einführung braucht dann eine Betriebsvereinbarung.
- **Arbeitszeiterfassung** ist Pflicht (BAG 13.09.2022). Aufbewahrung der Aufzeichnungen mindestens 2 Jahre (§ 16 Abs. 2 ArbZG).
- **Kein Zwang zum privaten Handy**: Alles Pflichtige (Stempeln, Hygiene, Plan ansehen) geht auch am Stand-Tablet oder über einen Aushang.

### 11.2 Zugang
| Wer | Anmeldung |
|---|---|
| Mitarbeiter und Aushilfen (App) | Persönlicher **Einladungslink/QR** aus der Zentrale (Token nur als SHA-256 gespeichert, sofort aus der Adresszeile entfernt, wie in der Club-App) → Gerät wird gebunden → eigene **4- bis 6-stellige PIN**, biometrisch entsperrbar über Passkey/WebAuthn, wenn das Gerät es kann |
| Shopleitung, Bezirksleitung, Inhaber, Büro (App + PC) | zusätzlich **zweiter Faktor** (Passkey oder TOTP-App, beides kostenlos). Neue Geräte melden. |
| Stand-Tablet | Geräte-Token nur für die Funktionen „Stempeln“ und „Hygiene“ seiner Filiale, Kiosk-Modus, Personen melden sich per Ausweis-QR an. Wird das Gerät gestohlen, sperrt die Zentrale das Token sofort. |
| Austritt | Beschäftigung endet → Zugang wird automatisch zum Austrittsdatum gesperrt. Die Daten bleiben für die Aufbewahrungsfristen erhalten und werden danach gelöscht. |

### 11.3 Technische Maßnahmen (TOM)
- TLS überall, Verschlüsselung der Datenbank im Ruhezustand, verschlüsselte Backups (Schlüssel getrennt von den Daten).
- **Keine Secrets im Browsercode oder Repository**, nur in Supabase Secrets/Vault (Vertragsregel 15).
- **RLS auf jeder Tabelle**, Zugriff nur über die Edge Function. Jede Migration vergibt Grants ausdrücklich. Der Server prüft bei jeder Anfrage Rolle × Geltungsbereich.
- **Least Privilege**: Technik-Admin sieht ohne Zusatzrecht keine Personal- und Gesundheitsdaten. Die Stellvertretung bekommt nur die freigegebenen Rechte.
- **Besonders geschützt**: Krankmeldungen (ohne Diagnose), Stundenlöhne und Bankdaten (Bankdaten nur, wenn das Büro sie wirklich braucht, sonst bleiben sie in der Lohnbuchhaltung).
- **Audit-Log** (nur anhängen) für Rechteänderungen, Korrekturen von Stempelzeiten, Genehmigungen, Exporte und Zugriffe auf Lohndaten.
- Sitzungen laufen ab, Anfragen werden begrenzt, Fehlversuche bei der PIN sperren nach x Versuchen.
- Sicherheits-Check-Kachel und Security-Review vor jedem RC/FINAL (KICC-Security-Gate).

### 11.4 Löschkonzept (Vorschlag, mit Lohnbuchhaltung abstimmen)
| Daten | Frist |
|---|---|
| Stempel- und Arbeitszeitnachweise | 2 Jahre (ArbZG), länger nur, wenn sie zu Lohnunterlagen gehören (dann im Lohnsystem) |
| Hygienedokumentation | Vorschlag 2 Jahre (mit der Lebensmittelüberwachung abstimmen) |
| Krankmeldungen | Ende des Folgejahres |
| Nachrichten und Pinnwand | 12 Monate, wichtige Pflicht-Infos so lange, wie die Anweisung gilt |
| Bewerber (später) | 6 Monate nach Absage |

---

## 12. PC-Version „frooters Zentrale“

| Bereich | Funktionen |
|---|---|
| 🏢 Organisation | Unternehmen, Marken, Bezirke, Filialen (Adresse, Center, Öffnungszeiten, Sondertage, Stationen und Geräte, Stand-Tablets) |
| 👥 Personal | **Mitarbeiter aufnehmen** (Assistent: Person → Beschäftigung/Filiale/Rolle → Vertrag/Stunden/Stundensatz → Qualifikationen → Belehrungsnachweis hochladen → Einladung als QR/Link drucken oder senden), Änderungen, Austritt, Vertretungen, Qualifikationen mit Ablaufdatum |
| 🔐 Rechte | Rollen und Rechte (Registry), Übersicht „wer darf was wo“, Audit |
| 📖 Rezepte | Warengruppen, Zutaten mit Allergenen, Rezepte mit Varianten, Fotos und Video, Versionen und Freigabe, Allergen-Aushang, Kalkulation |
| 🧼 Hygiene | Plan-Vorlagen, Aufgaben, Grenzwerte, Zuordnung zu Filialen, QR-Aufkleber drucken, Dokumentation prüfen und exportieren |
| 🗓️ Planung | großer Planer (Woche/Monat, mehrere Filialen nebeneinander), Bedarf, Vorlagen, Regeln, Veröffentlichen |
| ⏱️ Zeiten | Stempelübersicht, Korrekturen, Monatsabschluss je Filiale (Shopleitung bestätigt), **Lohnexport** |
| 📊 Auswertungen | Kap. 6.9, pro Shop und kumuliert |
| ⚙️ Parameter | Mindestlohn, Minijob-Grenze, ArbZG-Werte, Zuschläge, Standzeiten, Grenzwerte, jeweils mit „gültig ab“ |
| 🎬 Hilfe-Redaktion | Hilfeartikel, Frootie-Antworten, Videos, offene Frootie-Fragen |
| 🛠️ System | Version, Status (Spiegel, Backup, Restore-Test), Geräte, Zugänge |

---

## 13. Feature-IDs und Definition of Done

| Feature-ID | Funktion | Phase |
|---|---|---|
| FR-ORG | Organisation, Filialen, Bezirke, Stationen | 1 |
| FR-ROLLEN | Rollen, Rechte, Geltungsbereich, Vertretung | 1 |
| FR-ZUGANG | Einladung, Gerätebindung, PIN, 2FA, Stand-Tablet | 1 |
| FR-PERSONAL | Mitarbeiter aufnehmen, Beschäftigung, Austritt | 1 |
| FR-NACHRICHTEN / FR-PFLICHTINFO | Nachrichten, Pflicht-Infos | 1 |
| FR-PINNWAND · FR-TERMINE | Pinnwand, Termine | 1 |
| FR-STECHUHR | Stempeln, Pausen, Korrekturen, offline | 1 |
| FR-HYGIENE | Pläne, Tagesliste, Abhaken am Stand, Abweichungen, Export | 1 |
| FR-FEHLZEITEN | Krank, Urlaub, Konten, Genehmigungen | 2 |
| FR-PLANUNG | Bedarf, Wünsche, Vorschlag, Veröffentlichen, Tausch, Einspringen, Springer | 2 |
| FR-REZEPTE | Warengruppen, Rezepte, Allergene, Freigabe | 3 |
| FR-AUSWERTUNG | Kennzahlen pro Shop und kumuliert, Exporte | 3 |
| FR-LOHNEXPORT | CSV-Adapter Lohnbuchhaltung | 3 |
| FR-SCHULUNG | Einarbeitung, Pflichtschulungen, Belehrungen | 3 |
| FR-FROOTIE | Assistent, Dialoge, Tipps | 1 (Basis) → 4 |
| FR-VIDEO | Rundgänge je Feature, Arbeitsvideos | parallel zu jeder Phase |
| FR-BACKUP | Neon-Spiegel, Tagesbackup, Off-site, Restore-Test | 1 |
| FR-MANDANT | Betreiber-Ebene, Franchisenehmer, Systeminhalte, Kennzahlen für die Systemzentrale | 1 (Datenmodell) → 4 |
| FR-KUNDE | Kundenbereich: Sortiment, Fotos, Allergene, Preise je Filiale | 4 |
| FR-BESTELLUNG | Warenkorb, Vorbestellung, Bestellterminal, Bestellmonitor | 4 |

**Definition of Done je Feature:** Feature-ID im Code und Changelog · Rechte serverseitig und getestet · RLS und Grants · Vertragstests grün · Oberflächentest je betroffener Rolle · **Videoanleitung vorhanden** · Hilfeartikel und Frootie-Antwort · Audit, wo kritisch · Zero-Cost-Check · Version erhöht · Doku aktualisiert.

---

## 14. Umsetzungsplan

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 0 · Klärung (1 bis 2 Wochen) | Workshop mit Inhaber: Filialen, Bezirke, Rollen, Vertragsarten, Lohnbuchhaltung, Hygieneplan (Ist), Corporate Design, Betriebsrat und Datenschutz, Tarifentscheidung | bestätigte Stammdaten und Rechte-Matrix |
| 1 · Basis + Pilot | Repo `frooters-app` aus der Club-App ableiten, Datenmodell schon mit Betreiber-Ebene (Franchise), Supabase und Neon in Frankfurt, Backup, Zentrale (Stammdaten, Personal), App (Nachrichten, Pinnwand, Termine, Stempeln, Hygiene), Stand-Tablet, Frootie-Basis, Videos | **Pilot in einer Filiale** (z. B. Minden) |
| 2 · Planung | Fehltage, Wünsche, Einsatzplanung, Tausch, Einspringen, Springer im Bezirk | Rollout auf einen Bezirk |
| 3 · Wissen und Zahlen | Rezepte nach Warengruppen, Auswertungen pro Shop und kumuliert, Lohnexport, Schulungen | Rollout auf alle Filialen |
| 4 · Franchise und Kunden | Franchisenehmer als eigene Betreiber, Kennzahlen für die Systemzentrale, Kundenbereich mit Sortiment, dann Vorbestellung und Bestellterminal (zuerst in der Pilotfiliale) | App für Franchisenehmer und Kunden |
| 5 · Ausbau | Frootie-Dialoge, Mehrsprachigkeit, Pick-Nick, Online-Bezahlung, Treuekarte, Kassenimport, Bewerbermodul | laufende Weiterentwicklung |

Jede Phase läuft DEV → RC (Pilotfiliale) → FINAL nach Regression, Visual-TÜV, Security, Architekturprüfung und Release-TÜV.

### Offene Entscheidungen
1. Aktuelle Filialliste und Bezirke (Dortmund, Oldenburg, Altenessen noch aktiv?), Firmierung, Pick-Nick von Anfang an dabei?
2. Wer pflegt die Rezepte und Hygienepläne (Inhaber, eigene QS-Rolle)?
3. Welche Lohnbuchhaltung bzw. welches Exportformat (DATEV oder anderes)?
4. Gibt es einen Betriebsrat? Wer ist Datenschutzbeauftragter?
5. Stand-Tablet je Filiale vorhanden oder anzuschaffen (einmalige Hardwarekosten)?
6. Supabase Free oder Pro für den gewerblichen Betrieb?
7. Eigentum an Konten und Repository (frooters oder Dienstleister)?
8. Farben, Logo und Freigabe der Frootie-Figur (Entwurf auf Basis von frooters.de liegt vor)
9. Wird die App den Franchisenehmern angeboten? Kostenlos oder mit Lizenzgebühr je Filiale? Welche Kennzahlen sieht die Systemzentrale laut Franchisevertrag?
10. Kundenbereich: nur Sortiment ansehen, oder gleich Vorbestellung? Bestellterminal im Shop gewünscht? Später Online-Bezahlung?
11. Welches Kassensystem ist im Einsatz (für Artikel, Preise und Umsatz-Import)?

---

## 15. Quellen der Recherche

- frooters, Startseite, Design (Farben, Schriften und Logo aus `theme.css` und `logo-frooters.svg`) und Unternehmen: https://www.frooters.de/ · https://www.frooters.de/unternehmen/ · https://www.frooters.de/jobs/
- Lebensmittel Praxis, „Frisches auf kleiner Fläche“ (2013): https://lebensmittelpraxis.de/sortiment/8643-frisches-auf-kleiner-flaeche.html
- Westfield Centro Oberhausen, frooters: https://www.westfield.com/de/germany/centro/restaurants/frooters/83215
- McArthurGlen Designer Outlet Ochtrup, frooters: https://www.mcarthurglen.com/de/outlets/de/designer-outlet-ochtrup/essen-und-trinken/frooters/
- Teutoburger Wald Tourismus, frooters Minden: https://www.teutoburgerwald.de/region/gastro-event/gastronomie-tipps/gastronomie/frooters-ihr-frischer-fruchtgenuss
- Neueröffnung Oberhausen: https://www.neueroeffnung.info/oberhausen/frooters-frozen-yogurt-shop
- Yelp, frooters Dortmund (Verzeichnis, ungeprüft): https://www.yelp.com/biz/frooters-dortmund
- Facebook, frooters Oldenburg (ungeprüft): https://www.facebook.com/FrootersOldenburgfamila/
- Club-App (Grundbaustein): https://github.com/Sire65/KC-Clubapp (README, `app.js` Kacheln, `docs/CODEX_AUFTRAG_DIENST_STEMPEL.md`, `docs/CORPORATE_DESIGN.md`, `werbefilm/README.md` im KICC)
