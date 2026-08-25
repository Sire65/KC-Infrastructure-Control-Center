# KICC Installation and Enrollment 1.0

## Targets
Windows PC, Android tablet and Android phone from one responsive application codebase where practical.

## PWA
KICC UI is installable as a PWA with standalone launch, application icon, controlled service-worker update lifecycle and local resilience appropriate to a control application.

## Windows Agent
Optional companion agent provides explicitly approved local capabilities unavailable to browser sandbox: local KC program discovery, health telemetry and supported local integration. Agent is separately versioned and must not become mandatory for unrelated KICC functions.

## Enrollment
Preferred flow: open official install page or scan provisioning QR -> detect platform -> install -> generate/persist device identity -> propose registration -> connectivity/health test -> show ready state.

## Usability
Detected values and searchable choices before manual entry. Technical IDs are generated/read automatically. Existing known device identity is reused safely after normal updates.

## Updates
Normal users receive FINAL channel. Test installations may opt into RC. Update UI shows installed and available version, release health gates and changes. Update activation must verify success and avoid mixed-cache versions.