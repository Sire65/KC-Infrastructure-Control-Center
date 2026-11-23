# ParkPause einrichten (eigenes Supabase-Konto)

**Feature-ID:** KICC-PARKPAUSE-APP · App: `parkpause/app/` · Datenbank: `supabase/parkpause/`

ParkPause läuft komplett getrennt von KC und von der Sparkasse: eigenes Supabase-Konto, eigenes Projekt, keine E-Mail-Adressen, keine echten Namen.

## 1. Supabase-Konto und Projekt (einmalig, durch den Betreiber)

1. Auf supabase.com mit einer **eigenen E-Mail-Adresse** (nicht ha-joko@web.de) ein kostenloses Konto anlegen.
2. Neue Organisation „ParkPause“ (Plan: **Free**), darin Projekt **ParkPause**, Region **Frankfurt (eu-central-1)**. Das Datenbank-Passwort sicher aufbewahren, es wird für die App nicht gebraucht.
3. Damit Claude das Projekt einrichten kann, ohne dass das KC-Konto getrennt werden muss:
   **Organization Settings → Team → Invite** → `ha-joko@web.de` mit der Rolle **Developer** einladen und die Einladung mit dem KC-Konto annehmen.
   (Developer darf Datenbank und Funktionen einrichten, aber nichts an Abrechnung oder Konto ändern. Das Projekt zählt nicht gegen die Free-Grenze des KC-Kontos.)
4. **Authentication → Sign In / Providers → „Allow new users to sign up“ ausschalten.** Konten entstehen nur über die Registrierung mit Einladungscode.

## 2. Einrichtung durch Claude (sobald Schritt 1 erledigt ist)

1. `supabase/parkpause/migrations/001_parkpause.sql` einspielen.
2. Push-Schlüssel erzeugen: `node supabase/parkpause/tools/vapid.mjs`
   - `VAPID_PUBLIC` → `parkpause/app/config.js` (`vapidPublic`)
   - Funktions-Secrets setzen: `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT` (= `https://sire65.github.io/KC-Infrastructure-Control-Center/parkpause/app/`)
3. Funktionen bereitstellen, beide mit `verify_jwt = false` (sie prüfen selbst):
   - `pp-auth` (Registrierung mit Einladungscode, Passwort-Reset durch Admins)
   - `pp-push` (Push-Versand)
4. Projekt-URL und **Publishable key** in `parkpause/app/config.js` eintragen. Der Publishable key darf öffentlich sein, er gibt nur frei, was die Zugriffsregeln erlauben. Der Service-Schlüssel kommt nie in die App.
5. Einladungscode auslesen (`select invite_code from pp_secret`) und an den Betreiber geben.

## 3. Start

1. Betreiber öffnet `https://sire65.github.io/KC-Infrastructure-Control-Center/parkpause/app/` und registriert sich mit dem Einladungscode. **Das erste Konto wird automatisch Admin.**
2. Admin → Garage → „Vorschlag anlegen“ (2 Ebenen, 4 Räume, 85 Plätze) oder eigene Ebenen/Räume; Festplätze unter „Plätze & Mieter“ markieren.
3. Admin → Einladung → Text kopieren und an Kolleginnen und Kollegen schicken.
4. Jede Person registriert sich selbst mit Pseudonym und trägt ihren Platz im Plan ein (oder „Ich habe keinen Platz“).

## Was wer sieht

| Daten | sichtbar für |
| --- | --- |
| Pseudonym, Platz-Zuordnung, Freigabe-Zeiträume | alle Mitglieder |
| Belegung eines Platzes (frei / angefragt / belegt) | alle Mitglieder, ohne Person |
| Wer reserviert hat, Kennzeichen, Nachricht | nur der Gast selbst und der Platzinhaber |
| Mitteilungen | nur der Empfänger |
| Einladungscode | nur Admins |
| Konto ohne Profil (fremde Registrierung) | sieht gar nichts |

**Meine Daten löschen** (Profil) entfernt Konto, Profil, Zuordnungen, Freigaben, Reservierungen, Mitteilungen und Push-Abos sofort; betroffene Inhaber und Gäste werden benachrichtigt. Admins können Mitglieder ebenso entfernen.

## Kosten

Supabase Free: 0 €. Grenzen: Ein Projekt pausiert nach etwa einer Woche ohne Nutzung (im Dashboard mit einem Klick fortsetzen), 500 MB Datenbank, 500 000 Funktionsaufrufe im Monat. Für 85 Plätze reicht das deutlich. Hosting über GitHub Pages: 0 €. Push über die Web-Push-Dienste der Browser: 0 €.

## Tests

- Datenbanklogik: `PGURL=postgres://postgres@127.0.0.1:5432 supabase/parkpause/tests/run.sh` (leere Postgres ≥ 15 mit btree_gist) → „ALLE TESTS BESTANDEN“
- Oberfläche: `node tests/parkpause-app-smoke.js` (mit Supabase-Attrappe)
