# ParkPause – Prototyp Stellplatz-Freigabe Tiefgarage

**Feature-ID:** KICC-PARKPAUSE-PROTOTYP · **Stufe:** DEV (klickbarer Prototyp, Phase 1 des Konzepts)

**Ansehen:** https://sire65.github.io/KC-Infrastructure-Control-Center/parkpause/ (GitHub Pages, sobald auf `main`)

Inhaber geben ihren Tiefgaragenplatz für Abwesenheiten frei, Kolleginnen und Kollegen ohne Platz reservieren ihn, der Inhaber schaltet frei.

## Was der Prototyp zeigt

- **Lageplan** je Ebene, Räume mit zwei Platzreihen an einer Fahrgasse. LED: grün = reservierbar, gelb = angefragt, rot = vom Gast belegt, blau = Festplatz, grau = Inhaber nutzt, gestreift = ohne Mieter / gesperrt (unbekannt wird nie grün).
- **Reservieren:** „Ganzer freigegebener Zeitraum“ oder „Anderen Zeitraum wählen“, Kennzeichen, verbindliche Anfrage.
- **Mein Platz:** mehrere Freigaben im Voraus, Häkchen „aktiv“, „erst ab Datum reservierbar“, früher zurück, Anfragen freischalten/ablehnen.
- **Admin:** Garage (Anzahl Ebenen, Räume, Plätze, Kürzel, drei Nummernschemata), Plätze & Mieter (Typ, Merkmal, Besitzerwechsel zum Stichtag mit „beenden“ oder „übergeben“), Belegschaft, Erscheinungsbild (Name, Hausfarbe, Logo-Upload, Install-Icon), Regeln, Push & E-Mail, Datenbank.
- Installierbar (Manifest + Icon).

## Grenzen (bewusst)

- Beispieldaten mit erfundenen Namen. Speicherung nur im Browser (`localStorage`), jeder Betrachter hat seinen eigenen Stand. „Demo zurücksetzen“ unter Admin → Datenbank.
- Push, E-Mail und Datenbank sind simuliert. Echte Anbindung (geplant: Supabase bzw. Neon/PostgreSQL über Adapter, Web Push mit VAPID, SMTP) folgt im Pilot.
- Kein Sparkassen-Logo eingebaut: Marke erst nach Freigabe durch Marketing/Kommunikation über Admin → Erscheinungsbild hochladen.
- Unabhängig von KICC: eigene Seite, kein Eingriff in KICC-Cores, keine Kosten, keine Secrets.

## Definition of Done (Prototyp)

- [x] Lageplan mit 85 Beispielplätzen (2 Ebenen × 2 Räume, 6 Festplätze)
- [x] Freigeben, Reservieren (ganz/teilweise), Freischalten, Storno, früher zurück
- [x] Besitzerwechsel zum Stichtag
- [x] Ebenen/Räume/Nummern im Admin einstellbar
- [x] Handy-Breite ohne seitliches Scrollen, Hell/Dunkel
- [x] Smoke-Test: `node tests/parkpause-smoke.js`
- [ ] Lageplan nach echtem Foto/Skizze
- [ ] Freigabe durch Vorstand, Personalrat, Datenschutz vor Pilot

Konzept: Claude-Dokument „ParkPause – Konzept Stellplatz-Freigabe Tiefgarage“.
