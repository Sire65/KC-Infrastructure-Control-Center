# KC Product Registry Baseline 1.0

This document is the initial inventory contract. Discovery does not authorize mutation.

## Known GitHub candidates
- KC DP2: repository `dp3`, confirmed product identity; current observed documentation states V0.20.0 Build 88. Treat as CURRENT candidate and do not modify during KICC Sprint 0.
- `Dienstplan`: legacy/relationship to DP2 requires comparison; do not delete or merge automatically.
- `Kasse`: KC Marktkasse candidate.
- `KC-Bilderrechner`: KC Bilderrechner candidate.
- `KC-Futura-Academy`: KC Futura candidate.
- `KC-Communication`: private MASTER candidate.
- `KC-Communication-Public`: public DEPLOYMENT candidate paired with KC Communication.
- `KC-Failover-Gateway`: INFRASTRUCTURE candidate.
- `KC-Werbewebsite`: KC website candidate.
- `KC-Kuechen-Detektiv`: KC game/module candidate.
- `WM-Pr-sentation` and `WM-Pr-s.`: relationship/current status unresolved; no automatic cleanup.
- `K-chenleiter`: KC Küchenleiter candidate.

## Required fields per registered product
Stable product ID; display name; lifecycle status; repositories and roles; current version/build/channel; schema version; core versions; installations; devices; providers/data stores; declared data flows; update mechanism; last test/security/TÜV status.

## Local programs
Windows Agent discovery may propose local KC applications with no repository. Operator chooses from detected repositories, requests preparation of a new repository, or marks as non-KC. Free-text technical identifiers should be avoided.