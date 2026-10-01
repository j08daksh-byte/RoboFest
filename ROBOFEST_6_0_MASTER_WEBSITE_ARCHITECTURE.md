# ROBOFEST 6.0 MASTER WEBSITE ARCHITECTURE

## 1. PRODUCT HIERARCHY
The application is structured into functional domains. Each domain groups related modules, allowing operations personnel to focus on specific operational contexts without losing access to the central 3D Twin when required.

- **OPERATIONS**: Command Center, Missions, Cutting Planner, AI Cut Strategy
- **ROBOT**: Digital Twin (Standalone View), Sensors, Robot Health, Robot Passport, Vision
- **SAFETY**: Safety & Hazards, Weather / Site Workability, Emergency Control, Notifications
- **SHIP**: Ship / Hull Map, Internal Structure, Digital Shipyard
- **INTELLIGENCE**: ROBO-ASSIST, Material / Cut Analytics, Telemetry, Performance Analytics
- **RECORDS**: Event / Alert History, Maintenance Log, Robot Knowledge Base
- **SYSTEM**: Users / Roles, Guided Demo Mode

## 2. ROUTE / NAVIGATION ARCHITECTURE
The frontend will utilize Next.js App Router for strict domain separation.

**Twin Mounting Decision:**
The Digital Twin will be a **reusable Twin viewport mounted only where needed** (e.g., inside the Command Center or Cutting Planner pages), rather than being permanently mounted in a global `layout.tsx`.
**Reason**: Because the authoritative robot state (position, cuts, IK) is fully lifted into global Zustand stores, the Twin can safely unmount and remount during route transitions without losing physical context. Forcing a global Three.js Canvas across the entire Next.js application creates severe, unnecessary GPU rendering overhead on pages that do not require 3D (like Analytics or Settings), and heavily complicates DOM z-index management.

## 3. MODULE ARCHITECTURE
25 distinct modules compose the platform.

**Key Module: Command Center**
- **Purpose**: Primary operational dashboard.
- **Main UI**: Giant central 3D Twin viewport. Side panels for telemetry, health, mission progress. Bottom bar for quick actions.
- **Data I/O**: Consumes all authoritative states; produces high-level operational intents.
- **Ownership**: Daksh (Shell & Logic), Anshika (3D Viewport Content).

## 4. SHARED STATE ARCHITECTURE (MIGRATION STRATEGY)
The current `src/lib/robotState.ts` contains a massive amount of shared state and is a protected integration boundary. A "big-bang" rewrite is prohibited.

**Safe Migration Strategy:**
- **PHASE A**: Keep existing `robotState.ts` absolutely stable.
- **PHASE B**: Define typed contracts/interfaces (e.g., `RobotState`, `MissionState`, `SafetyState`) around the existing state architecture.
- **PHASE C**: Introduce new domain stores/adapters only where necessary for new platform features.
- **PHASE D**: Migrate consumers incrementally from the legacy store to the new domain stores.
- **PHASE E**: Remove old state from `robotState.ts` only after all dependencies are verified and passing tests.

## 5. VISUAL VS PLATFORM STATE
There is a strict distinction between visual representation and authoritative logic:
- **Robot Mesh Position**: Visual State (3D/Twin responsibility).
- **Authoritative Robot Position**: Platform State (Platform/Simulation responsibility).
- **Cut Visual (sparks, panels)**: Visual State (3D/Twin responsibility).
- **Cut Definition & Validation**: Platform State (Platform responsibility).
- **Safety Visual (red flashing)**: Visual State (3D/Twin responsibility).
- **Safety Decision / Interlock**: Platform State (Platform responsibility).

## 6. DIGITAL TWIN BOUNDARY
The Twin Interface defines a clean conceptual boundary. 

**PLATFORM → TWIN (Commands)**
- `focusRobot()`
- `focusShip()`
- `focusCut()`
- `selectComponent()`
- `selectHullSection()`
- `setXRay()`
- `setCameraMode()`
- `resetVisualScene()`
- `displayApprovedCut()`

**TWIN → PLATFORM (Events)**
- `onRobotComponentSelected()`
- `onHullSectionSelected()`
- `onCutVisualCompleted()`
- `onPanelDetached()`
- `onCameraTargetChanged()`
- `onVisualInteractionEvent()`

## 7. SIMULATION / LIVE ARCHITECTURE
Data flows through standard Adapter interfaces. UI components must NEVER know if the robot is real or simulated.
- **Live Flow:** `ESP32 -> Socket -> LiveAdapter -> Application State -> UI / Twin`
- **Sim Flow:** `Simulation Physics Engine -> SimAdapter -> Application State -> UI / Twin`

**SimulationController Review:**
Currently, `SimulationController.tsx` owns A) R3F `useFrame` hook, B) keyboard event listeners, C) kinematics math, and D) `globalCuttingNetwork` cycle detection.
*Future Boundary*: It will be isolated. The keyboard events and authoritative physics/cutting math will move to a pure TypeScript `SimAdapter` (Platform responsibility) outside the React loop. The `SimulationController` inside the Twin will then solely consume the updated state for visual interpolation. *For now, it remains untouched.*

## 8. SAFETY ARCHITECTURE
**Safety is Deterministic. AI can advise, but NEVER bypass deterministic safety interlocks.**
- **Authoritative Engine**: A dedicated client-side validation loop evaluates hazards before commands are sent.
- **Interlocks**: If conditions are unsafe (e.g., IMU tilt > 45deg), the platform enforces hard logic (Torch OFF, Tracks STOP).

## 9. CUTTING ARCHITECTURE
The existing cutting implementation is protected. The conceptual split is:
- **Platform (Daksh)**: Cut definition, geometry/business validation, reach validation, structural/cable validation, panel weight calculation, sequence, risk, history, analytics.
- **Digital Twin (Anshika)**: Torch visualization, cut-line rendering, hull visual removal, panel visualization, panel detachment/fall, internal structure visualization, visual reset.

## 10. OWNERSHIP (ZERO-OVERLAP)

**ANSHIKA OWNS: ROBOT + DIGITAL TWIN + ENTIRE 3D WORLD**
- Three.js / React Three Fiber implementation, Canvas internals, RobotModel, robot meshes, tracks, magnets, arm, torch visuals, hoses, support cables.
- Ship geometry, procedural hull, internal 3D structure, shipyard environment, 3D materials, 3D lighting, 3D camera implementation.
- 3D animation, visual cutting, visual panel behavior, 3D environment assets, visual Twin interactions, Twin-side implementation of the viewport API.

**DAKSH OWNS: PLATFORM BRAIN**
- Next.js application shell, navigation, dashboard UI, platform state architecture, domain contracts, safety engine, sensor architecture, telemetry, missions, cutting planner/business logic.
- Cut strategy, health, passport, analytics, notifications, history, backend/API, simulation/live adapters, AI, ROBO-ASSIST, ESP32 integration, demo orchestration, platform-side integration.

**SHARED BOUNDARY (Interface Contract):**
Daksh consumes the interface. Anshika implements the Twin side. There are no competing APIs.

## 11. SHARED / HIGH-RISK FILES
- `src/lib/robotState.ts` (Requires safe Phase A-E migration).
- `src/components/DigitalTwin/index.tsx` (The API boundary).
- `src/components/DigitalTwin/SimulationController.tsx` (Will be split into visual consumer and platform physics adapter).

## 12. FOUNDATION LOCKED CRITERIA
1. Digital Twin baseline protected.
2. Git baseline protected.
3. Master architecture documented.
4. Navigation hierarchy documented.
5. Module boundaries documented.
6. State migration strategy documented.
7. Simulation/live architecture documented.
8. Twin/platform boundary documented.
9. Cutting boundary documented.
10. Safety boundary documented.
11. Ownership has zero ambiguity.
12. Shared files identified.
13. No application code changed during architecture review.
14. Architecture is safe enough to begin website shell implementation.
