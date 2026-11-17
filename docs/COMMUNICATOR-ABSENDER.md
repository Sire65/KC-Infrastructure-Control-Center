# KC Communicator – E-Mail-Absender

Feature: KC-COMM-WEBDE (Absenderwechsel 2026-11-17)

## Aktueller Stand

- Primaerer E-Mail-Weg: Provider `email-webde` (Route `primary`, Prioritaet 5), SMTP `smtp.web.de:465` (SSL).
- Absender-Postfach: Club-Postfach `koecheclub-werne@web.de`, Anzeigename „Köcheclub Werne“.
- Rueckfall: `email-brevo` (Route `fallback`). Schlaegt web.de fehl, uebernimmt Brevo automatisch.
- Versandbremse web.de unveraendert: 3 Mails/Minute, 20 Mails/Stunde.

## Wo die Werte liegen

Nur als Supabase-Edge-Function-Secrets (Projekt `ptblnpiroqftcvlsrhac`), nie im Repository oder im Browsercode:

| Secret | Inhalt |
|---|---|
| `KC_COMMUNICATION_WEBDE_USER` | Absenderadresse (Login des web.de-Postfachs) |
| `KC_COMMUNICATION_WEBDE_PASSWORD` | Passwort bzw. anwendungsspezifisches Passwort des Postfachs |
| `KC_COMMUNICATION_WEBDE_FROM_NAME` | Angezeigter Absendername |

Voraussetzung im web.de-Postfach: *Einstellungen → POP3/IMAP Abruf → „POP3 und IMAP Zugriff erlauben“*.

## Aenderungsprotokoll

| Datum | Aenderung | Recovery |
|---|---|---|
| 2026-11-17 | Absender von Hansis privatem web.de-Postfach auf das Club-Postfach umgestellt; Provider-Anzeigename `web.de (Hansis Postfach)` → `web.de (Köcheclub Werne)`. Freigabe durch Admin. | Vorheriger Provider-Datensatz gesichert (Anzeigename in `public_config.vorherAnzeige`). Ruecknahme: die drei Secrets wieder auf Hansis Postfach setzen und Anzeigenamen zuruecksetzen. Waehrenddessen laeuft der Versand ueber Brevo. |

## Absenderwechsel – Ablauf

1. Im neuen web.de-Postfach POP3/IMAP-Zugriff erlauben.
2. Die drei Secrets setzen (Adresse, Passwort, Name). Solange Adresse und Passwort nicht zusammenpassen, versendet Brevo.
3. Anzeigenamen in `kc_communication_providers` (`id = 'email-webde'`) anpassen.
4. Testmail ueber `kc_communication_scheduled_jobs` (Modus `email`, ein Empfaenger) und pruefen, dass `provider_id = 'webde'` gemeldet wird, nicht `brevo`.
