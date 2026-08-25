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