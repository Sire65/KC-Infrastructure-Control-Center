# KICC Sprint 1 · DEV 0.1.0-dev.18

## Feature
Security-Register für die KC-Leitwarte.

## Ziel
Alle KC-Sicherheitsmaßnahmen und Datenfluss-Schutzmechanismen zentral sichtbar machen. Unverschlüsselte, nicht authentifizierte, unbekannte oder veraltete Security-Zustände müssen automatisch als Handlungsbedarf erkennbar sein.

## Enthalten
- Security-Maßnahmen-Übersicht
- Security-Topologie je Datenfluss
- getrennte Bewertung von Transportverschlüsselung und Payload-Verschlüsselung
- Authentifizierungsstatus
- Schlüsselquelle / Key-Handling
- letzter Verifikationsnachweis
- Vertrauensstatus der Security-Angabe
- automatische Gap-Analyse
- Security-Matrix Quelle → Ziel
- Status SECURE / WARNING / INSECURE / UNKNOWN

## Regeln
- UNKNOWN ist niemals SECURE.
- HTTP/NONE/UNENCRYPTED im Transport ist INSECURE.
- fehlende/anonyme Authentifizierung ist INSECURE.
- fehlender oder veralteter Nachweis erzeugt WARNING.
- nur OBSERVED_REMOTE oder VERIFIED_CONFIG dürfen als autoritative Grundlage dienen.
- Secrets werden niemals im Browser oder Repository gespeichert oder angezeigt.
- Private Infrastruktur bleibt vom KC-Security-Gesamtbild getrennt, kann später aber in einem eigenen Security-Scope bewertet werden.

## Initiale Flüsse
- IndexedDB → Supabase KC Core
- Supabase KC Core → Neon KC Core Mirror
- KICC → Supabase KC Core Telemetry
- KICC → Supabase Future Academy Telemetry
- KC-Programme → KC Communication
- KC Marktkasse → PC Manager / KC Core

Initiale UNKNOWN-Felder sind Absicht und markieren fehlenden Verifikationsnachweis. Es werden keine Verschlüsselungseigenschaften erfunden.

## Nächste Schritte
- Security-Telemetrie-Adapter für reale Handshakes/Transportparameter
- automatisches Inventar aller FLOW-Objekte
- Zertifikats-/TLS-Verifikation
- RLS-/Policy-Evidence aus DB-Adaptern
- Key-Rotation-/Ablaufüberwachung ohne Secret-Offenlegung
- Security-TÜV-Profil und Exportbericht

## Nicht durchgeführt
- keine Regionsmigration
- keine Failover-Umschaltung
- keine neuen B2-Buckets
- keine produktiven Credentials geändert
