# PHASE 7 — ROBOT HEALTH, LIFETIME, MAINTENANCE & ANALYTICS AUDIT

## 1. Capability Matrix

| Capability | Implementation | Data source | State authority | UI | Persistence | Tests | Status | Gap |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Robot Health** |
| Subsystem Health | Deterministic thresholds on sensor data | `sensor` store | `platformStore` | Implemented | None | Covered | IMPLEMENTED | Only simulated. No historical storage of health states. |
| Overall Health | `overallHealth` property | `robot` state | `platformStore` | Implemented | None | Missing | PARTIALLY | Property exists but is not reactively updated by telemetry faults. |
| Key Trends | UI Component | Static Hardcoded | None | Implemented | None | N/A | SCAFFOLDED | Hardcoded "1,420 h" and "Next Service: 45 h". |
| **B. Predictive Maintenance** |
| Predictive Logic | None | N/A | None | Scaffolded | None | N/A | MISSING | No machine learning or heuristic predictive models exist. |
| **C. Lifetime Passport** |
| Operating Time | UI Component | Static Hardcoded | None | Scaffolded | None | N/A | SCAFFOLDED | Hardcoded text "N/A (SIMULATION)". |
| Mission Counts | Volatile event filter | `events` store | `platformStore` | Implemented | None | Missing | PARTIALLY | Filters volatile 100-event array. Will lose count after 100 events or reload. |
| Lifecycle Events | Volatile event filter | `events` store | `platformStore` | Implemented | None | Missing | PARTIALLY | Same as above. E-stops are filtered from volatile array. |
| **D. Maintenance Log** |
| Service Records | UI Component | Static Hardcoded | None | Scaffolded | None | N/A | MISSING | Hardcoded "NO PENDING SERVICE". |
| **E. Performance Analytics** |
| Efficiency / Usage | UI Component | None | None | Scaffolded | None | N/A | MISSING | Hardcoded "INSUFFICIENT DATA". |
| **F. Material/Cut Analytics** |
| Material Modeling | `estimateCut` | `plannerStore` | `plannerStore` | N/A | None | Covered | IMPLEMENTED | Material density and thickness are accurately modeled for planning. |
| Historical Cut Data | Missing | N/A | None | N/A | None | N/A | MISSING | Material estimation data is dropped upon cut completion; `robotState.completedCuts` only retains geometry, not material or actual vs estimated duration. |

## 2. Data Provenance & State Authority Findings

Every metric currently displayed in Phase 7 interfaces was audited for data honesty:

- **Subsystem Health Status (IMU, Motors, etc.):** DERIVED FROM STATE (Deterministically mapped from `usePlatformStore.getState().sensor`).
- **Completed Missions / E-Stops:** DERIVED FROM STATE (Filtered dynamically from `usePlatformStore.getState().events`).
- **Operating Hours (1,420 h):** STATIC CONFIGURATION (Hardcoded in UI).
- **Next Service (45 h):** STATIC CONFIGURATION (Hardcoded in UI).
- **Robot Serial (RBG-6.0-PROTO):** STATIC CONFIGURATION (Hardcoded in UI).
- **Commissioned Date:** STATIC CONFIGURATION (Hardcoded in UI).

**Warning:** Several UI components masquerade as functional analytics but rely on hardcoded text. 

## 3. Persistence Boundaries Discovered

Currently, **100% of the platform data is volatile (in-memory Zustand stores).** To satisfy the Phase 7 analytics requirements in the future backend (Phase 6b/8), the following entities must be modeled in the database:

1. `Missions` (id, status, timestamps, ship_id)
2. `CutRecords` (id, mission_id, geometry, material, estimated_duration, actual_duration)
3. `TelemetryHistory` (Time-series data for analytics)
4. `MaintenanceRecords` (id, component, action, timestamp)
5. `RobotLifetimeCounters` (total_operating_seconds, locomotion_meters, total_cut_meters)
6. `HealthEvents` (id, severity, subsystem, timestamp)

## 4. Predictive Maintenance Honesty

**Status: RULE-BASED / MISSING**
There is absolutely no Predictive Maintenance, Machine Learning, or AI logic in the repository. The `Robo-Assist` page explicitly reports "AI ASSISTANT OFFLINE". The `Robot Health` page explicitly displays a disclaimer: "This is a simulation health model... No live predictions are currently available." The project maintains strict data honesty.

## 5. Conclusion
Phase 7 is entirely **SCAFFOLDED**. The architectural foundation for deriving these metrics (telemetry generation, event logs, cut geometry) exists in Phase 4/5, but the long-term aggregation, persistence, and AI/predictive calculation layers do not exist. Implementing them requires Backend Persistence (Postgres/Supabase) to be established first.

## 6. Phase 7A Data Foundation Update

**Authoritative Models Created (`src/lib/domain/index.ts`):**
- `LifetimeCounters`: missionsCompleted, cutsCompleted, panelsRemoved, emergencyStops
- `MaintenanceRecord`: id, timestamp, component, description, status
- `HealthEvent`: id, timestamp, subsystem, status, reason

**State Authority Updates (`src/lib/platformStore.ts`):**
- `platformStore` now owns `lifetimeCounters`, `maintenanceLog`, `healthEvents`, and `missionHistory`.
- `completeMission` natively increments `lifetimeCounters.missionsCompleted` and archives to `missionHistory`.
- E-Stop events natively increment `lifetimeCounters.emergencyStops`.
- `recordCutsCompleted` securely interfaces `robotState` (which tracks actual cut semantics) to `platformStore` (which tracks lifetime counts).

**Cut Analytics Preservation (`src/lib/robotState.ts`):**
- `CutRecord` was enriched to capture planning metadata upon completion.
- Added `missionId`, `geometry`, `material`, `estimatedDurationSeconds` fields directly inherited from the `plannerStore` when a `plannedCutId` exists. This prevents loss of analytics data after a cut closes.

**Derived Metrics Now Available in UI:**
- **Missions Completed:** Derived from `lifetimeCounters`.
- **Emergency Stops:** Derived from `lifetimeCounters`.
- **Total Cuts Completed:** Derived from `lifetimeCounters`.
- **Total Panels Removed:** Derived from `lifetimeCounters`.

**Metrics Still Unavailable (Marked as UNAVAILABLE in UI):**
- Operating Hours
- Next Service
- Critical Faults (24h)
- Component Replacements
- Safety Overrides
- Steel Weight Removed (Est)

**Status:**
The in-memory data foundation accurately reflects current subsystem behavior, replacing previously hardcoded values with rigorously derived, state-backed equivalents. Backend persistence remains the core blocker for survival across sessions. Phase 4 Runtime Closure remains blocked by browser infrastructure.
