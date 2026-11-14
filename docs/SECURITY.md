# KICC Security Baseline 1.0

## Principles
Least privilege, explicit trust boundaries, no secrets in repository, auditable changes, separation of monitoring from administration, safe defaults and fail-closed authorization.

## Action risk classes
GREEN: read/search/analyse/test/report.
YELLOW: reversible operational/configuration action requiring confirmation where appropriate.
RED: destructive or high-impact action such as delete, restore, failover, schema/provider/security change; explicit approval and audit record required.

## Credentials
Secrets are referenced through environment/secret stores and never committed. UI must never expose full credentials. Provider adapters receive only required scope.

## Assistant boundary
AI never receives unrestricted SQL/admin access. It can request only allow-listed KICC tools. KICC authorization decides whether a tool call is permitted and whether approval is required.

## Telemetry privacy
Prefer counts, timings, identifiers/hashes and health metadata. Business payload inspection is exceptional, permission-controlled and journaled.

## Audit
Security-sensitive configuration, approvals, releases, restore/failover, user/role changes and destructive actions generate immutable audit events according to retention policy.
## Lieferkette & CI (KICC-CI-HAERTUNG, 14.11.2026)
Anlass: Lieferketten-Angriff „wfx“ (Aikido/SafeDep, Nov. 2026) über gekaperte GitHub-Konten, eingeschleuste Workflows und `npm install`.
Prüfung am 14.11.2026: keine Indikatoren (Branch `wfx-docs`, `chore/<8 Zeichen>`, Commits „ci: refresh build cache“, „chore: add ci helper“, „chore: add dependency audit workflow“) in den seit 10.11. beschriebenen öffentlichen Repos.

Regeln für alle Workflows:
- Fremde Bausteine (`uses:`) nur auf geprüfte Commit-SHA festgeschrieben, Tag als Kommentar (KC-ACTIONS-FEST). SHA vor Übernahme per `git ls-remote --tags` gegen das offizielle Repo prüfen.
- `npm install`/`npm ci` in CI immer mit `--ignore-scripts` (keine Paket-Skripte bei Installation).
- `actions/checkout` mit `persist-credentials: false`, wenn der Job nicht pushen muss.
- `permissions:` immer explizit und minimal (Standard `contents: read`).

Definition of Done: `deep-regression.yml` erfüllt alle vier Regeln; ESLint grün; 52 Chromium-Tests grün mit `--ignore-scripts`-Installation.

Nur vom Kontoinhaber einstellbar (GitHub-Oberfläche, kostenlos): Zwei-Faktor mit Passkey/App, Tokens/OAuth-Apps/SSH-Schlüssel regelmäßig prüfen, Ruleset für `main` (kein Force-Push, kein Löschen), Actions-Standardrechte „read-only“ und „Actions dürfen keine Pull-Requests erstellen/genehmigen“.
