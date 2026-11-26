# Konzept: Stunden und km mit wenig Aufwand – Fahrtprofil und Sammel-Abrechnung (Club-App + DP2)

Feature-ID: **KICC-F-114** (Club-App: `KC-CLUB-FAHRTKOSTEN-SAMMEL`)
Stand: 26.11.2026 · Status: **KONZEPT** (noch nichts gebaut) · Baut auf KICC-F-112 (Zeit aus der Erstattung) und KICC-F-113 (Mein Stundenkonto) auf.

## 1. Problem

Einige Mitglieder machen Stunden und fahren km für **Sondereinsätze** und für den **Budendienst auf dem Weihnachtsmarkt**.

- Die **Stunden** am Stand kommen schon von selbst: Kasse bzw. Stechuhr → DP2 → „⏱️ Mein Stundenkonto“.
- Die **km** müssen heute für jede einzelne Fahrt als Erstattung eingetippt werden. Bei 10 Budendiensten sind das 10 Anträge, beim Kassenwart viele kleine Vorgänge.
- Manche Kollegen wohnen weiter weg und setzen Fahrtkosten an, andere wohnen am Ort und beantragen keine.

**Ziel:** Die App schlägt vor, das Mitglied bestätigt nur noch. Am Ende gibt es **einen** Antrag je Mitglied, und der Kassenwart gibt **alle auf einmal** frei.

## 2. Entscheidungen (Hansi, 25./26.11.2026)

1. Auch die **Fahrt zum Budendienst** wird mit km erstattet, nicht nur Sondereinsätze.
2. Abgerechnet wird **einmal nach dem Weihnachtsmarkt** (Sammel-Abrechnung je Mitglied).
3. Der **Kassenwart gibt alle Sammel-Anträge auf einmal frei** (Liste, ein Knopf).

## 3. Wer bekommt Fahrtkosten? Das Fahrtprofil

Jedes Mitglied legt **einmal** unter Meins → „🚗 Meine Fahrt zum Stand“ fest, wie es kommt. Es gibt nur Auswahl, keinen Freitext:

| Auswahl | Wirkung |
|---|---|
| **🚶 Keine Fahrtkosten** (zu Fuß, Rad, wohne am Ort, möchte nichts) – **Vorgabe** | Es entsteht nie eine km-Zeile. |
| **🚗 Mit dem eigenen Auto: __ km hin und zurück** | Jeder Budendienst bringt automatisch diese km. |

- Die Vorgabe ist „keine“. Wer nichts einstellt, bekommt keine km, und Kollegen am Ort müssen nichts tun.
- Gespeichert werden **nur die km**, keine Adresse.
- Vor dem Weihnachtsmarkt fragt die App einmal: „Bekommst du Fahrtkosten für den Budendienst?“ → Nein / Ja, __ km.
- **Fahrgemeinschaft:** Nur der Fahrer bekommt km. Die Club-App kennt die veröffentlichten Fahrgemeinschaften bereits. Ein Mitfahrer bekommt für diesen Tag keine km, auch wenn er ein Fahrtprofil hat.
- **Ausnahme an einem Tag** (sonst Rad, einmal Auto, oder umgekehrt): in der Sammel-Abrechnung je Zeile mit ✏️ ändern oder 🗑️ streichen.
- Die **Clubleitung** sieht in einer Liste, wer Fahrtkosten mit wie vielen km eingetragen hat. So gibt es keine Überraschungen bei der Freigabe.

Für **Sondereinsätze** gilt dasselbe Profil als Vorschlag. Weil das Ziel oft woanders liegt (z. B. Krankenhaus Dortmund), lassen sich die km beim Bestätigen ändern.

## 4. Ablauf

1. **Während des Weihnachtsmarkts:** nichts tun. Jeder geprüfte Budendienst (DP2-Kontoauszug, KICC-F-113) und jeder Sondereinsatz steht im Stundenkonto. Bei einem Fahrtprofil mit Auto bekommt er eine **vorläufige km-Zeile** „🚗 12 km · wird nach dem Weihnachtsmarkt abgerechnet“.
2. **Sondereinsätze:** Wen der Planer eingeteilt hat, der bekommt nach dem Einsatz eine Push-Frage: „Warst du beim Grünkohl-Kochen dabei, 07:00–15:30 Uhr? Mit dem Auto (km)?“ → **Ja** / Zeiten ändern / Nein. Ein Tipp meldet Stunden und km. Die Sammelmeldung für die Gruppe (Twinkey) bleibt.
3. **Nach dem letzten Markttag** („Weihnachtsmarkt beendet“ in DP2, bzw. Abschluss des Istplans): Push an jedes Mitglied mit km oder offenen Auslagen:
   > „Deine Abrechnung Weihnachtsmarkt 2026: 11 Dienste + 2 Sondereinsätze · 54,5 Std. · 186 km × 0,38 € = 70,68 €. Stimmt das?“
   > **✅ Ja, einreichen** · ✏️ ändern · 🗑️ Fahrt streichen
4. Aus „Ja“ wird **ein** Erstattungsantrag (Sammel-Antrag, Art „Fahrtkosten Weihnachtsmarkt“) mit allen Fahrten als Positionen, nach dem km-Satz am jeweiligen Tag.
5. Wer nach 14 Tagen nicht reagiert hat, bekommt eine Erinnerung. Nach einer zweiten Frist bleibt der Vorschlag liegen. Eingereicht wird nie ohne Bestätigung.
6. **Kassenwart:** Büro → 📥 Eingang → „Sammel-Abrechnung Weihnachtsmarkt“. Die Liste zeigt Mitglied, Std., km, Betrag und Auszahlungsweg, unten die Summe. Freigeben mit **„✅ Alle freigeben“**, einzelne Anträge lassen sich vorher abwählen. Danach CSV/Buchungsliste wie bisher.

Einzelne Erstattungen für Ungeplantes (Metzger, Einkauf, Parken, Zeit aus der Erstattung) bleiben unverändert.

## 5. Aufwand vorher / nachher

| | heute | neu |
|---|---|---|
| Mitglied am Ort | nichts | nichts |
| Mitglied mit Auto, 10 Budendienste | 10 Erstattungen | 1× Profil, 1 Tipp am Ende |
| Sondereinsatz | Twinkey-Meldung + Erstattung | 1 Tipp auf die Push-Frage |
| Kassenwart | viele Einzelanträge | 1 Liste, 1 Knopf |

## 6. Technik (kurz)

- **Fahrtprofil:** `kc_club_fahrtprofil` (person_id, art `keine`/`auto`, km_hin_zurueck, geändert_am). Nur Club-Server, RLS dicht.
- **km-Vorschlag** im Server aus dem DP2-Kontoauszug (`kc_dp_konto_published`, Art `stand`) und den Sondereinsätzen. Fahrgemeinschaften aus `kc_dp_carpools` (Mitfahrer → 0 km). Der km-Satz kommt aus `kc_club_km_satz` am Tag der Fahrt.
- Eine Fahrt wird nie doppelt abgerechnet: Abgleich mit vorhandenen Erstattungsanträgen (gleicher Tag, Art Fahrt).
- **Sammel-Antrag** als normaler `kc_club_erstattung`-Eintrag mit Kennzeichen `sammel: "KC-WM-2026"` und allen Positionen. Kein neues Buchungssystem.
- **Freigabe aller:** neue Leitungs-Aktion `erstattung_sammel_erledigen` (Liste von Antrags-IDs, eine Bestätigung, je Antrag die bestehende Logik und Benachrichtigung).
- **Auslöser „Weihnachtsmarkt beendet“:** letzter veröffentlichter Markttag vorbei und der Istplan bis dahin abgeschlossen (`istStatus`), oder Knopf der Clubleitung.
- Kosten: keine (nur vorhandene Supabase-Tabellen).

## 7. Tests / Definition of Done

- [ ] Profil „keine“ (Vorgabe) → keine km-Zeile, auch bei vielen Diensten
- [ ] Profil Auto 12 km, 11 geprüfte Dienste → 132 km im Vorschlag; Mitfahrer-Tage 0 km
- [ ] Vorschlag nur aus **geprüften** Diensten (DP2), vorläufige Kasse-Tage erst nach Prüfung
- [ ] Keine Doppelabrechnung mit schon eingereichten Einzelfahrten
- [ ] ✏️/🗑️ je Zeile; nichts wird ohne „Ja“ eingereicht
- [ ] Kassenwart: Liste, Summe, Abwählen, „Alle freigeben“ → jedes Mitglied bekommt seine Nachricht; CSV wie bisher
- [ ] Clubleitungs-Liste „wer hat Fahrtkosten eingetragen“
- [ ] Hilfe-Eintrag, CHANGELOG, Browser-Rundgang abgeschirmt

## 8. Offene Fragen an Hansi

1. Gibt es eine **Mindestentfernung** (z. B. erst ab 10 km hin und zurück), oder entscheidet jedes Mitglied selbst?
2. Soll die **Clubleitung das Fahrtprofil bestätigen**, bevor es zählt (z. B. 40 km bei jemandem aus Werne)? Oder reicht die Liste zum Draufschauen?
3. Gilt das Fahrtprofil auch für **andere Veranstaltungen** mit Dienstplan, oder nur für den Weihnachtsmarkt?
