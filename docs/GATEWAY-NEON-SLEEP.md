# Neon schlafen lassen: Gateway-Health ohne Neon-Weckruf

Feature-ID: **KICC-F-097** · Stand 2026-10-08

## Befund
Neon (KC Core Mirror) soll nur in den Spiegel-/Backup-Fenstern laufen (6-h-Zyklus, `kc_neon_low_compute_cycle`). Laut Neon-Operationslog wurde der Compute aber zusaetzlich mehrfach am Tag gestartet (z. B. 2026-10-07 18:51, 19:02, 19:25, 22:06; 2026-10-08 08:04, 13:47, 14:41, 14:59).

Ursache: Der KC Failover Gateway (`Sire65/KC-Failover-Gateway`, `src/worker.js`) oeffnet bei **jeder** Health-Abfrage (`GET /`) eine Verbindung zu Neon (`SELECT 1` ueber Hyperdrive). KICC fragt diesen Endpunkt alle 30 s ab (`programs/failover-gateway-runtime.js`). Solange KICC irgendwo offen ist, kann Neon nicht einschlafen. Die Antwort zeigt das: Neon-Latenz ~1,9 s = Kaltstart.

## Loesung an der Quelle (Gateway, noch nicht ausgerollt)
Die Health-Abfrage prueft Neon nur noch, wenn
- Supabase nicht erreichbar ist (dann ist Neon fuer die Ausfallentscheidung noetig), oder
- ausdruecklich `?deep=1` angefragt wird.

Sonst meldet sie `fallback: { reachable: null, probed: false, reason: "NOT_PROBED_PRIMARY_HEALTHY" }` und `durablePosJournal: null` – ehrlich „nicht geprueft“, nicht OK (Regel 11).

Die Ausfallentscheidung `chooseBackend` bleibt identisch: Supabase gesund → SUPABASE; Supabase gestoert → Neon wird geprueft → NEON oder LOCAL_QUEUE. Kassenbuchungen (`/sync/*`) laufen unveraendert nach Neon. Das Kassen-SDK nutzt den Neon-Wert der Health-Abfrage nicht fuer Entscheidungen. Der Netlify-Gateway importiert dieselbe `worker.js`.

Lokal getestet (`npm run check` gruen) mit simuliertem Supabase:

| Situation | Neon-Verbindung | Backend |
|---|---|---|
| Supabase ok | keine | SUPABASE |
| Supabase ok, `?deep=1` | ja | SUPABASE |
| Supabase gestoert | ja | NEON / LOCAL_QUEUE |

Patch fuer `src/worker.js`: [`docs/patches/kc-failover-gateway-neon-sleep.patch`](patches/kc-failover-gateway-neon-sleep.patch) (im Gateway-Repo mit `git apply` anwenden). Geaendert wird nur der Health-Zweig am Ende von `fetch`:

```js
const p=await checkSupabase(env),deep=url.searchParams.get("deep")==="1",
  f=(deep||!p.reachable)?await checkNeon(env):{reachable:null,probed:false,reason:"NOT_PROBED_PRIMARY_HEALTHY"},
  activeBackend=chooseBackend(p.reachable,f.reachable===true);
// fallback: {..., probed: f.probed!==false}, durablePosJournal: f.probed===false ? null : f.reachable
```

Ausrollen: Commit auf `main` von `KC-Failover-Gateway` → Workflow „Deploy Cloudflare Worker“ deployt automatisch; „KC Dual Provider Regression“ prueft beide Anbieter.

## KICC-Seite (dev.96, in diesem Repo)
`programs/failover-gateway-runtime.js` zeigt einen ungeprueften Neon-Status als „nicht geprüft (schläft)“ statt „nicht erreichbar“. Mit dem alten Gateway aendert sich nichts.

## Nebenbefund Sicherheit (Gateway, nicht geaendert)
Die Gateway-Endpunkte `/sync/transactions` (GET, liefert Kassenbuchungen je `register_id`), `/sync/*` (POST) sowie `/supergau` und `/scenario/*` sind ohne Anmeldung aufrufbar (CORS `*`). Empfehlung nach dem Weihnachtsmarkt: Geraete-Token fuer `/sync/*`, Test-Szenarien nur mit Admin-Token.
