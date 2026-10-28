# Konzept: Club-Magazin „Club-Küche“ für die Club-App

Feature-ID: **wird bei Aufnahme in der Club-App vergeben** · Status: **KONZEPT** (nicht freigegeben, nicht veröffentlicht, nichts umgesetzt) · Stand: 2026-10-28

Betrifft: Club-App (`KC-Clubapp`). Dieses Dokument liegt im KICC-Repository nur als Ideenablage.

## 1. Idee
Ein Newsletter in der Club-App, aufgebaut wie eine Zeitschrift: Titelbild, Inhaltsverzeichnis, Rubriken. Über die Infozeile wird immer ein Thema angezeigt (z. B. „Neues Kuchenrezept“); ein Tipp öffnet den Artikel oder einen Link.

## 2. Bewertung
| Idee | Nutzen | Entscheidung |
|---|---|---|
| Rezepte, Backen, Küchentipps von Mitgliedern | hoch – passt zum Köcheclub, gibt es sonst nirgends, stärkt die Gemeinschaft | **aufnehmen** |
| Saisonkalender | hoch – einmal anlegen, kehrt jedes Jahr wieder | **aufnehmen** |
| Klickbare Infozeile mit Club-Bezug | hoch | **aufnehmen** |
| Garten, Heimwerken, Stricken/Häkeln | mittel – nur, wenn ein Mitglied dafür schreibt | **später, bei Bedarf** |
| Stündliche Tagesnachrichten als Schlagzeilen | gering – haben Mitglieder schon überall; überdeckt Club-Meldungen | **nicht vorgesehen**, höchstens abschaltbar und standardmäßig aus |
| Medizin | gering bis riskant – Haftung bei falschen oder veralteten Inhalten | **nur Links** auf seriöse Quellen (z. B. gesund.bund.de), keine eigenen Texte |
| Mode | gering, kein Club-Bezug | **nicht vorgesehen** |
| Wetter für Werne (1× täglich) | mittel – passt zu Kochen/Grillen, ohne Pflege | **optional** |

Grundsatz: **von Mitgliedern für Mitglieder.** Ein Magazin, das veraltet aussieht, schadet mehr als es nützt – deshalb lieber eine Ausgabe im Monat als tägliche Inhalte.

## 3. Aufbau
**Ausgabe** (monatlich, z. B. „Ausgabe November 2026“): Titelbild, Inhaltsverzeichnis, Artikel je Rubrik. Ältere Ausgaben bleiben im Archiv.

| Rubrik | Inhalt | Quelle |
|---|---|---|
| 🍲 Rezept des Monats | Rezept eines Mitglieds mit Foto | Einreichung |
| 🎂 Backstube | Kuchen, Plätzchen (vor Weihnachten besonders) | Einreichung |
| 🥕 Saisonkalender | Was gerade frisch ist | Redaktion, wiederkehrend |
| 👨‍🍳 Küchentipp | Kurzer Kniff | Einreichung oder Twinkey |
| 📸 Rückblick | Bilder vom letzten Treffen | Fotoalbum |
| 🙋 Mitglied im Porträt | Kurzes Interview | Redaktion |
| 🧶 Hobbyecke | Garten, Heimwerken, Handarbeit | Einreichung (nur wenn vorhanden) |
| 🔗 Linktipps | Ausgesuchte Links nach außen | Redaktion |

Artikelfelder (Auswahl statt Freitext, wo möglich): Rubrik, Titel, Bild, Text **oder** externer Link, Autor (Mitglied), bei Rezepten zusätzlich Zutaten, Schritte, Zeit (Auswahl), Schwierigkeit (Auswahl), Portionen.

## 4. Ablauf: Einreichen → Freigabe → Ausgabe
1. Mitglied reicht über ein Formular ein (Rezept + Foto, Rubrik per Auswahl).
2. Redaktionsrolle prüft, korrigiert, gibt frei oder lehnt mit Begründung ab.
3. Freigegebene Artikel landen im Vorrat und werden einer Ausgabe zugeordnet.
4. Ausgabe wird zu einem festen Datum veröffentlicht; die Infozeile kündigt die neuen Artikel an.
5. Lücken füllt der Vorrat an zeitlosen Inhalten (Saisonkalender, Grundrezepte).

## 5. Infozeile
- Wechselnde Einträge, jeder ist antippbar: öffnet Artikel in der App oder einen externen Link (externe Links deutlich als solche gekennzeichnet).
- Beispiele: „🎂 Neu im Magazin: Omas Apfelkuchen“, „📅 Nächstes Treffen: Donnerstag 18 Uhr“, „🥕 Jetzt Saison: Kürbis“, „🎄 Noch 5 Tage: Wunschdienst eintragen“.
- **Vorrang:** wichtige Club-Meldungen und Termine vor Magazin-Hinweisen, Magazin vor optionalen Zusätzen (Wetter).
- Abgelaufene Einträge (z. B. vergangener Termin) werden automatisch entfernt.

## 6. Regeln
- **Urheberrecht:** keine fremden Rezepte oder Texte kopieren; fremde Inhalte nur verlinken. Fotos nur mit Einverständnis der abgebildeten Personen.
- **Zero-Cost:** nur eigene Inhalte und Links; keine kostenpflichtigen Dienste oder Feeds.
- **Vorhandenes nutzen:** auf bestehende Club-App-Funktionen aufbauen (Neuigkeiten, Themen, Archiv, Fotoalbum, Vorlesen, Twinkey) statt ein paralleles System zu bauen. Vorlesen kann Rezepte vorlesen, Twinkey kann z. B. „Was koche ich mit Kürbis?“ beantworten.
- **Nur Mitgliederbereich:** Inhalte sind nur für angemeldete Mitglieder sichtbar.

## 7. Vorgeschlagener Start (Stufe 1)
Rezept des Monats, Backstube, Saisonkalender, klickbare Infozeile. Nach zwei bis drei Ausgaben über das Feedback abfragen, was gelesen wird; weitere Rubriken erst aufnehmen, wenn sich Mitglieder finden, die dafür schreiben.

## 8. Definition of Done (für die spätere Umsetzung)
- Einreichen, Freigeben und Veröffentlichen einer Ausgabe funktioniert Ende-zu-Ende.
- Infozeile zeigt Einträge nach Vorrang, Tipp öffnet Artikel bzw. Link.
- Einfache Ansicht und große Schrift werden unterstützt; Vorlesen funktioniert für Artikel.
- Tests für Ablauf und Infozeilen-Vorrang; Zero-Cost-Check bestanden.

## 9. Offene Fragen
- Wer übernimmt die Redaktionsrolle?
- Erscheinungstag der Ausgabe (z. B. jeweils am 1. des Monats)?
- Sollen Schlagzeilen/Wetter überhaupt angeboten werden?
