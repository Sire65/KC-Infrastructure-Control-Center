# KICC Test Master 1.0

## Test profiles
QUICK: smoke tests for startup, navigation, registry and core health.
STANDARD: functional regression of completed scope.
DEEP: architecture, security, data integrity, performance and recovery checks.
SUPER-GAU: controlled failure and recovery scenarios.
RELEASE: mandatory complete release acceptance.

## Permanent regression principles
Every completed feature receives a stable test ID. New work may not silently remove or disable an existing test. A previously passing mandatory test becoming FAIL blocks promotion.

## Sprint 0 gates
1. Architecture/provider extensibility
2. Framework/core reuse and compatibility
3. Security and authorization boundaries
4. Zero-cost operation
5. Operator UX/automation/select-before-type
6. Version/release/update governance
7. KICC independence from productive data paths
8. Observed status separated from configured status

## UI acceptance
LED semantic test, responsive PC/tablet/phone layouts, no overlap/clipping, dashboard density, keyboard/touch usability, safe destructive-action confirmation and no fake traffic/health state.

## Data acceptance
Registry identity, repository role mapping, app/schema/core version separation, flow direction, telemetry timestamps, incident deduplication/correlation, lineage and retention rules.

## Release result
PASS, PASS WITH DOCUMENTED WARNING, or FAIL. FINAL requires all mandatory gates PASS.