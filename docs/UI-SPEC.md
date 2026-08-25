# KICC UI Specification 1.0

## Operator goal
The normal dashboard answers: Is everything OK? What is affected? Do I need to act?

## UX rules
- Automation First.
- Select Before Type: searchable dropdowns, detected resources, templates, chips, toggles and multi-select before free text.
- One-click where safe; explicit approval where critical.
- Progressive disclosure: simple operator language first, expert technical detail on demand.
- No fake green state and no decorative fake traffic.
- Dense professional dashboard: compact KPIs, charts, gauges, tables and topology without unnecessary scrolling.
- Responsive on Windows PC, Android tablet and Android phone.

## Dashboard minimum
System health, active incidents, programs/devices/providers online, real traffic, latency/performance, sync/failover state, backup state, update state, free-tier/capacity indicators, recent automation outcomes and required approvals.

## Topology
Graphical overview of KC programs, clients/devices, IndexedDB/local stores, Supabase, Neon and future providers. Animated links are permitted only when driven by real observations; link direction and traffic rate must be visible.

## LED contract
GREEN connected/healthy. YELLOW degraded/attention or active data indication where explicitly designed. RED failed/offline. BLUE planned maintenance. GREY unknown/not yet tested.

## Tables
Search, filter, sort, column selection, compact mode, status chips, details drilldown and safe bulk actions where applicable.

## Assistant
Persistent KC Assistant entry point plus contextual suggested actions. Internal KC measurements and external web research must be visibly distinguished.