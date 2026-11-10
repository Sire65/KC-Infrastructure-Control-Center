# Anbieter-Neuerungen: Stand 2026-11-10

Durchsicht der Neuerungen bei Supabase, Neon, Backblaze B2, Cloudflare und GitHub, bewertet fuer KICC und die KC-Datenwege. Nur Recherche; am produktiven Betrieb ist nichts geaendert.

Bewertungsmassstab: Zero-Cost (Regel 6), Adapter statt hart codiert (Regel 4/18), kein Single Point of Failure (Regel 12).

## 1. Handlungsbedarf (kann bestehende Ablaeufe stoeren)

### KICC-F-108: Supabase CLI v3 beim Deploy absichern
Status: **GEPLANT** · Quelle: [Supabase CLI v3](https://supabase.com/changelog/supabase-cli-v3)

Seit 2026-11-02 installieren npm, Scoop, Linux-Pakete und `supabase/setup-cli` standardmaessig v3 (Homebrew seit 2026-11-03).

| Aenderung | Folge fuer KC |
|---|---|
| `db push`, `db pull`, `db dump`, `migration list`, `gen types`, `storage` arbeiten ohne `--remote` gegen die **lokale** Datenbank | Eine Migration kann „erfolgreich“ sein, ohne das Supabase-Projekt KC Core zu erreichen |
| `functions deploy`, `secrets set`, `config push`, `db push` auf dem gehosteten Projekt verlangen Bestaetigung; ohne Terminal Abbruch mit `HostedMutationConsentRequiredError` | Deploy von Hand (z. B. `kc-db-backup-worker` aus KC-Clubapp) fragt jetzt nach; in Ablaeufen ist `--yes` noetig |
| `secrets unset` braucht `--all`, um alle Secrets zu entfernen | weniger Risiko, aber andere Bedienung |
| Abschnitt `[inbucket]` in `config.toml` entfernt (jetzt `[local_smtp]`) | lokaler Start bricht ab, falls der Abschnitt vorhanden ist |
| Diff-Engine pg-delta ist Standard | `db diff` kann anderes SQL liefern; Migrationen vor dem Anwenden lesen |

Massnahme:
1. Deploy-Anleitungen in KC-Clubapp und KC-Failover-Gateway auf `--remote` und ausdrueckliches `--yes` umstellen **oder** v2 festhalten (`npm install supabase@v2.stable --save-dev`, in Ablaeufen `version: v2.stable`).
2. Nach jeder Migration `supabase migration list --remote` pruefen.

Definition of Done: Deploy-Anleitungen angepasst; ein Test-Deploy einer Edge Function mit v3 nachweislich auf dem gehosteten Projekt; Migrationsliste lokal und remote verglichen.

Dieses Repo ist nicht betroffen: Die Ablaeufe `deep-regression.yml` und `zweige-aufraeumen.yml` nutzen die Supabase CLI nicht.

### KICC-F-109: TLS-Verbindung der Geraete zu Supabase pruefen
Status: **GEPLANT** · Quelle: [Supabase Changelog](https://supabase.com/changelog)

Supabase entfernt **fruehestens ab 2026-11-10** veraltete TLS-1.2-Verschluesselungen auf den HTTP-Schnittstellen der Projekte.

Massnahme: Fuer jedes Geraet und jedes Programm, das Supabase **direkt** anspricht (nicht ueber den Failover-Gateway), einen Verbindungstest machen. Aeltere Kassen, Tablets und eingebettete Geraete zuerst.

Definition of Done: Liste der direkt verbundenen Clients mit Ergebnis „Verbindung ok“ oder „Update noetig“; kein Client zeigt nach der Umstellung UNKNOWN als OK an (Regel 11).

### GitHub: `pull_request_target` ab 2026-12-02 standardmaessig gesperrt
Quelle: GitHub Changelog vom 2026-11-02.

In diesem Repo nicht verwendet. KC-Clubapp und KC-Failover-Gateway sind noch nicht geprueft; ein Ablauf mit diesem Ausloeser liefe dort ab dem Stichtag nicht mehr.

## 2. Nuetzlich und ohne Kosten

### KICC-F-110: Sperrdatei fuer GitHub-Ablaeufe
Status: **GEPLANT** · Quellen: [Public Preview](https://github.blog/changelog/2026-10-14-github-actions-workflow-lockfiles-in-public-preview/), [GA laut InfoQ](https://www.infoq.com/news/2026/11/github-actions-lockfiles-ga/)

Sperrdateien fuer Ablaeufe sind seit 2026-10-28 allgemein verfuegbar, auch im kostenlosen Tarif. Erzeugt und gepflegt werden sie mit der CLI-Erweiterung `gh actions-lock`.

Nutzen: `deep-regression.yml` verwendet fremde Bausteine (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`). Mit einer Sperrdatei sind deren genaue Versionen fest; ein ausgetauschter Tag wird erkannt. `zweige-aufraeumen.yml` nutzt bewusst keinen fremden Baustein und braucht keine Sperrdatei.

Definition of Done: Sperrdatei fuer `deep-regression.yml` im Repo; Ablauf laeuft damit gruen; Aktualisierung der Sperrdatei in `docs/SECURITY.md` beschrieben.

### Weitere Neuerungen ohne eigene Feature-ID

| Anbieter | Neuerung | Bewertung fuer KC |
|---|---|---|
| Neon | Geloeschte Projekte lassen sich **7 Tage lang** auch in der Konsole wiederherstellen ([Changelog 2026-11-06](https://neon.com/docs/changelog/2026-11-06)) | Hilft bei Fehlbedienung. Ersetzt die Kopie ausser Haus nicht: Kontosperre oder Anbieterausfall trifft Spiegel und Backups weiter gemeinsam. KICC-F-099 (B2) bleibt noetig |
| Neon | `neon inspect db` fuer Diagnosen, die nur lesen ([Changelog 2026-07-24](https://neon.com/docs/changelog/2026-07-24)) | Passt zu KICC-F-097 (Neon schlafen lassen); ein Aufruf weckt aber den Compute |
| Neon | Neuer Befehl `neon postgres` (Kurzform `pg`) zum Verwalten der Computes | Bequemer fuer Wartung; kein Bedarf fuer KICC selbst |
| Neon | Alter MCP-Endpunkt `/sse` liefert 410; neu ist `https://mcp.neon.tech/mcp` | Nur relevant, falls ein Werkzeug noch den alten Endpunkt nutzt |
| B2 | Neue Buckets seit 2026-09-14 immer serverseitig verschluesselt (SSE-B2, AES-256), ohne Aufpreis, nicht abschaltbar ([Backblaze](https://www.backblaze.com/blog/backblaze-b2-to-encrypt-new-uploads-by-default/)) | Zusaetzliche Schicht unter der eigenen AES-256-GCM-Verschluesselung von KICC-F-099. Zusammenspiel mit Object Lock ist nicht beschrieben, siehe Testfall im B2-Plan |
| Cloudflare | Hoehere Workers-Grenzen fuer alle Kunden: Unteranfragen 1.000 → 1 Mio., Startzeit 400 ms → 1 s, Groesse bis 64 MiB ([Cloudflare](https://blog.cloudflare.com/enterprise-for-all-update)) | Mehr Spielraum fuer den KC-Failover-Gateway; kein Umbau noetig |
| Cloudflare | Queues im kostenlosen Tarif: 10.000 Vorgaenge pro Tag, 24 h Aufbewahrung ([Changelog](https://developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan/)) | Moeglicher Puffer fuer Telemetrie oder Sync im Gateway, nur als austauschbarer Adapter (Regel 18). Keine KC-Buchung darf allein von der Queue abhaengen (Regel 12) |
| Cloudflare | Budget-Warnungen fuer Nicht-Enterprise-Konten standardmaessig an | Unterstuetzt das Zero-Cost-Gate; im Konto pruefen, ob sie aktiv sind |
| GitHub | Aufbewahrungsfrist gilt seit 2026-10-01 auch fuer Pruefungen, Ablauflaeufe und Statusmeldungen ([Changelog](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses/)) | Alte Testnachweise koennen verschwinden. Nachweise fuer den Release-TUEV gehoeren in die Doku, nicht nur in Ablauflaeufe |
| GitHub | Gehostete Runner laufen jetzt in mehreren Clouds ([Changelog](https://github.blog/changelog/2026-10-28-github-actions-adds-multi-cloud-compute-to-improve-reliability/)) | Nur relevant, wenn ein Dienst Runner-IP-Adressen freischaltet; neue Bereiche stehen in `https://api.github.com/meta` |

## 3. Nicht uebernehmen (Zero-Cost-Gate)

| Anbieter | Neuerung | Grund |
|---|---|---|
| Neon | AI Gateway im kostenlosen Tarif | nur mit vorab gekauftem Guthaben (ab 5 $) |
| Cloudflare | Logpush fuer Free/Pro/Business | wird nach Nutzung bezahlt |
| Cloudflare | Dynamic Workers | nur fuer bezahlte Workers-Konten |
| Supabase | .NET-SDK, Go-SDK (Alpha), Speicher fuer Vektoren und Analysen (Alpha) | kostenlos, aber derzeit kein Bedarf; Alpha nicht fuer produktive KC-Datenwege |

## 4. Korrektur Neon-Speichergrenze
Laut Neon-Preisseite ([Plans](https://neon.com/docs/introduction/plans), Stand 2026-11-04) gilt im Free-Plan:

| Grenze | Wert |
|---|---|
| Speicher | **1 GB je Projekt** (alle Branches zusammen), hoechstens 20 GB ueber alle Projekte |
| Branches | 10 je Projekt |
| Compute | 100 CU-Stunden je Projekt und Monat |
| Egress | 5 GB je Projekt und Monat |
| Snapshots | 1 manueller Snapshot, keine geplanten Backups |
| Wiederherstellung zu einem Zeitpunkt | bis 6 Stunden, hoechstens 1 GB Aenderungsverlauf |

`docs/NEON-TELEMETRY-BRIDGE.md` sprach bisher von 1 GiB **je Branch**. Fuer den KC Core Mirror zaehlen damit auch temporaere Branches (z. B. Restore-Abnahme in KICC-F-099, Phase 7) zur selben Grenze. Bei ca. 376 MB (Stand 2026-10-20) ist das unkritisch, ein Restore-Branch sollte aber nach der Pruefung sofort geloescht werden.

## 5. Naechste Pruefung
Naechste Durchsicht der Anbieter-Neuerungen spaetestens vor dem naechsten RC. Pruefpunkte: Supabase-Changelog, Neon-Changelog und Plans-Seite, Backblaze-Blog, Cloudflare-Changelog, GitHub-Changelog (Label `actions`).
