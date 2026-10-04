# PHASE 13F: REAL SHIP CUTTING MISSION WORKSPACE

## Objective

Redesign the `Missions` page to accurately represent the real RoboFest ship-cutting workflow, dropping the concept of a "fake" generic simulation, and instead directly integrating the actual physical 3D Digital Twin into the operational cutting planner.

## Architecture & Layout Changes

1. **Two-Column Workspace Layout:**
   - The `/operations/missions/page.tsx` was refactored into a `grid-2-col` layout placing `CutEditor` and `ShipCutPanel` side-by-side.
   - Left: **CUT PLAN — SHIP PHOTO** (`CutEditor.tsx`) — Preserved the real photo-to-cut-plan coordinate mapping on the 2D surface.
   - Right: **3D CUTTING DIGITAL TWIN** (`ShipCutPanel.tsx`) — Upgraded from a generic visualizer to a full instance of the `DigitalTwin`.

2. **Digital Twin Integration:**
   - Rewrote `CutSimulation3D.tsx` to mount the true Digital Twin components: `<ShipAssembly />` and `<RobotModel />`.
   - Replaced internal fake simulation geometry with mapped world coordinates on the `ProceduralShipSurface`.
   - The simulation now evaluates the 2D cut plan coordinates `(planX, planY)`, maps them through `mapToDigitalTwin` onto the 3D hull's `ProceduralShipSurface` `(u, v)` parameters, and translates them to the global Twin transformations (Scale 5, offset 50.25).
   - Robot position `position`, orientation `roll/pitch/yaw`, and torch state `torch` are seamlessly injected into `useRobotStore`, driving the true robot kinematics.
   - Cut tracing correctly drives `activeCutPath` and `completedCuts`, allowing `ShipHull`'s CSG-like alpha map and `DetachedPanel` physics to render real cuts falling.

3. **Constraints Validated:**
   - The Senior/Anshika repository is strictly untouched.
   - No hardware/ESP32 code or live physical MQTT execution is claimed. 
   - Operations remain explicitly marked as SIMULATED visual progress without claiming physical ACKs or telemetry when hardware isn't attached.
   - Global `robotState` is utilized for simulation visualization but gracefully reset using `useEffect` bindings to `resetKey`, preserving the underlying durable backend `platformStore` state.

## Results

- **Mission Area Realism**: Operators now directly perceive how photo-planned coordinates translate dynamically to the exact structural location on the RoboFest ship hull.
- **Twin Reuse**: Redundant, toy geometries in the legacy simulation component were completely removed.
- **Workflow Maturity**: 13F fulfills the operational prerequisite of having an evidence-based physical mapping before connecting the outbound MQTT engine.
