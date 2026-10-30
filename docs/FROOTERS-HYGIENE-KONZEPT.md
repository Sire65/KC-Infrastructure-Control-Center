# Konzept Hygiene-Modul „frooters Team-App“ (FR-HYG)

**Stand:** 30.10.2026 · **Status:** KONZEPT (vor DEV) · **Teil von:** `docs/FROOTERS-APP-KONZEPT.md` (Kap. 6.8)
**Grundsatz:** Regeln werden **am PC** (frooters Zentrale) angelegt und gepflegt. Durchgeführt und abgehakt wird **im Shop** am Stand-Tablet oder am Handy.

---

## 1. Ziel

1. Hygieneregeln werden **einmal zentral** (global) beschrieben.
2. Jeder Shop bekommt nur die Regeln, die auf ihn passen: über **Zuteilung** durch die Zentrale oder **Übernahme** durch die Shopleitung.
3. Regeln für Geräte gelten **nur, wenn der Shop das Gerät hat**. Ein Shop ohne Eismaschine bekommt keine Aufgabe „Eismaschine reinigen“.
4. Jeden Tag entsteht pro Shop automatisch eine **Tagesliste**. Darin steht, was wann von wem (Person oder Schicht, z. B. Spätdienst) zu erledigen ist.
5. Jede Aufgabe wird **abgehakt** und ist nachweisbar.
6. Stimmt ein Wert nicht, etwa eine Kühltemperatur, zeigt die App **sofort die passende Korrekturmaßnahme**. Die Maßnahme muss dokumentiert werden.
7. Was nicht erledigt ist, erscheint **nie als erledigt** (KICC-Regel 11: UNKNOWN darf nie als OK angezeigt werden).

---

## 2. Recherche: Flowtify als Vorbild

Flowtify (Flowtify GmbH, Köln) ist eine Tablet- und Smartphone-App für die Hygiene-Eigendokumentation nach VO (EG) 852/2004. Laut App-Store-Eintrag ist sie seit Mai 2016 von der Länderarbeitsgemeinschaft Verbraucherschutz bundesweit für die HACCP-Dokumentation anerkannt.

**Status:** Ein Verzeichnis (KI-Syndikat) meldet, dass FoodNotify Flowtify übernommen hat und die Domain abgeschaltet ist. Der App-Store-Eintrag wird dagegen weiter gepflegt (unter anderem Zwei-Faktor-Anmeldung ab Januar 2026). Der genaue Stand ist also unklar. Eine ausführliche Bedienungsanleitung war öffentlich nicht zu finden. Intervalle und Zuordnung zu Personen sind daher aus der Beschreibung der Funktionen abgeleitet.

| Funktion bei Flowtify (laut App-Store-Eintrag und Verzeichnissen) | Übernahme für frooters |
|---|---|
| Checklisten aus einer **Vorlagensammlung**, Einarbeitung in Minuten | **Regelbibliothek** mit Startpaket „frooters Standard“ (Kap. 10) |
| Hilfe bei unbekannten Aufgaben durch **Fotos, Videos und PDFs** an der Aufgabe | Jede Regel hat Anleitung, Foto und Video (Pflicht laut FR-VIDEO) |
| Nachweis frei wählbar: **Einzel- oder Gruppenunterschrift, Foto** | Nachweisart je Regel: Haken, Unterschrift, Foto, mehrere davon |
| **Temperatur** als Ergebniswert, **Parameter mit vorgegebener Auswahl**, Werte in beliebiger Reihenfolge | Prüfpunkte je Regel: Messwert mit Grenzen, Auswahl, Haken, Zahl, Text, Foto |
| **Spontane Checklisten** nur mit Begründung | Aufgabe „bei Bedarf“ mit Pflichtgrund |
| **Wiedervorlage** einer Aufgabe | Nachkontrolle als Teil der Maßnahme (z. B. „in 30 Min. nachmessen“) |
| Bei **Abweichungen** (z. B. Temperatur) automatische Nachricht an Zuständige | Abweichung zeigt Maßnahme, benachrichtigt die Shopleitung und eskaliert |
| **Assistent** zum Lösen und Wiedereröffnen von Ereignissen | Geführter Ablauf „Abweichung beheben“ (Kap. 7) |
| **Kalender** mit Wochenansicht und Filter nach Status, Bildern und **Bereichen** | Tages- und Wochenansicht je Shop, Filter nach Bereich und Status |
| **Berichte** (auch tabellarisch), direkt aus dem Kalender | PDF und CSV je Shop und Zeitraum für Lebensmittelkontrolle und Inhaber |
| **Rollenrechte** (HACCP-Berichte, Web-Zugang, Aufgaben zurücksetzen) | Rechte je Rolle und Ebene (Kap. 9) |
| **Sensoren (IoT)**: Abtaustatus, Verbindungswarnungen, Sensor-Vorlagen | Später über einen Adapter (Kap. 12). Zum Start werden Werte von Hand eingegeben. |

**Unterschied:** frooters baut kein zusätzliches Programm, sondern ein Modul in der eigenen App. Es nutzt dieselben Mitarbeiter, Schichten, Filialen und Geräte wie Einsatzplanung und Stechuhr und verursacht keine laufenden Lizenzkosten.

---

## 3. Begriffe

```
Zentrale (PC)                                     Shop (Tablet / Handy)
─────────────────────────────────                 ─────────────────────────────
Bereich ──┐                                        Tagesliste
Gerätetyp ┼──► Regel (global, Version) ──► Zuteilung je Shop ──► Aufgabe ──► Durchführung
Maßnahme ─┘        │                           ▲        (Instanz)      │
                   └── Prüfpunkte              │                       └─► Abweichung ─► Maßnahme
Shop ──► Geräte (Gerätetyp, Name, QR) ─────────┘                                 └─► Nachkontrolle
Schichten (aus Einsatzplanung) ─────────────────► Zuständigkeit
```

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| **Bereich** | Ort oder Thema im Shop, global gepflegt | Theke, Kühlung, Froyo-Station, Saftbar, Lager, Wareneingang, Personal, Sanitär |
| **Gerätetyp** | Art von Gerät, global gepflegt | Kühlvitrine, Tiefkühler, Froyo-Maschine, Eismaschine, Saftpresse, Mixer, Spülmaschine, Waffeleisen |
| **Gerät** | konkretes Gerät in einem Shop, mit Typ, Name und QR-Aufkleber | „Kühlvitrine 1 (Theke links)“ in Minden |
| **Regel** | Was, wie oft, wann, durch wen, mit welchen Prüfpunkten und Maßnahmen. Global angelegt und mit Versionen. | „Temperatur Kühlvitrine prüfen“ |
| **Prüfpunkt** | eine Eingabe innerhalb einer Regel | Messwert °C (max. +7), Haken „Tür schließt dicht“ |
| **Maßnahme** | was bei einer Abweichung zu tun ist, mit Schritten | „Kühlung zu warm“ |
| **Zuteilung** | ob und wie eine Regel in einem Shop gilt | aktiv, Uhrzeit 10:30 statt 10:00 |
| **Aufgabe** | eine erzeugte Instanz in der Tagesliste | „Temperatur Kühlvitrine 1, heute 10:00–11:00“ |
| **Durchführung** | das Abhaken mit Werten, Person, Zeit und Nachweis | 4,8 °C, Lena, 10:12 |
| **Abweichung** | Ergebnis außerhalb der Grenze, offenes Ereignis bis zum Abschluss | 9,1 °C, Maßnahme läuft |

---

## 4. Die Regel im Detail (Eingabe am PC)

Eine Regel wird in der Zentrale mit einem **Assistenten in 6 Schritten** angelegt. Auswahl hat Vorrang vor Freitext (KICC-Regel 13).

| Schritt | Felder |
|---|---|
| **1. Was** | Titel, Bereich (Auswahl), optional **Gerätetyp** (Auswahl), kurze Anleitung, Foto/Video/PDF, Kennzeichen „Pflichtregel (HACCP)“ |
| **2. Wie oft** | Intervall (Kap. 5), Zeitfenster bzw. Anker (Öffnung, Schichtbeginn, Schließung, Uhrzeit), Toleranz (z. B. „bis 60 Min. nach Fälligkeit“) |
| **3. Wer** | Zuständigkeit (Kap. 6): Rolle, Schicht, Person oder „alle im Dienst“, dazu eine Vertretung |
| **4. Prüfpunkte** | Liste von Eingaben: Haken, **Messwert** (Einheit, Untergrenze, Obergrenze, Warnbereich), Auswahl (Werte vorgeben, z. B. „sauber / nicht sauber“), Zahl (z. B. verworfene Menge), Foto, Text |
| **5. Wenn etwas nicht stimmt** | Zuordnung **Bedingung → Maßnahme** (z. B. „Temperatur > Obergrenze → Maßnahme ‚Kühlung zu warm‘“), wer benachrichtigt wird, Eskalation bei Überfälligkeit |
| **6. Nachweis und Gültigkeit** | Nachweis (Haken, Unterschrift, Foto), gültig ab, Standardzuteilung (alle Shops, keine, nur Shops mit Gerätetyp), Freigabe |

**Versionen:** Jede Änderung an einer freigegebenen Regel erzeugt eine neue Version mit „gültig ab“. Bereits erledigte Aufgaben behalten die Version, mit der sie erledigt wurden. Berichte zeigen immer, welche Regel damals galt.

**Vorschau:** Vor dem Speichern zeigt die Zentrale, wie die Regel die Tagesliste eines gewählten Shops an einem gewählten Tag verändert, zum Beispiel „+ 3 Aufgaben in Minden, 0 in Sinsheim (keine Eismaschine)“.

---

## 5. Intervalle

| Intervall | Einstellung | Beispiel |
|---|---|---|
| **Bei Öffnung** | Minuten nach Öffnung (aus den Öffnungszeiten des Shops) | Temperaturen messen, spätestens 30 Min. nach Öffnung |
| **Bei Schließung** | Minuten vor oder nach Ladenschluss | Froyo-Maschine reinigen |
| **Zu Schichtbeginn/-ende** | Schicht aus der Einsatzplanung (Früh, Mittel, Spät) | Spätdienst: Kühlung zweite Messung |
| **Mehrmals täglich** | alle x Stunden innerhalb der Öffnungszeit, oder feste Uhrzeiten | Standzeit Obstsalat alle 2 Std. |
| **Täglich** | Uhrzeit oder Zeitfenster | 14:00 Theke grundreinigen |
| **An Wochentagen** | Auswahl Mo–So | Mo, Do: Wareneingang Obst |
| **Wöchentlich** | Wochentag | Mo: Kühlgeräte innen reinigen |
| **Monatlich** | Tag oder „erster Montag“ | Schädlingskontrolle |
| **Vierteljährlich / jährlich** | Datum oder Monat | Dichtungen tauschen, Belehrung |
| **Nach Ereignis** | ausgelöst durch Wareneingang, Lieferung, Abtauen oder Gerätereparatur | nach Lieferung: Temperatur und MHD prüfen |
| **Bei Bedarf (spontan)** | jederzeit startbar, **Grund ist Pflicht** | Sonderreinigung nach Glasbruch |

**Regeln für die Erzeugung:**
- Aufgaben entstehen nur an Tagen, an denen der Shop **geöffnet** ist (Öffnungszeiten, Sondertage, Feiertage, Center-Schließung).
- „Mehrmals täglich“ richtet sich nach der tatsächlichen Öffnungszeit: An einem langen Samstag gibt es mehr Prüfungen.
- Fällt eine wöchentliche oder monatliche Aufgabe auf einen Schließtag, wird sie auf den nächsten Öffnungstag verschoben und als „verschoben“ markiert.
- Jede Aufgabe hat **fällig ab**, **fällig bis** und eine **Toleranz**. Danach ist sie überfällig.

---

## 6. Zuständigkeit: Person oder Schicht

| Art | Wie die App sie auflöst |
|---|---|
| **Schicht** (Früh, Mittel, Spät, Öffnung, Schließung) | Alle Personen, die laut **veröffentlichtem Einsatzplan** in dieser Schicht im Shop eingeteilt sind. Ist niemand eingeteilt, geht die Aufgabe an die Shopleitung (Hinweis „niemand eingeteilt“). |
| **Rolle** (z. B. Shopleitung, Stellvertretung) | Alle Personen mit dieser Rolle im Shop, die heute Dienst haben |
| **Person** | genau diese Person. Ist sie abwesend (krank/Urlaub), geht die Aufgabe an die eingetragene Vertretung, sonst an die Shopleitung. |
| **Alle im Dienst** | jeder, der gerade eingestempelt ist |

- Die Zuständigkeit wird **jeden Tag neu berechnet**, mit Schichttausch und Krankmeldung. Ändert sich der Plan, ändert sich die Liste mit.
- **Abhaken darf jeder im Dienst.** Die Zuständigkeit sagt, wer erinnert wird und wem die Aufgabe angezeigt wird. Wer tatsächlich abgehakt hat, steht in der Durchführung.
- Persönliche Push-Erinnerung zu Beginn des Zeitfensters, aber nur an Personen, die eingestempelt sind (Ruhezeit-Regel aus FR-NACHRICHTEN).

---

## 7. Korrekturmaßnahmen

### 7.1 Aufbau
Eine Maßnahme ist eine **geführte Folge von Schritten**, global gepflegt und mehreren Regeln zuordenbar.

| Feld | Inhalt |
|---|---|
| Auslöser | Prüfpunkt + Bedingung (über Obergrenze, unter Untergrenze, Auswahl „nicht in Ordnung“, Gerät defekt) |
| Stufe | 🟡 **Warnung** (Warnbereich) oder 🔴 **kritisch** (Grenze überschritten) |
| Schritte | Liste mit Auswahl, die abgehakt wird. Ein Schritt kann eine Eingabe verlangen (Menge verworfen, Foto, Name Techniker). |
| Nachkontrolle | automatische Folgeaufgabe nach x Min. (z. B. erneut messen) |
| Benachrichtigung | Shopleitung sofort (🔴), Bezirksleitung bei 🔴 ohne Abschluss nach x Std. |
| Abschluss | erst wenn alle Pflichtschritte erledigt sind und die Nachkontrolle in Ordnung ist. Sonst bleibt die Abweichung offen und eskaliert. |

### 7.2 Beispiel „Kühlvitrine Obst zu warm“
Die Grenzwerte sind Beispiele und werden von der Hygiene-/QS-Verantwortung festgelegt.

| Messwert | Anzeige | Was die App zeigt |
|---|---|---|
| bis +7 °C | 🟢 in Ordnung | Haken, fertig |
| +7,1 bis +8 °C | 🟡 Warnung | 1. Tür und Dichtung prüfen, Vitrine nicht überladen · 2. **Nachmessen in 30 Min.** (Aufgabe entsteht automatisch) |
| über +8 °C oder Nachmessung wieder zu hoch | 🔴 kritisch | 1. Ware auf Temperatur prüfen · 2. Auswahl: „Ware in Ordnung, umgelagert“ / „Ware verworfen, Menge: …“ · 3. Gerät „gestört“ melden, Techniker anrufen (Nummer aus den Gerätedaten) · 4. Foto · Die Shopleitung bekommt sofort eine Push-Nachricht. |

### 7.3 Weitere Standard-Maßnahmen (Startpaket)
- Tiefkühler zu warm
- Lieferung zu warm oder MHD überschritten (Annahme verweigern, Foto, Lieferant)
- Standzeit überschritten (verwerfen, Menge)
- Reinigung nicht möglich (Grund, Nachholtermin)
- Gerät defekt (Gerät sperren: Aufgaben für dieses Gerät pausieren, bis es wieder freigegeben ist)
- Schädlingsbefall (sofort Shopleitung, Fachfirma, Bereich sperren)
- Mitarbeiter mit Krankheitsanzeichen (nicht im Lebensmittelbereich einsetzen, Shopleitung)

---

## 8. Zuteilung an die Shops

### 8.1 Drei Wege
1. **Automatisch über das Gerät:** Eine Regel mit Gerätetyp gilt für **jedes Gerät dieses Typs** im Shop. Zwei Kühlvitrinen ergeben zwei Aufgaben, keine Eismaschine ergibt keine Aufgabe. Kommt ein Gerät dazu oder geht eines weg, ändern sich die Aufgaben ab dem nächsten Tag von selbst.
2. **Zuteilung durch die Zentrale:** In der **Zuteilungs-Matrix** (Regeln × Shops) setzt die Zentrale oder Bezirksleitung je Feld: ✅ aktiv · ➖ nicht zutreffend · ✏️ angepasst.
3. **Übernahme durch die Shopleitung:** Neue oder geänderte Regeln erscheinen bei der Shopleitung unter **„Neue Regeln“**. Sie wählt „übernehmen“ (optional mit eigener Uhrzeit oder Zuständigkeit) oder „trifft nicht zu“ mit Grund (z. B. „keine Saftpresse“).

### 8.2 Was die Shopleitung anpassen darf

| Darf | Darf nicht |
|---|---|
| Uhrzeit und Zeitfenster verschieben (innerhalb der Vorgaben) | Grenzwerte lockern |
| Zuständigkeit wählen (Schicht, Person) | Pflichtregeln abschalten (nur mit Grund und Freigabe durch Bezirksleitung oder QS) |
| Häufigkeit **erhöhen** (z. B. Standzeit stündlich statt alle 2 Std.) | Häufigkeit senken |
| eigene **Zusatzaufgaben** für ihren Shop anlegen | Maßnahmenschritte entfernen |
| Geräte im Shop pflegen (anlegen, umbenennen, als defekt melden) | Regeln anderer Shops ändern |

Jede Anpassung wird mit Person, Zeit und Grund protokolliert. Die Zentrale sieht in der Matrix sofort, wo ein Shop abweicht.

### 8.3 Franchise
Regeln der Systemzentrale gelten als **Systemstandard** für alle Betreiber. Franchisenehmer können wie eine Shopleitung anpassen und ergänzen, aber Systemstandards nicht lockern. Die Systemzentrale sieht die Erfüllungsquote je Shop ohne Personennamen (siehe Franchise-Modell im Hauptkonzept).

---

## 9. Durchführung im Shop (Tablet und Handy)

### 9.1 Tagesliste
- **Stand-Tablet:** große Liste, nach Uhrzeit sortiert, Filter nach Bereich, Farben 🟢 erledigt · 🟡 jetzt fällig · 🔴 überfällig · ⚪ später · 🟠 Abweichung offen.
- **Handy:** „Meine Aufgaben“ (nach meiner Schicht) und „Alle Aufgaben im Shop“.
- Oben eine **Zusammenfassung**: „12 von 18 erledigt · 1 überfällig · 1 Abweichung offen“.

### 9.2 Abhaken in 4 Schritten
1. **Anmelden:** Ausweis-QR oder PIN am Tablet, am Handy ist man schon angemeldet.
2. **Aufgabe öffnen:** antippen oder den **QR-Aufkleber am Gerät** scannen. Das öffnet genau die fällige Aufgabe des Geräts und belegt, dass man vor Ort war.
3. **Prüfpunkte ausfüllen:** Die App prüft sofort. Liegt ein Wert außerhalb, öffnet sich **direkt die Maßnahme** (Kap. 7).
4. **Abschließen:** Haken, Unterschrift oder Foto, je nach Regel. Fertig, die Tagesliste wird grün.

### 9.3 Sonderfälle
- **Nicht möglich:** Auswahl des Grundes (Gerät defekt, Ware fehlt, Shop geschlossen, Sonstiges mit Text). Das erzeugt eine Abweichung, die Aufgabe gilt nicht als erledigt.
- **Nachtragen:** möglich bis Tagesende, gekennzeichnet mit „nachgetragen um …“ und der echten Uhrzeit.
- **Offline:** Das Tablet speichert alles mit Gerätezeit und Laufnummer und überträgt es später. Solche Einträge werden als „offline erfasst“ markiert.
- **Tagesabschluss:** Die Shopleitung bestätigt abends „Hygiene geprüft“. Offene Punkte müssen dabei begründet werden.
- **Unveränderbar:** Durchführungen werden nur angehängt (Hash-Kette). Eine Korrektur ist ein neuer Eintrag mit Verweis auf den alten.

---

## 10. Startpaket „frooters Standard“ (Vorschlag)

Die Werte sind Vorschläge zur Abstimmung mit der Hygiene-/QS-Verantwortung und den Herstellerangaben der Geräte.

| # | Regel | Bereich | Gerätetyp | Intervall | Zuständig | Prüfpunkte | Maßnahme |
|---|---|---|---|---|---|---|---|
| 1 | Temperatur Kühlvitrine | Kühlung | Kühlvitrine | Öffnung + 14:00 + Schließung | Öffnung / Mittel / Spät | °C, max. +7 | Kühlung zu warm |
| 2 | Temperatur Tiefkühler | Kühlung | Tiefkühler | Öffnung + Schließung | Öffnung / Spät | °C, max. −18 | Tiefkühler zu warm |
| 3 | Froyo-Maschine Temperatur und Sichtprüfung | Froyo-Station | Froyo-Maschine | Öffnung | Öffnung | °C, Haken | Kühlung zu warm |
| 4 | Froyo-Maschine reinigen | Froyo-Station | Froyo-Maschine | nach Herstellervorgabe, z. B. Schließung | Spätdienst | Haken, Foto | Reinigung nicht möglich |
| 5 | Eismaschine reinigen | Eis | Eismaschine | Schließung | Spätdienst | Haken, Foto | Reinigung nicht möglich |
| 6 | Saftpresse zerlegen und reinigen | Saftbar | Saftpresse | Schließung | Spätdienst | Haken | Reinigung nicht möglich |
| 7 | Mixer reinigen | Saftbar | Mixer | Schließung | Spätdienst | Haken | Reinigung nicht möglich |
| 8 | Handwaschplatz Seife/Desinfektion/Papier | Personal | – | Öffnung + Schichtbeginn | jede Schicht | 3 Haken | – (nachfüllen) |
| 9 | Personalhygiene Schichtbeginn | Personal | – | Schichtbeginn | jede Person | Haken je Person, keine Krankheitsanzeichen | Mitarbeiter mit Krankheitsanzeichen |
| 10 | Wareneingang prüfen | Wareneingang | – | nach Ereignis „Lieferung“ | wer annimmt | °C, MHD, Verpackung, Foto bei Mangel | Lieferung mangelhaft |
| 11 | Standzeit geschnittenes Obst / Obstsalat | Theke | Kühlvitrine | alle 2 Std. in der Öffnungszeit | alle im Dienst | Auswahl, Menge verworfen | Standzeit überschritten |
| 12 | Toppings-Behälter wechseln | Theke | – | alle 4 Std. | alle im Dienst | Haken | – |
| 13 | Theke und Arbeitsflächen reinigen | Theke | – | Mittag + Schließung | Mittel / Spät | Haken | – |
| 14 | Waffeleisen reinigen | Theke | Waffeleisen | Schließung | Spätdienst | Haken | Reinigung nicht möglich |
| 15 | Boden und Abfall | Theke | – | Schließung | Spätdienst | Haken | – |
| 16 | Kühlgeräte innen reinigen | Kühlung | Kühlvitrine, Tiefkühler | wöchentlich Mo | Frühdienst | Haken, Foto | Reinigung nicht möglich |
| 17 | Tiefkühler abtauen | Kühlung | Tiefkühler | monatlich | Shopleitung | Haken | – |
| 18 | Schädlingskontrolle | Lager | – | monatlich | Shopleitung | Auswahl „kein Befall / Befall“ | Schädlingsbefall |
| 19 | Dichtungen Froyo-/Eismaschine prüfen | Froyo-Station | Froyo-Maschine, Eismaschine | monatlich | Shopleitung | Auswahl, Foto | Gerät defekt |
| 20 | Belehrung nach § 43 IfSG | Personal | – | alle 2 Jahre je Person (Erinnerung 30 Tage vorher) | Shopleitung | Nachweis hochladen | – |

**Beispiel:** Ein Shop ohne Eismaschine, ohne Waffeleisen und mit nur einer Kühlvitrine bekommt die Regeln 5, 14 und 19 (Teil Eismaschine) nicht. Regel 1 erscheint dort nur einmal statt zweimal.

---

## 11. Bildschirme in der PC-Zentrale

| Bildschirm | Inhalt |
|---|---|
| **Regelbibliothek** | alle Regeln, Filter nach Bereich, Gerätetyp, Pflicht und Status (Entwurf, freigegeben, archiviert). Spalte „gilt in x Shops“. |
| **Regel-Assistent** | 6 Schritte (Kap. 4), Vorschau der Tagesliste für einen Shop und Tag |
| **Maßnahmenkatalog** | Maßnahmen mit Schritten, Nachkontrolle und Benachrichtigung |
| **Bereiche und Gerätetypen** | globale Auswahllisten |
| **Geräte je Shop** | Geräte mit Typ, Name, Standort, Hersteller und Techniker-Nummer. QR-Aufkleber drucken, Gerät stilllegen. |
| **Zuteilungs-Matrix** | Regeln × Shops: ✅ ➖ ✏️, Abweichungen der Shops hervorgehoben |
| **Tagesplan-Vorschau** | was ein Shop an einem Datum bekommt, mit Begründung („wegen Gerät Kühlvitrine 2“) |
| **Auswertung** | Erfüllungsquote je Shop, Bezirk und gesamt, offene Abweichungen, häufige Ausfälle, Temperaturverläufe je Gerät |
| **Berichte** | PDF und CSV je Shop und Zeitraum für die Lebensmittelkontrolle, mit Prüfsumme |
| **Protokoll** | alle Änderungen an Regeln, Zuteilungen und Grenzwerten |

---

## 12. Datenmodell

Präfix `fr_hyg_`, RLS auf allen Tabellen, Zugriff nur über die Edge Function, Grants ausdrücklich in jeder Migration.

| Tabelle | Wichtige Felder |
|---|---|
| `fr_hyg_bereich` | id, name, sortierung, aktiv |
| `fr_hyg_geraetetyp` | id, name, symbol, aktiv |
| `fr_hyg_geraet` | id, filiale_id, geraetetyp_id, name, standort, hersteller, techniker_kontakt, qr_code, status (aktiv, gestört, stillgelegt), von, bis |
| `fr_hyg_regel` | id, betreiber_id (null = Systemstandard), titel, bereich_id, geraetetyp_id (optional), pflicht, standard_zuteilung (alle, keine, nur_mit_geraet), status, aktuelle_version |
| `fr_hyg_regel_version` | regel_id, version, gueltig_ab, anleitung, medien, intervall (JSON: art, anker, uhrzeiten, alle_x_std, wochentage, monatsregel, ereignis), zeitfenster_min, toleranz_min, zustaendigkeit (JSON: art, schicht/rolle/person, vertretung), nachweis, freigegeben_von, freigegeben_am |
| `fr_hyg_pruefpunkt` | regel_version_id, nr, art (haken, messwert, auswahl, zahl, foto, text), einheit, untergrenze, obergrenze, warn_unten, warn_oben, auswahlwerte, pflicht |
| `fr_hyg_massnahme` | id, titel, stufe, schritte (JSON), nachkontrolle_min, benachrichtigen (Rollen), eskalation_std |
| `fr_hyg_regel_massnahme` | pruefpunkt_id, bedingung (ueber_ober, unter_unter, warnbereich, auswahl_wert, nicht_moeglich), massnahme_id |
| `fr_hyg_zuteilung` | regel_id, filiale_id, status (aktiv, nicht_zutreffend, offen), anpassung (JSON: uhrzeit, zustaendigkeit, haeufiger), grund, geaendert_von, geaendert_am |
| `fr_hyg_aufgabe` | id, filiale_id, datum, regel_version_id, geraet_id, faellig_ab, faellig_bis, zustaendigkeit_aufgeloest, status (geplant, faellig, ueberfaellig, erledigt, erledigt_abweichung, nicht_moeglich, verpasst, verschoben), quelle (plan, nachkontrolle, spontan, ereignis) |
| `fr_hyg_durchfuehrung` | id, aufgabe_id, person_id, zeitpunkt, geraetezeit, offline, werte (JSON), nachweis, nachgetragen, ersetzt_id, hash_vorher, hash |
| `fr_hyg_abweichung` | id, aufgabe_id, pruefpunkt_id, wert, stufe, massnahme_id, schritte_erledigt (JSON), status (offen, in_arbeit, abgeschlossen, eskaliert), abgeschlossen_von, abgeschlossen_am |
| `fr_hyg_tagesabschluss` | filiale_id, datum, bestaetigt_von, zeitpunkt, offene_punkte_begruendung |

**Erzeugung der Tagesliste:** Ein Zeitplaner (pg_cron) erzeugt jede Nacht die Aufgaben des Tages je Shop aus Zuteilungen, Geräten, Öffnungszeiten und Regelversionen. Bei Änderungen (neue Zuteilung, Gerät gestört, Sonderöffnung) erzeugt er nur die zukünftigen Aufgaben des Tages neu. Erledigte Aufgaben werden nie verändert. Die Zuständigkeit wird beim Anzeigen aus dem aktuellen Einsatzplan aufgelöst.

**Sensoren (später):** Ein Adapter `fr_hyg_sensor` kann Messwerte automatisch als Durchführung eintragen, gekennzeichnet als „Sensor“. Grenzwerte und Maßnahmen bleiben dieselben. Kein fest eingebauter Anbieter (KICC-Regel 4 und 18).

---

## 13. Rechte

| Aktion | Mitarbeiter | Stv. SL | Shopleitung | Bezirk | Inhaber / QS | Franchisenehmer |
|---|---|---|---|---|---|---|
| Aufgaben abhaken | ✅ | ✅ | ✅ | ✅ (wenn im Shop) | – | ✅ (eigene Shops) |
| Maßnahmen durchführen | ✅ | ✅ | ✅ | ✅ | – | ✅ |
| Abweichung abschließen | – | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tagesabschluss | – | ✅ | ✅ | – | – | ✅ |
| Regeln übernehmen und anpassen (Shop) | – | wenn erlaubt | ✅ | ✅ | ✅ | ✅ |
| Geräte des Shops pflegen | – | ✅ | ✅ | ✅ | ✅ | ✅ |
| Globale Regeln, Maßnahmen, Grenzwerte | – | – | – | Vorschlag | ✅ | eigene Zusatzregeln |
| Pflichtregel abschalten | – | – | Antrag | ✅ | ✅ | Antrag an Systemzentrale |
| Berichte | eigener Shop heute | Shop | Shop | Bezirk | alle | eigene Shops |

---

## 14. Feature-IDs und Definition of Done

| Feature-ID | Inhalt | Phase |
|---|---|---|
| FR-HYG-01 | Bereiche, Gerätetypen, Geräte je Shop, QR-Aufkleber | 1 |
| FR-HYG-02 | Regelbibliothek, Regel-Assistent, Versionen, Freigabe | 1 |
| FR-HYG-03 | Prüfpunkte mit Grenzwerten und Warnbereich | 1 |
| FR-HYG-04 | Maßnahmenkatalog, Nachkontrolle, Eskalation | 1 |
| FR-HYG-05 | Zuteilung: automatisch über Gerät, Matrix, Übernahme durch Shopleitung | 1 |
| FR-HYG-06 | Erzeugung der Tagesliste (Intervalle, Öffnungszeiten, Verschieben) | 1 |
| FR-HYG-07 | Zuständigkeit über Schicht, Rolle, Person aus dem Einsatzplan | 1 (Schicht nach FR-PLANUNG) |
| FR-HYG-08 | Tagesliste Tablet und Handy, Abhaken, QR-Scan, offline | 1 |
| FR-HYG-09 | Abweichung mit geführter Maßnahme | 1 |
| FR-HYG-10 | Tagesabschluss, Auswertung, PDF-Bericht | 1 |
| FR-HYG-11 | Startpaket „frooters Standard“ | 1 |
| FR-HYG-12 | Sensor-Adapter | später |

**Definition of Done je Feature:** Rechte serverseitig geprüft · RLS und Grants · Vertragstests grün · Oberflächentest Tablet und Handy · Erklärvideo · Hilfeartikel und Frootie-Antwort · Audit · Zero-Cost-Check · Version erhöht.

**Pflicht-Testfälle (Auswahl):**
1. Shop ohne Eismaschine bekommt keine Eismaschinen-Aufgabe. Wird eine Eismaschine angelegt, erscheint die Aufgabe ab dem nächsten Tag.
2. Zwei Kühlvitrinen ergeben zwei Aufgaben je Messzeitpunkt.
3. Gerät „gestört“ pausiert seine Aufgaben und erzeugt keine „verpasst“-Einträge.
4. Messwert im Warnbereich erzeugt eine Nachkontrolle nach 30 Min. Ein kritischer Wert benachrichtigt die Shopleitung.
5. Eine Abweichung lässt sich erst schließen, wenn alle Pflichtschritte erledigt sind und die Nachkontrolle in Ordnung ist.
6. Krankmeldung der zuständigen Person verschiebt die Aufgabe an die Vertretung bzw. Shopleitung.
7. Sonntag geschlossen ergibt keine Aufgaben. Eine wöchentliche Montagsaufgabe am Feiertag wird auf Dienstag verschoben.
8. Shopleitung kann einen Grenzwert nicht lockern (Server lehnt ab).
9. Offline erfasste Einträge werden nachträglich übertragen und markiert.
10. Nicht erledigte Aufgaben erscheinen nie grün, auch nicht im Bericht.

---

## 15. Offene Punkte

1. Wer legt die verbindlichen Grenzwerte und Maßnahmen fest (Inhaber, QS-Verantwortliche, externer Hygieneberater)? Die Tabelle in Kap. 10 ist nur ein Vorschlag.
2. Welche Geräte gibt es in welchem Shop (Liste für den Start)?
3. Reinigungsintervalle der Froyo- und Eismaschinen laut Hersteller
4. Sollen Sensoren für Kühlgeräte später angebunden werden?
5. Wie lange wird die Hygienedokumentation aufbewahrt? Vorschlag: 2 Jahre, mit der Lebensmittelüberwachung abstimmen.

---

## 16. Quellen

- Flowtify im App Store: https://apps.apple.com/de/app/flowtify/id1297953031
- KI-Syndikat, Eintrag Flowtify (Hinweis auf Übernahme durch FoodNotify): https://www.ki-syndikat.de/tools/flowtify/
- deutsche-startups.de, „Flowtify hilft per App beim Hygiene- und Qualitätsmanagement“ (2019): https://www.deutsche-startups.de/2019/06/26/flowtify-hygiene/
- High-Tech Gründerfonds, Seed-Finanzierung Flowtify: https://www.htgf.de/en/seed-financing-for-flowtify-paperless-hygiene-and-quality-management/
- g-wie-gastro.de, HACCP-Notfallprotokoll bei Temperaturabweichung: https://g-wie-gastro.de/kostenlose-downloads-fuer-die-gastronomie/downloads-haccp-gastronomie/haccp-notfallprotokoll-bei-abweichung-der-temperatur/
- IHK Köln, HACCP in der Praxis: https://www.ihk.de/koeln/hauptnavigation/wirtschaftsstandort/gastgewerbe-und-tourismus/haccp-in-der-praxis-der-richtige-umgang-mit-lebensmitteln-5460422
