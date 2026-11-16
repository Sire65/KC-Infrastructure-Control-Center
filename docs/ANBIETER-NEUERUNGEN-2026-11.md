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

## 6. Nachtrag 2026-11-16: Neuerungen seit 2026-11-10

### Handlungsbedarf
| Anbieter | Neuerung | Massnahme |
|---|---|---|
| Supabase | Seit 2026-11-13 gibt es zusaetzliche Anmeldewege fuer das Konto: Wiederherstellungscodes fuer die Zwei-Faktor-Anmeldung und ein Passwort neben der Anmeldung ueber GitHub ([Changelog](https://supabase.com/changelog)) | Fuer das Konto mit KC Core beide einrichten (Betreiber, Account Security). Faellt sonst der GitHub-Zugang aus, ist kein Zugriff auf die Datenbank mehr moeglich. Codes an einem sicheren Ort aufbewahren, nie im Repository (Regel 15) |
| Cloudflare | Workers mit `compatibility_date` ab 2026-11-17 melden abgebrochene Verbindungen ueber `request.signal` und laden Module ueber ein neues Verfahren ([Changelog](https://developers.cloudflare.com/changelog/)) | Betrifft den KC-Failover-Gateway nur, wenn das Datum dort hochgesetzt wird. Dann vorher „KC Dual Provider Regression“ laufen lassen. Gateway-Repo nicht geprueft |

### Gut zu wissen, kein Handlungsbedarf
| Anbieter | Neuerung | Bewertung fuer KC |
|---|---|---|
| Neon | Postgres 18.7 als Sicherheitsupdate mit 52 behobenen Schwachstellen ([Changelog 2026-11-13](https://neon.com/docs/changelog/2026-11-13)) | Wird beim naechsten Start des Compute eingespielt; durch Scale-to-Zero geschieht das regelmaessig. Version nicht abgefragt, weil die Abfrage Neon weckt (KICC-F-097) |
| Neon | MCP-Werkzeug `list_incidents` zeigt Stoerungen und Wartungen von Neon | Hilft zu unterscheiden, ob Neon gestoert ist oder ein eigener Fehler vorliegt |
| Supabase | „Correlated Logs“ seit 2026-11-10: Logs nach Anfrage, Trace oder Nutzer verknuepft; Log-Explorer in CLI v3 | Erleichtert Fehlersuche, z. B. beim `kc-db-backup-worker` |
| Supabase | Abschaltung alter TLS-1.2-Verschluesselungen | Keine neue Meldung seit der Ankuendigung. Direkte Postgres- und Pooler-Verbindungen sind nicht betroffen. KICC-F-109 bleibt offen |
| Cloudflare | Ausgabelimits und E-Mail-Warnungen fuer Workers und Durable Objects (2026-11-13) | Fuer welche Tarife, ist nicht angegeben. Im kostenlosen Tarif fallen ohnehin keine Kosten an |
| GitHub | `pull_request_target` ab 2026-12-02 standardmaessig gesperrt; ARM32-Runner entfallen ab 2026-12-08 ([Changelog](https://github.blog/changelog/2026-11-12-actions-for-arm32-linux-windows-retirement/)) | Dieses Repo nicht betroffen: beide Ablaeufe auf `ubuntu-latest`, Node 22, kein `pull_request_target`. KC-Clubapp und Gateway nicht geprueft |

### Nicht relevant
- Backblaze B2: im November nur Quartalszahlen, keine neuen Funktionen.
- Cloudflare Hyperdrive: hoehere Grenzen nur im bezahlten Tarif.
- GitHub Secret Scanning in Ablauf-Logs: nur Enterprise.

## 7. Kostenlose Datenbanken mit Speicherplatz (Stand 2026-11-16)

### Ausgangslage
| Datenbank | Belegt | Kostenlose Grenze | Auslastung |
|---|---|---|---|
| Supabase KC Core | 158 MB (gemessen 2026-11-10; davon 104 MB `public`, 25 MB Systemschemas) | 500 MB | ca. 32 % |
| Neon KC Core Mirror | ca. 376 MB (Stand 2026-10-20; davon 290 MB Backup-Saetze) | 1 GB je Projekt, 20 GB ueber alle Projekte | ca. 37 % |

Gemessen wurde nur die Groesse (`pg_database_size`), keine Inhalte (Regel 19). Der Engpass sind die **500 MB bei Supabase**, weil dort die Hauptdaten liegen. Bei Neon belegen vor allem die Backups den Speicher.

### Anbieter
| Anbieter | Kostenloser Speicher | Art | Haken | Eignung |
|---|---|---|---|---|
| **Azure SQL Database** (Free Tier) | **10 Datenbanken × 32 GB**, dazu je 32 GB Backup; 100.000 vCore-Sekunden je Datenbank und Monat, dauerhaft ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer), Stand 2026-11-11) | SQL Server (T-SQL), kein Postgres | Azure-Abo noetig (Kreditkarte). Beim Anlegen **„AutoPause“** waehlen, sonst wird ueber der Grenze abgerechnet; die Wahl „weiter mit Kosten“ ist nicht umkehrbar. Pausiert nach 15 min ohne Nutzung; bei aufgebrauchter Rechenzeit bis Monatsende nicht erreichbar. Kein SLA | Groesster kostenloser Speicher. Nur fuer Archiv oder Backup ueber eigenen Adapter, nie fuer laufende Kassen (Regel 12) |
| **Oracle Cloud Always Free** | 2 Datenbanken × 20 GB; zusaetzlich 200 GB Festplatte fuer eigene Server ([Oracle](https://docs.oracle.com/iaas/Content/FreeTier/resourceref.htm)) | Oracle-Datenbank; Postgres nur selbst betrieben | Kreditkarte zur Anmeldung. Eigenbetrieb bedeutet Updates und Sicherung in eigener Verantwortung | Reserve fuer Archiv |
| **TiDB Cloud Starter** | 25 GiB, verteilt auf bis zu 5 Datenbanken ([PingCAP](https://www.pingcap.com/tidb-cloud-pricing/)) | MySQL-kompatibel | Kein Postgres; ueber der Grenze 0,20 $ je GiB | Nur mit eigenem Adapter |
| **Azure Cosmos DB** (Free Tier) | 25 GB und 1.000 RU/s, dauerhaft ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/cosmos-db/free-tier)) | Dokumentdatenbank (NoSQL) | Ein Free-Konto je Abo; Kreditkarte | Kein SQL; nur fuer Sonderfaelle |
| **AWS DynamoDB** | 25 GB, dauerhaft (nur bei bereitgestellter Kapazitaet) | Schluessel-Wert (NoSQL) | Kreditkarte; ueber der Grenze kostenpflichtig | Kein SQL; nur fuer Sonderfaelle |
| **Neon** (im Einsatz) | 1 GB je Projekt, bis 100 Projekte, **20 GB gesamt** ([Plans](https://neon.com/docs/introduction/plans)) | Postgres | Ein Projekt allein hat nur 1 GB | Beste Erweiterung ohne Umbau |
| **Turso** | 5 GB, 100 Datenbanken | SQLite | Grenze 2026 von 9 GB gesenkt | Nur mit eigenem Adapter |
| **Cloudflare D1** | 5 GB gesamt, hoechstens 500 MB je Datenbank ([Cloudflare](https://developers.cloudflare.com/d1/platform/limits)) | SQLite | Kleine Einzeldatenbanken | Nur fuer Kleinkram am Gateway |
| **Aiven** | 1 GB ([Aiven](https://aiven.io/docs/products/postgresql/concepts/pg-free-tier)) | Postgres | hoechstens 20 Verbindungen; ungenutzte Dienste werden gestoppt | Kaum Gewinn |
| **Nile** | 1 GB | Postgres | Angaben nur aus Drittquellen | Kaum Gewinn |
| **AWS Aurora DSQL** | 1 GB | Postgres-aehnlich | Kreditkarte | Kaum Gewinn |
| **Supabase** (im Einsatz) | 500 MB Datenbank, 1 GB Dateien | Postgres | pausiert nach 1 Woche ohne Aktivitaet | – |
| **MongoDB Atlas M0** | 512 MB | Dokumente | keine Backups | ungeeignet |
| **Firestore** | 1 GiB | Dokumente | Tageslimits | ungeeignet |
| **Tiger Data** (Free) | nicht beziffert | Postgres | **nur US-Region**, Beta | ungeeignet (Mitgliederdaten) |
| **Render** | 1 GB | Postgres | laeuft nach 30 Tagen ab | ungeeignet |
| CockroachDB, Xata, PlanetScale | – | – | nach Berichten seit 2026 kein kostenloser Tarif mehr | – |

Es gibt keinen Postgres-Anbieter mit deutlich mehr als 1 GB kostenlos je Datenbank. Die grossen Angebote (Azure SQL, Oracle, TiDB) sind keine Postgres-Datenbanken; ein Umzug der Hauptdaten dorthin wuerde SQL-Funktionen, pg_cron und Edge Functions brechen und widerspricht Regel 3.

### Empfohlene Reihenfolge
1. **Backups aus den Datenbanken in Objektspeicher** (B2, KICC-F-099). Gibt den groessten Teil des Neon-Speichers frei.
2. **Neon auf mehrere Projekte verteilen:** abgeschlossene Zeitraeume in Archivprojekte (wie `KC Archiv Kopie`). Bleibt Postgres, kein Umbau.
3. **Supabase entlasten:** abgeschlossene Daten nach Neon auslagern, Dateien und Anhaenge in Storage statt in Tabellen.
4. **Reserve fuer grosses Archiv:** Azure SQL Free (320 GB) oder Oracle Always Free (40 GB), nur ueber eigenen Adapter (Regel 4/18), mit Kostenschutz (AutoPause) und erst nach Pruefung der EU-Region und des Zero-Cost-Gates.

Vor jedem neuen Anbieter: EU-Region pruefen (Mitgliederdaten), Lizenz und Kosten nach `docs/ZERO-COST.md` dokumentieren, Kostenschutz nachweisen.
