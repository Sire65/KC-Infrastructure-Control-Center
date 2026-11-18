# Plan: Geheimnis-Übersicht und ein Tresor

Status: GEPLANT – Start nach dem Egress-Sparprogramm (siehe `EGRESS-SPARTAKT-2026-11.md`).
Freigabe Admin: 18.11.2026 („alles muss übersichtlich und logisch aufbewahrt werden“).

## KICC-F-120 Geheimnis-Übersicht (ohne Werte)

Ziel: Eine Stelle, an der alle Zugangsdaten und Schlüssel der KC-Systeme auffindbar sind – **welche** es gibt,
**wofür**, **warum**, **wo** sie eingetragen sind – ohne dass ein Wert je angezeigt, gespeichert oder übertragen wird.

### Inhalt je Eintrag

| Feld | Beispiel |
|---|---|
| Name (technisch) | `KC_COMMUNICATION_WEBDE_PASSWORD` |
| Bezeichnung | web.de Club-Postfach – Passwort für den Versand |
| Zweck / wofür | KC Communicator verschickt E-Mails über smtp.web.de |
| Warum nötig | Anmeldung am web.de-Postfach `koecheclub-werne@web.de` |
| System / Programm | KC Communicator (`kc-communication-dispatch`) |
| Ablageort | Supabase Vault · Supabase Edge-Function-Secrets · Cloudflare Notfall-Tresor (`kc-notfall-tresor`) · Passwort-Manager Vorstand · GitHub Secrets … |
| Projekt | `ptblnpiroqftcvlsrhac` (KC Core) |
| Art | Passwort · API-Schlüssel · Token · Zertifikat/Schlüsselpaar |
| Wer darf es benutzen | Programme (z. B. `kc-communication-dispatch`) und Rollen (z. B. Admin) mit Zugriff |
| Verantwortlich / wer weiß Bescheid | Rolle (z. B. Admin, Vorstand) – keine privaten Kontaktdaten |
| Zuletzt geändert | automatisch, wo ermittelbar (z. B. Supabase meldet „vor x Minuten“) |
| Erneuern bis | Datum, Ampel bei Fälligkeit |
| Status | aktiv · Reserve · stillgelegt · UNBEKANNT (nie als OK anzeigen) |

### Ort

Wunsch Admin 18.11.2026: in der Club-App unter Admin (nur Admin-Rolle). Daten nur Metadaten, Tabelle in KC Core.

### Bedienung

- **Live-Suche** über alle Textfelder (Name, Bezeichnung, Zweck, System, Ablageort).
- **Filter**: Ablageort, System/Programm, Art, Status, Erneuerung fällig.
- Auswahl statt Freitext, wo möglich (Ablageort, Art, Status, System aus der Programm-Registry).
- Hinweis bei Einträgen, deren Ablageort nicht mehr existiert oder deren Alter unbekannt ist.

### Sicherheit (Muss)

- Die Übersicht speichert und zeigt **nie einen Wert** – nur Metadaten. Kein Eingabefeld für Werte.
- Werte werden ausschließlich am Ablageort eingetragen (z. B. Supabase-Dashboard, Vault, Passwort-Manager).
- Lesen nur für Admin-Rollen, Ändern der Metadaten nur Admin, jede Änderung im Audit.
- Keine Werte in Logs, Antworten, Browser-Speicher, Repository (AGENTS.md Regel 15).

### Definition of Done

- Tabelle + RLS + Grants (service_role / admin), Migration mit Rollback.
- Ansicht im KICC (oder Communicator-Verwaltung) mit Live-Suche und Filtern, mobil bedienbar.
- Erstbefüllung mit allen bekannten Secrets (Communicator, Push/VAPID, Brevo, Mailjet, Resend, web.de, Spiegel/Neon, Backup/B2, GitHub-Abläufe …) – nur Namen und Metadaten.
- Tests: kein Wert-Feld im Schema, keine Werte in API-Antworten, Suche/Filter, Rechteprüfung, UNKNOWN wird nicht als OK angezeigt.
- Zero-Cost-Check bestanden, Doku aktualisiert.

## KICC-F-121 Technische Schlüssel in einen Tresor (Supabase Vault)

Ziel: Für Programme nur noch **einen** Ablageort. Heute zwei: Supabase Vault (z. B. VAPID-Schlüssel über
`kc_communication_get_server_secret`) und Edge-Function-Secrets (z. B. web.de, Brevo).

- Communicator-Adapter lesen Zugangsdaten über den bestehenden Weg `kc_communication_get_server_secret` (Vault);
  Edge-Function-Secret bleibt während der Umstellung als Rückfall, danach geordnet entfernen.
- Reihenfolge je Secret: Analyse → Auswirkung → Recovery-Punkt → Autorisierung → Umstellen → Testmail/Testpush → Audit.
- Versandbremse (3/Min, 20/Std) und Rückfall auf Brevo bleiben unverändert.
- DoD: alle Communicator-Secrets im Vault, Übersicht (F-120) zeigt Ablageort „Supabase Vault“, Tests grün, Doku aktualisiert.

## Ergänzend (organisatorisch, kein Code)

Passwörter für Menschen (Logins für web.de-Postfach, Samsung-Konto, Supabase, GitHub …) gehören in einen kostenlosen,
gemeinsam genutzten Passwort-Manager des Vorstands (z. B. KeePassXC oder Bitwarden Free). Die Übersicht (F-120) verweist
nur darauf („Ablageort: Passwort-Manager Vorstand“).

## Entscheidung Tresor (18.11.2026, Freigabe Admin)

Externer Passwort-Manager ist dem Vorstand zu kompliziert. Darum: **kein Server-Tresor mit lesbaren Werten**, sondern ein
**Ende-zu-Ende-verschlüsselter Tresor als Teil von KICC-F-120** (Zero-Knowledge, Prinzip wie Bitwarden).
Technische Schlüssel der Programme bleiben im Supabase Vault (F-121), die Notfallkopie im Cloudflare-Notfall-Tresor.

### KICC-F-120 Teil B: Zugangs-Tresor für Logins von Menschen

- Ort: Club-App → Admin → Zugänge (nur Admin-Rolle), in der Übersicht aus Teil A.
- Nur für Einträge der Art „Login (Mensch)“, z. B. web.de-Postfach, Samsung-Konto, Supabase, GitHub. **Nie** für Programm-Schlüssel.
- Verschlüsselung ausschließlich im Browser mit WebCrypto (keine eigene Kryptografie):
  Schlüssel aus Tresor-Passwort per PBKDF2-SHA-256 (hohe Iterationszahl, zufälliges Salz je Tresor), Werte mit AES-256-GCM
  (zufälliger IV je Wert). Server/DB speichert nur Chiffrat, Salz, IV, Parameter-Version.
- Das Tresor-Passwort verlässt nie das Gerät, wird nicht gespeichert (kein localStorage, kein Server, kein Log).
  Prüfwert (verschlüsselter bekannter Text) erkennt ein falsches Passwort, ohne es preiszugeben.
- Anzeigen: Tippen auf „Anzeigen“ + Tresor-Passwort → Wert 30 s sichtbar bzw. kopierbar, danach aus Speicher und Anzeige entfernt.
- Audit je Öffnen/Ändern: wer, wann, welcher Eintrag – nie der Wert.
- Ausfallsicherheit: Chiffrat läuft in Neon-Spiegel und Sicherungen mit; Knopf „Notfallblatt drucken“ (lokal im Browser
  erzeugt, nichts an Server) für versiegelten Umschlag beim Vorstand.
- Verlust des Tresor-Passworts = Werte nicht wiederherstellbar (bewusst). Tresor-Passwort gehört auf Papier in den Umschlag.
- Tresor-Passwort ändern: alle Werte im Browser neu verschlüsseln, atomar speichern.

DoD Teil B: Kryptografie-Tests (Rundlauf, falsches Passwort, manipuliertes Chiffrat wird abgewiesen), Test „kein Klartext in
DB/Antworten/Logs/Browser-Speicher“, Rechte-Test (nur Admin), Audit-Test, Browser-Tests nur abgeschirmt (KC-TESTS-OHNE-ECHTSERVER),
Sicherheitsprüfung vor Freigabe, Zero-Cost-Check, Doku inkl. Notfallablauf.
