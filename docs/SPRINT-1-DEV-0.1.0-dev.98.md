# KICC 0.1.0-dev.98 – Lichtschein im Kopfbereich

Feature-ID: **KICC-F-100** · 2026-10-14

## UI
- `styles.css`: Beim Start laeuft einmalig ein heller Lichtschein von links nach rechts ueber die Kopfleiste (`.topbar`), begleitet von einem Glanzpunkt auf der Unterkante. Dauer 1,8 s, Start nach 0,25 s, danach unsichtbar.
- Reines CSS (`::after`-Pseudoelement, `@keyframes kicc-topbar-shine`), keine neue Abhaengigkeit (Zero-Cost), kein JavaScript, CSP unveraendert.
- Rein dekorativ: kein Status- oder Traffic-Signal (Regel 5), `pointer-events:none`, Bedienung unbeeintraechtigt.
- Bei `prefers-reduced-motion: reduce` entfaellt der Effekt vollstaendig.

## Definition of Done
- Animation laeuft genau einmal je Seitenstart, nicht in Schleife.
- Reduzierte Bewegung schaltet den Effekt ab.
- Version auf 0.1.0-dev.98 (VERSION, `runtime/build-version.js`, `index.html`, Service-Worker-Cache).

## Tests
- Playwright `KICC-F-100 · Kopfbereich-Lichtschein`: Animation aktiv, einmalig, klick-durchlaessig; bei reduzierter Bewegung abgeschaltet.
