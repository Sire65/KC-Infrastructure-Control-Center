# KICC 0.1.0-dev.100 – Weniger Datenbank-Anfragen

Feature-ID: **KICC-F-101** · 2026-10-20 (Freigabe Hansi „Leitstand übernehmen“)

## Anlass
Datenbank-Stau am 14.10.2026 (Supabase). Der Leitstand fragte auch in einem verdeckten oder minimierten Fenster laufend ab. Die Änderung lag seitdem als dev.98 auf dem Zweig `ccr-6fc41537-1rki0f` und ist jetzt auf den aktuellen Stand übernommen.

## Änderung
- Programmfluss, Lebenszeichen, Telemetrie, Spiegel, Backup, Speicher, Discovery und Anmelde-Prüfung fragen nur noch ab, solange das Fenster sichtbar ist (`if(!document.hidden)`).
- Programmfluss alle 30 s statt 15 s, Anmelde-Prüfung alle 60 s statt 30 s. Die übrigen Takte bleiben gleich.
- Die Anzeige (`render`) läuft weiter, sie fragt nichts ab.
- Version auf 0.1.0-dev.100 (VERSION, `runtime/build-version.js`, `index.html`, Service-Worker-Cache).
