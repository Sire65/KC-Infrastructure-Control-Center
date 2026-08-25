# KICC Architecture Baseline

Status: Sprint 0 / DEV

## Architectural principles
- KICC is a control plane, never a mandatory part of productive KC data paths.
- Provider-independent adapters for Supabase, Neon, IndexedDB, GitHub, future databases/clouds and AI/web research.
- Existing KC cores are reused where compatible; no duplicate core implementations.
- Discovery is separate from registration and from mutation.
- Telemetry uses technical metadata by default, not business payloads.
- All risky operations require explicit authorization and auditable execution.
- Zero-cost operation is a release gate.

## Layers
1. UI / Leitwarte
2. KC Assistant
3. Application services
4. Registry / topology / lineage / telemetry / incidents
5. Provider adapters
6. External KC programs, clients, databases, repositories and clouds

## Core services
KCRegistryCore, KCTopologyCore, KCTelemetryCore, KCFlowCore, KCLineageCore, KCIncidentCore, KCGlobalSearchCore, KCUpdateCore, KCJournalCore, KCAssistantCore.

## Shared framework
WindowCore, Tablet/MobileCore, TableCore, DesignCore, LEDDisplayCore, AnimationCore, DataCore, SecurityCore and other approved KC cores are consumed through explicit compatibility contracts.

## Non-negotiable resilience rule
Failure of KICC, its UI, telemetry, assistant or cloud must not stop a KC cash register, DP2 or another productive KC application from continuing its own supported online/offline workflow.