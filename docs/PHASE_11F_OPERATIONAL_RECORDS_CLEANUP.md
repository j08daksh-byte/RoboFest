# PHASE 11F: OPERATIONAL RECORDS CLEANUP

## 1. Deleted Routes
As recommended by the Phase 11E Deprecation Audit, the following UI scaffolds were physically deleted from the codebase as they duplicated Senior platform functionality and were structurally unnecessary for our Command Center:
- `src/app/ship` (entire directory deleted, including map, shipyard, internal-structure)
- `src/app/records/knowledge-base` (deleted)
- `src/app/records/maintenance` (deleted)

## 2. Removed Navigation
`src/components/Shell/Sidebar.tsx` was modified to completely remove the "Ship" group and drop the redundant links from the "Records" group. The Sidebar now cleanly reflects only our Command Center's genuine operational surfaces.

## 3. Remaining Records Routes
The following routes were successfully retained and adapted:
- `src/app/records`: Simplified to explicitly act as the "Operational Records" hub.
- `src/app/records/history`: Retained and completely overhauled to display authoritative operational safety logs.

## 4. Event History Data Source
`src/app/records/history/page.tsx` was adapted to directly subscribe to `usePlatformStore().events`. This leverages the existing Zustand state (`SystemEvent[]`) established during Phase 4C which collects deterministically generated events directly from the safety loop, transport boundary, and hardware simulation. No new mock/seed logic was introduced.

## 5. Event Ownership & Supported Categories
Our operational event history captures high-frequency, safety-critical events in these primary categories:
- **SAFETY**: Deterministic interlock rejections, emergency stops, combustible gas alerts, collision detection.
- **SYSTEM**: Transport connection lifecycle, command acknowledgement status, mission boundary changes.
- **TELEMETRY**: Periodic operational health checkpoints.

## 6. Live / Simulated / Historical Handling
The Event History interface leverages the `systemMode` (e.g. `SIMULATED`) to clearly brand the data's origin. It strictly consumes events triggered during the current runtime. If no events have been triggered (e.g. fresh launch), it displays a truthful empty state ("NO EVENTS RECORDED - Awaiting operational telemetry...") instead of populating fake historical mock data. 

## 7. Senior Integration Boundary
Our Event History remains an **Operational Audit Surface**. It is required for local operator accountability and hardware diagnostics. The Senior platform APIs (such as Maintenance logs) will be populated asynchronously via a background sync adapter when critical hardware faults occur, but the Senior API is entirely bypassed for rendering this local safety history.

## 8. Validation Evidence
- Tests passing (82/82).
- Dead reference checks confirm no dangling imports to `/ship` or `/records`.
- Next.js build completed successfully.
