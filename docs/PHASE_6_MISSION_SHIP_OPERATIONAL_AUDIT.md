# PHASE 6 — MISSION, SHIP/HULL & OPERATIONAL STATE COMPLETION AUDIT

## 1. Capability Matrix

| Capability | Implementation | State authority | UI | Digital Twin integration | Tests | Status | Gap |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Mission Management** |
| Create/Select Mission | `createMission` in `platformStore` | `platformStore` | Implemented | N/A | Covered | IMPLEMENTED | None. |
| Mission Identity | `mission.id` | `platformStore` | Implemented | N/A | Covered | IMPLEMENTED | None. |
| Lifecycle (Planned/Active/Done) | `startMission`, `completeMission`, `cancelMission` | `platformStore` | Implemented | N/A | Covered | IMPLEMENTED | None. |
| Pause/Resume | `INTERRUPTED` state exists in domain | `platformStore` | Missing | N/A | Missing | MISSING | No `pauseMission` or `resumeMission` actions exist. |
| Mission Progress | `setMissionProgress` | `platformStore` | Implemented | N/A | Covered | PARTIALLY IMPLEMENTED | Progress is manually dispatched rather than reacting to completed cuts automatically. |
| **B. Ship/Hull** |
| Ship Identity | String field `shipName` in mission | `platformStore` | Implemented | N/A | Missing | PARTIALLY IMPLEMENTED | No backing Ship database or authoritative Ship ID. |
| Hull Geometry / Working Area | Hardcoded in `robotConfig` / `shipConfig` | Static Code | N/A | Procedural Mesh | Missing | IMPLEMENTED | Static geometry only; dynamic hull loading is missing. |
| Coordinate System | Documented | Static Code | N/A | Synchronized | Missing | IMPLEMENTED | None. |
| Internal Structure (Ribs/Stringers) | Visual only (`ShipHull.tsx`) | Component State | Toggled via `xRayMode` | Visual meshes | Missing | SCAFFOLDED | No semantic collision or physics data backs the internal structure. |
| **C. Mission ↔ Robot** |
| Robot Operating State | Interlocks via `safetyRules` | `robotState` | Implemented | Synchronized | Covered | IMPLEMENTED | None. |
| Active Mission Sync | `robot.activeMissionId` tracks mission | `platformStore` | Implemented | N/A | Covered | IMPLEMENTED | None. |
| **D. Mission ↔ Cutting** |
| Planned/Approved Cuts | `plannerStore` manages definitions | `plannerStore` | Implemented | N/A | Covered | IMPLEMENTED | None. |
| Mission Association | `missionId` in `CutDefinition` | `plannerStore` | Implemented | N/A | Covered | PARTIALLY IMPLEMENTED | `robotState.completedCuts` records `plannedCutId` but NOT the `missionId` itself. If an unplanned cut is executed, it has no mission linkage. |
| Impossible State: Mission Complete vs Active Cut | Undefined by current spec | N/A | N/A | N/A | Missing | UNDEFINED BY CURRENT SPEC | A mission can be marked completed even if the robot's torch is actively tracing a path. |
| **E. Mission ↔ Digital Twin** |
| Cut/Panel Visuals | `SimulationController.tsx` | `robotState` | Implemented | Synchronized | Covered | IMPLEMENTED | None. |
| Reset Semantics | `robotState.reset()` | `robotState` | Implemented | Synchronized | Covered | PARTIALLY IMPLEMENTED | `robotState.reset()` clears cuts, but does NOT reset the mission in `platformStore`. Leads to stale mission state. |

## 2. State-Authority Map

| Entity | Authoritative Store | Derived / Duplicated In | Synchronization Guaranteed? |
| :--- | :--- | :--- | :--- |
| **Active Mission** | `platformStore` (`mission`) | `platformStore` (`robot.activeMissionId`) | YES (Synchronously updated in `createMission` and `completeMission`) |
| **Planned Cuts** | `plannerStore` (`plannedCuts`) | None | N/A |
| **Completed Cuts** | `robotState` (`completedCuts`) | Digital Twin (CSG Meshes) | YES (React-Three-Fiber hooks dynamically rebuild meshes on state change) |
| **Safety State** | `platformStore` (`safety`) | `robotState` (Checks permission inside actions) | YES (Actions read directly from `usePlatformStore.getState()`) |
| **Internal Hull Structure** | NONE | `ShipHull.tsx` (Component arrays) | NO (Visual only) |

## 3. Operational Semantic Validation (Impossible States)

1. **Mission marked completed while active cut remains unfinished:** UNDEFINED BY CURRENT SPEC. `platformStore` has no interlock against `robotState.activeCutPath`.
2. **Cut executed without an active mission:** PERMITTED. Currently `completedCuts` can be generated purely in free-roam without a mission. 
3. **Mission progress disagreeing with completed cuts:** PERMITTED. Progress is currently a dumb numerical setter, not a reactive derivation of `completedCuts.length / plannedCuts.length`.
4. **Robot showing one mission while platform state shows another:** BLOCKED. `createMission` sets `robot.activeMissionId` atomically.
5. **Reset leaving stale mission state:** VULNERABLE. Calling `useRobotStore.getState().reset()` resets the 3D twin and cut logs, but leaves the `platformStore` mission completely active.
6. **Ship/hull selection disconnected from the mission:** VULNERABLE. Ship is just a text field in the mission. No actual ship state is loaded.

## 4. Final Conclusion
Phase 6 (Mission & Operational State) is solidly **SCAFFOLDED and PARTIALLY IMPLEMENTED**. The basic CRUD operations for missions exist, and the UI successfully binds to them. However, strict relational integrity (linking every final cut to a mission ID, automatically deriving progress, and synchronized multi-store resets) remains an architectural gap.
