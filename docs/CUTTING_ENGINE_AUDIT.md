# CUTTING ENGINE AUDIT

## Overview
This document audits the complete deterministic cutting workflow within RoboFest 6.0, verifying the flow from cut planning through execution, physics generation, and metadata retention.

## Cutting Flow Matrix

1. **Cut planning**
   - **Status:** PASS
   - **Notes:** `plannerStore.ts` provides a structured deterministic cut plan representation (`CutDefinition`), tracking sequence, geometry, material, and approval state.

2. **Geometry validation**
   - **Status:** PASS
   - **Notes:** `validation.ts` deterministically checks for polygon integrity, self-intersection, area limits, reachability, and structural conflicts.

3. **Safety pre-check**
   - **Status:** PASS
   - **Notes:** Torch activation in `robotState.ts` is strictly guarded by `usePlatformStore.getState().safety.torchPermission`.

4. **Human approval**
   - **Status:** GAP
   - **Notes:** While `plannerStore.ts` tracks a cut's `approvalState` up to `'APPROVED'`, the execution layer (`robotState.ts` `setTorch`) does not check if an approved plan is active before allowing torch ignition. Manual cutting bypasses the plan.

5. **Torch activation**
   - **Status:** PASS
   - **Notes:** Bound to deterministic safety interlocks. 

6. **Path tracing**
   - **Status:** PASS
   - **Notes:** Twin tracks torch world position when ON, pushing coordinates to `activeCutPath` via `addCutPoint`.

7. **Open-path behavior**
   - **Status:** PASS
   - **Notes:** Torch OFF without a closed loop clears `activeCutPath` and creates an open `CutRecord` (no material removal, no panel, no fake black artifact).

8. **Closed-loop detection**
   - **Status:** PASS
   - **Notes:** Real-time geometric intersection handled in `SimulationController.tsx` using robust ray-polygon logic in `cuttingNetwork.ts`.

9. **Material removal**
   - **Status:** PASS
   - **Notes:** `ShipHull.tsx` renders dynamic hull masking via alpha textures bound to `completedCuts`.

10. **Panel generation**
   - **Status:** PASS
   - **Notes:** `DetachedPanel` is spawned dynamically based on the verified `isClosed: true` property of a `CutRecord`.

11. **Panel detachment**
   - **Status:** PASS
   - **Notes:** The boolean subtraction of the hull happens simultaneously with the appearance of the independent falling mesh.

12. **Gravity/fall**
   - **Status:** VISUAL-ONLY
   - **Notes:** The panel falls via `useFrame` local physics integration (gravity = -9.81/5) inside `DetachedPanel` component. This is appropriate as the authoritative platform state is just "Cut Closed".

13. **Panel landing**
   - **Status:** VISUAL-ONLY
   - **Notes:** Ground collision and bounce handled by local frame mechanics.

14. **Internal structure exposure**
   - **Status:** PASS
   - **Notes:** Once the hull material is masked out, `InternalShipStructure` (ribs/stringers) becomes naturally visible through the hole.

15. **Multiple cuts**
   - **Status:** PASS
   - **Notes:** The array-based `completedCuts` and iterating `DetachedPanel` mapping completely isolates independent cuts. Identical cuts at different locations work seamlessly.

16. **Cut history**
   - **Status:** PARTIAL
   - **Notes:** Cuts are retained in `completedCuts` with an ID, path, and boolean `isClosed`. A timestamp and material metadata are missing from the `CutRecord`.

17. **Reset**
   - **Status:** PASS
   - **Notes:** `clearAllCuts` correctly resets all transient paths and completed arrays.

18. **X-ray**
   - **Status:** PASS
   - **Notes:** Independent toggle. Does not mutate cut state. Simply overrides material opacity and depth buffering.

19. **Cut metadata**
   - **Status:** GAP
   - **Notes:** The execution `CutRecord` lacks the temporal (timestamp) and relational (planned cut ID) data necessary for a fully traceable industrial pipeline. 

20. **Analytics readiness**
   - **Status:** PARTIAL
   - **Notes:** Metadata gaps need closing to support future historical event storage.

---

## Conclusion
The cutting engine operates deterministically. Open and closed paths behave as required (no fake artifacts on open paths, full panel drop on closed loops). The safety engine correctly guards the torch. 

### High Priority Gaps to Implement:
1. **Approval Enforcement:** `setTorch` should ideally enforce that the robot is linked to an `APPROVED` cut plan (if running in an autonomous or strictly planned mode), or at least record which plan it's executing.
2. **Metadata Enhancement:** Add `timestamp` and `plannedCutId` to the `CutRecord` in `robotState.ts` so that when a loop is closed, there is a deterministic trace back to the planner module for analytics readiness.
