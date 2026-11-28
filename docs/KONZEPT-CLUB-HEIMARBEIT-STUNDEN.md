# Konzept: Heimarbeit-Stunden im „Mein Stundenkonto“ (KC-CLUB-HEIMARBEIT)

Stand: 28.11.2026 · Wunsch Hansi · umgesetzt in Club-App 3.54.0

## Anlass

Andrea arbeitet für den Weihnachtsmarkt zu Hause (Vorbereitungen) und soll ihre Stunden täglich selbst in der Club-App eintragen.
Hansi: „Es gibt eine Kachel *Mein Stundenkonto*. Könnte das dort angebunden werden? … Die Möglichkeit aber nur für Andrea erst mal.“

Geprüfte Alternativen:

- **Erstattung** (Zeit mitmelden): passt nicht – Zeit geht dort nur zusammen mit einer Fahrt oder einem Einkauf; ohne Auslage entstünden 0-€-Anträge beim Kassenwart.
- **Twinkey → „Sonderstunden melden“**: funktioniert, ist aber für tägliches Eintragen zu umständlich (Dienstwunsch → Twinkey → Einsatz → Tätigkeit).
- **DP2 Zone „Z“ (Vorbereitung zuhause, Z · anderer Ort …)**: DP2 kennt Heimarbeit als Dienstart, die zu den Stunden der Person zählt, aber nicht zur Besetzung.
  Diese Dienste werden aber vorher mit festen Zeiten *geplant* – Andrea arbeitet nach Bedarf. Der Sondereinsatz verweist in der Bemerkung auf Zone Z.

## Lösung

1. **Freischaltung über den Sondereinsatz** (`kc_dp_special_events`): `payload.heimarbeit = true`, Person in `payload.vorgesehen`,
   Termin `FEST` mit Zeitraum. Angelegt: „Weihnachtsmarkt-Vorbereitung zu Hause“ (`SE-WM-2026-VORB-ZUHAUSE`), 01.–14.12.2026, nur Andrea.
2. **Meins → ⏱️ Mein Stundenkonto**: Karte „🏠 *Einsatz*“ mit „➕ Stunden eintragen“ – nur für vorgesehene Personen, nur im eigenen Konto,
   im Zeitraum und bis 3 Tage danach.
3. **Eingabe**: Tag (heute / gestern / vorgestern, nur im Zeitraum), Von/Bis in Viertelstunden (−1 Std./−15/+15/+1 Std.), Pause, „Was gemacht?“ (freiwillig),
   Anzeige „= x Std.“, ein Tipp „✅ Eintragen“. Einsatz und Tätigkeit („Vorbereitung“) setzt die App.
4. **Speichern** wie jede Sonderstunden-Meldung (`kc_dp_hour_reports`, Status `gemeldet`, Quelle `club_app`) – Prüfregeln von `sonderstundenMelden`
   (keine Zukunft, Viertelstunden, Doppelschutz, „verspätet“ nach 3 Tagen).
5. **Im Konto** sofort mit ⏳ vorläufig; der Planer bestätigt in DP2 → zählt in „Std. bestätigt“, Meldung „✅ Sonderstunden gutgeschrieben“.
   Bis dahin **ändern** oder **zurückziehen** (Status `zurueckgezogen`) – nur eigene, selbst gemeldete, noch nicht bestätigte Einträge.
6. **Abend-Erinnerung** (Wartung, 20–22 Uhr, einmal je Tag): an Einsatztagen ohne Eintrag „🏠 Heimarbeit-Stunden eintragen?“ – Push, sonst E-Mail;
   Link öffnet das Stundenkonto (`#stundenkonto`).

## Regeln

- Die Club-App meldet Stunden nur (Status `gemeldet`); einzige neue Ausnahme: eigene, noch nicht bestätigte Heimarbeit ändern/zurückziehen.
  Abgesichert durch `tests/app-vertrag.test.mjs`.
- Weitere Personen oder Einsätze: im Sondereinsatz `heimarbeit = true` setzen und die Person in `vorgesehen` eintragen – kein Programmcode nötig.

## Server / App

- Server `kc-club`: `hmEinsaetze`, `hmTagOk`, `hmErinnern`; Aktionen `heimarbeit_melden`, `heimarbeit_aendern`; `stundenkonto` liefert `heimarbeit`
  und je änderbarer Zeile `rid`.
- App: `teile/stundenkonto.js` (`hmKarteHtml`, `hmOeffnen`, `hmSpeichern`, `hmZurueck`), Sprungziel `#stundenkonto`.
