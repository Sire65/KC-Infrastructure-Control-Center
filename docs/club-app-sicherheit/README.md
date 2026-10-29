# Club-App: Sicherheit & Datenschutz – Mitglieder-Info

Einfache Erklärung für die Mitglieder (10 Seiten A4): wer welche Daten sieht, Handy, Zugang, Datenbank, Spiegelung,
Sicherung, regelmäßige Prüfung durch KI, DSGVO und ehrliche Grenzen – mit Schaubild der Datenwege und Diagrammen.

- `Club-App-Sicherheit-und-Datenschutz.pdf` – fertiges Dokument
- `bauen.py` – erzeugt `club-app-sicherheit.html` (alle Zahlen stehen im Skript, Quellen siehe unten)
- `drucken.cjs` – HTML → PDF mit dem vorinstallierten Chromium (Playwright)

Neu bauen: `python3 bauen.py && node drucken.cjs`

Quellen (Stand 29.10.2026): KC-Clubapp `README.md`, `AGENTS.md`, `docs/NOTFALL_DATEN_ZURUECKHOLEN.md`, `docs/NOTBETRIEB.md`,
`docs/SICHERHEIT_DB_FUNKTIONEN.md`, `docs/CODEX_AUFTRAG_SICHERHEIT_2026-10-13.md`, `supabase/functions/kc-club/*`, Privatsphäre-Video
(`teile/videos.js`); KICC `docs/PLAN-KC-DB-BACKUP-B2.md`, `docs/NEON-TELEMETRY-BRIDGE.md`, `docs/ACCESS-WATCH.md`.
Ersetzt nicht die Datenschutzerklärung des Vereins.

In der Club-App: Technik → 🔐 Sicherheit & Datenschutz (`dokumente/Sicherheit_und_Datenschutz_V1.pdf`, ab 2.754.0). Dazu der Erklärfilm in `sicherheitsfilm/`.
Bewusst nicht beschrieben: Admin-Werkzeuge und die Wege der Mitglieder in der App.
