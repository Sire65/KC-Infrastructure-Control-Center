# KICC 0.1.0-dev.99 – Lichtschein laeuft flüssig durch

Feature-ID: **KICC-F-100** (Korrektur) · 2026-10-14

## Fehler
In dev.98 blieb der Lichtschein im Kopfbereich beim Start lange in der Mitte stehen. Ursache: Die Bewegung lief ueber `background-position`. Diese Eigenschaft berechnet der Browser im Hauptthread, und der ist beim Start mit dem Laden und Ausfuehren von rund 40 Modulen ausgelastet. Die Animation bekam dadurch keine neuen Bilder.

## Korrektur
- `styles.css`: Der Lichtstreifen ist jetzt ein eigenes Pseudoelement (40 % Breite), das per `transform: translateX()` von links nach rechts geschoben und per `opacity` ein- und ausgeblendet wird. Beide Eigenschaften zeichnet der Browser im Compositor, also unabhaengig vom ausgelasteten Hauptthread.
- `.topbar` schneidet den Streifen ab (`overflow:hidden`); der Kopfbereich enthaelt nur Text, nichts ragt heraus.
- Dauer 1,6 s, Start nach 0,25 s, einmalig. Glanzpunkt auf der Unterkante bleibt. Reduzierte Bewegung schaltet den Effekt weiter ab.
- Version auf 0.1.0-dev.99 (VERSION, `runtime/build-version.js`, `index.html`, Service-Worker-Cache).

## Tests
- ESLint ohne Befund, Playwright (Chromium) 52/52 inkl. der beiden KICC-F-100-Tests.
- Sichtpruefung per Screenshots bei 0,6 / 0,9 / 1,2 / 1,5 s: Streifen wandert gleichmaessig.
