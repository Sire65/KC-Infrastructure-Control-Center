# KICC Zero-Cost Policy 1.0

KICC must be operable without mandatory paid subscriptions or transaction fees.

## Rules
- Prefer open standards, browser/PWA capabilities, GitHub free capabilities already available, and provider free tiers already in use.
- No mandatory app-store publication.
- No mandatory paid AI API.
- AI and web research are replaceable adapters and optional to core operation.
- Capacity dashboards track free-tier quotas where APIs permit reliable measurement.
- New dependencies must document license, hosting requirement, quota and zero-cost fallback before adoption.
- A feature that silently introduces recurring cost fails the release gate.

## Degradation
If a free external service is unavailable or quota-limited, KICC must degrade visibly and safely rather than purchase/activate paid capacity automatically.
## Bewusste Abweichung: Supabase Pro (24.11.2026)

- Entscheidung Admin (Hansi), 24.11.2026: Supabase-Organisation auf **Pro** umgestellt, weil der kostenlose Ausgang (5 GB) im
  Zeitraum 26.10.–26.11.2026 nicht reichte (4,64 GB am 22.11., siehe `EGRESS-SPARTAKT-2026-11.md`). Kein automatischer Kauf durch KICC.
- Kosten: Grundpreis Pro je Monat zzgl. Rechenzeit je Projekt (ein kleines Projekt ist im Guthaben enthalten; das zweite Projekt
  „Future Academy“ kostet extra, solange es in derselben Organisation läuft). Ausgabenbremse („Spend Cap“) muss eingeschaltet bleiben.
- Offen: Vorstandsbeschluss dokumentieren; Dauer festlegen (Notlösung oder dauerhaft); Sparmaßnahmen bleiben gültig, damit eine
  Rückkehr in den kostenlosen Tarif möglich bleibt.
