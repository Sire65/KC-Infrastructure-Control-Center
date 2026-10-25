# Dienstplan-Entwurf Weihnachtsmarkt 2026

Vorschlag für den Dienstplan aus Bedarf und Wunschplänen. Erstellt am 23.10.2026 für Hansi. Es ist **nur ein Vorschlag**: Nichts davon ist in DP2 oder Supabase eingetragen.

- **Ansicht (Stand 23.10.2026):** https://claude.ai/artifact/QXmz98EE1vs1QeeXkLCbBs
- **Bedarf:** `demand.txt`, Stand Supabase V13 vom 23.10.2026 mit 543 Personalstunden. Die Zahlen sind gegen das Benutzer-PDF geprüft.
- **Wünsche:** `wishes.txt` liegt nicht im Repo, weil sie personenbezogen sind. Sie werden jedes Mal frisch mit `wuensche-abfrage.sql` aus `kc_dp_wish_inbox` geholt.

## Neu rechnen

1. Die Abfrage `wuensche-abfrage.sql` in Supabase ausführen und das Ergebnis als `wishes.txt` speichern.
2. Falls sich der Bedarf geändert hat, `demand.txt` anpassen. Quelle ist die Tabelle `kc_dp_days_published` (Spalte `demand`).
3. `python3 solve.py 8 1.5` ausführen, das erzeugt `plan.json`.
4. Danach `python3 render.py` ausführen, das erzeugt `dienstplan-entwurf.html`. Diese Datei unter demselben Artifact-Link neu veröffentlichen.

## Regeln
- Jede Person hat höchstens einen zusammenhängenden Dienst pro Tag, höchstens 8 Stunden (erster Parameter).
- Wunschzeit geht vor „kann“, „nur wenn nötig“ kommt zuletzt. Gesperrte Zeiten werden nie verplant.
- Vorne und hinten werden an den Markttagen beachtet; „B“ heißt flexibel.
- Die Stunden werden über die Veranstaltung ausgeglichen verteilt (zweiter Parameter).
- Noch nicht berücksichtigt sind Pausen, Verantwortliche je Schicht und Bereitschaften.

## Stand 23.10.2026
- 10 von 18 Mitgliedern hatten Wünsche abgegeben.
- Eingeplant waren 433,5 von 543 h, offen 109,5 h. Davon waren 84 h mit den vorhandenen Wünschen gar nicht zu besetzen.
- Die größte Lücke war der 12.12. (−21 h), dazu fehlte an fast allen Markttagen der Spätdienst bis 23 Uhr.

## Stand 25.10.2026
- Neu: Karla und Ruth haben den 5.12. ganz gesperrt (11–23 Uhr). Vorher wollten sie 18–23 Uhr.
- Eingeplant sind jetzt 427 von 543 h, offen 120,5 h (vorher 109,5 h).
- Der 5.12. fehlt jetzt 14 h, vor allem der Spätdienst. Größte Lücke bleibt der 12.12. (−21 h).
- Hansi eingeplant nach seinem Vorschlag (Aufbau 2./3.12. morgens, 4.12. 10–16 Uhr – die Sperre dort war nur ein Test –, Markttage meist 11–15/16 Uhr, Abende nur Sa 5.12. und Sa 12.12., Abbau 14.12. 9–13 Uhr): 47 h.
- Damit eingeplant 453 von 543 h, offen 95,5 h. Größte Lücken: 12.12. (−16 h), 6.12. (−12,5 h), 13.12. (−11 h).

