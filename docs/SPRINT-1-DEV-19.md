# KICC 0.1.0-dev.19 – Automated Security Verification

## Ziel
Security-Register nicht nur konfigurativ, sondern soweit sicher möglich automatisch verifizieren.

## Automatisch prüfbar
- HTTPS/TLS-Erreichbarkeit der bekannten KICC-Telemetrie-Endpunkte.
- Unauthentifizierter Kontrollaufruf: 401/403 bestätigt, dass Authentifizierung erzwungen wird.
- Separater autorisierter Aufruf, wenn ein kurzlebiger Benutzer-Token verfügbar ist.
- RLS/Policy-Nachweise aus autoritativer Datenbank-Telemetrie.
- Frische und Vertrauensquelle der Security-Nachweise.

## Nicht im Browser vortäuschen
Der Browser kann den erfolgreichen TLS-Pfad bestätigen, aber nicht zuverlässig Zertifikats-Issuer, Ablaufdatum, Fingerprint, konkrete TLS-Protokollversion oder Cipher Suite auslesen. Diese Nachweise bleiben offen, bis ein Windows-Agent oder serverseitiger Security-Adapter sie liefert.

## Statusregeln
- SECURE: Schutz wurde aktuell und autoritativ bestätigt.
- WARNING: Schutz ist erwartet/teilweise bestätigt, Nachweis fehlt oder ist unvollständig.
- INSECURE: unverschlüsselter Transport, fehlende/anonymous Authentifizierung oder explizit unsicherer Policy-Zustand wurde beobachtet.
- UNKNOWN darf nie als SECURE behandelt werden.

## Auth-Regressionsschutz
Ein HTTP 200 allein ist kein Auth-Nachweis. KICC prüft explizit ohne Token auf 401/403 und getrennt mit Token auf erfolgreichen Zugriff.

## Scope
Private PC-Backup-/B2-Ressourcen bleiben vom KC-Security-Gesamtbild getrennt, solange sie Domain PRIVATE tragen.

## Unverändert
Keine Regionsmigration, kein Cutover, keine Provider-Rollenänderung und keine Datenkopie werden durch dev.19 ausgelöst.
