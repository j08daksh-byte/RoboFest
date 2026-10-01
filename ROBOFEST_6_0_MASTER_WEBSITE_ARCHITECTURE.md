# ROBOFEST 6.0 MASTER WEBSITE ARCHITECTURE

## 1. PRODUCT HIERARCHY
The application is structured into functional domains. Each domain groups related modules, allowing operations personnel to focus on specific operational contexts without losing access to the central 3D Twin.

- **OPERATIONS**: Command Center, Missions, Cutting Planner, AI Cut Strategy
- **ROBOT**: Digital Twin (Standalone View), Sensors, Robot Health, Robot Passport, Vision
- **SAFETY**: Safety & Hazards, Weather / Site Workability, Emergency Control, Notifications
- **SHIP**: Ship / Hull Map, Internal Structure, Digital Shipyard
- **INTELLIGENCE**: ROBO-ASSIST, Material / Cut Analytics, Telemetry, Performance Analytics
- **RECORDS**: Event / Alert History, Maintenance Log, Robot Knowledge Base
- **SYSTEM**: Users / Roles, Guided Demo Mode

## 2. ROUTE / NAVIGATION ARCHITECTURE
The frontend will utilize Next.js App Router for strict domain separation while preserving the 3D Engine state across navigation via persistent layouts.

- `/` (Command Center - Primary Judge/Operator screen)
- `/operations/missions`
- `/operations/planner`
- `/operations/ai-strategy`
- `/robot/twin`
- `/robot/sensors`
- `/robot/health`
- `/robot/passport`
- `/robot/vision`
- `/safety/hazards`
- `/safety/weather`
- `/safety/emergency`
- `/safety/notifications`
- `/ship/hull`
- ... (following the domain hierarchy)

*Note: The Digital Twin `<Canvas>` must be lifted to a high-level layout so it does not unmount during route transitions.*

## 3. MODULE ARCHITECTURE

**1. Command Center**
- **Purpose**: Primary operational dashboard.
- **Primary User**: Operator / Judge.
- **Main UI**: Giant central 3D Twin, side panels for telemetry, health, mission progress. Bottom bar for quick actions.
- **Data I/O**: Consumes all states; produces high-level intents.
- **Dependencies**: MissionState, RobotState, SafetyState.
- **Ownership**: Shared Integration.

**2. Robot Digital Twin**
- **Purpose**: Full-screen immersive view of the twin without UI clutter.
- **Primary User**: Operator (for detailed inspection).
- **Data I/O**: Consumes TelemetryState, outputs viewport events.
- **Ownership**: Anshika (Visuals), Daksh (Data Wrapper).

**3. Live Sensor Center**
- **Purpose**: Raw data visualization from ESP32.
- **Data I/O**: Consumes SensorState.
- **Ownership**: Daksh.

**4. Safety & Hazard Center**
- **Purpose**: Monitor interlocks, gas limits, tilt limits.
- **Dependencies**: SafetyState.
- **Ownership**: Daksh.

**5. Weather / Site Workability**
- **Purpose**: External factors affecting dry dock operations.
- **Ownership**: Shared.

**6. Cutting Planner**
- **Purpose**: Draw, validate, and sequence cuts before execution.
- **Data I/O**: Produces MissionState/CutState.
- **Ownership**: Daksh (Logic), Anshika (3D Tools).

**7. AI Cut Strategy**
- **Purpose**: Generates optimal pathing based on hull geometry.
- **Ownership**: Daksh.

**8. Vision / Camera**
- **Purpose**: Real-time camera feeds from the robot.
- **Ownership**: Daksh.

**9. ROBO-ASSIST**
- **Purpose**: Conversational AI assistant for operators.
- **Ownership**: Daksh.

**10. Robot Health**
- **Purpose**: Diagnostics, motor temps, battery voltage.
- **Ownership**: Daksh.

**11. Lifetime Robot Passport**
- **Purpose**: Persistent operational history and certification.
- **Ownership**: Daksh.

**12. Mission Management**
- **Purpose**: Load, save, and track execution of cuts.
- **Ownership**: Daksh.

**13. Ship / Hull Map**
- **Purpose**: 2D/3D flattened view of all cuts across the vessel.
- **Ownership**: Anshika.

**14. Internal Ship Structure**
- **Purpose**: X-Ray analysis to avoid cutting ribs.
- **Ownership**: Anshika.

**15. Material / Cut Analytics**
- **Purpose**: Gas usage, steel removed, time efficiency.
- **Ownership**: Daksh.

**16. Telemetry**
- **Purpose**: Deep dive into IK, forces, and kinematics data.
- **Ownership**: Daksh.

**17. Emergency Control**
- **Purpose**: E-STOP, gas shutoff, manual override.
- **Ownership**: Daksh.

**18. Digital Shipyard**
- **Purpose**: Fleet and environmental context.
- **Ownership**: Anshika.

**19. Event / Alert History**
- **Purpose**: Audit log of all warnings and operator actions.
- **Ownership**: Daksh.

**20. Maintenance Log**
- **Purpose**: Component replacement schedules.
- **Ownership**: Daksh.

**21. Performance Analytics**
- **Purpose**: KPIs for the cutting system.
- **Ownership**: Daksh.

**22. Users / Roles**
- **Purpose**: RBAC for operations.
- **Ownership**: Daksh.

**23. Smart Notifications**
- **Purpose**: Toast system and alert queues.
- **Ownership**: Daksh.

**24. Robot Knowledge Base**
- **Purpose**: Embedded manuals and schematics.
- **Ownership**: Daksh.

**25. Guided Demo Mode**
- **Purpose**: Pre-scripted narrative for judges.
- **Ownership**: Shared.

## 4. SHARED STATE ARCHITECTURE
Currently, `robotState.ts` is monolithic. It will be refactored into distinct slice boundaries:

- **RobotState**: Owned by physics/kinematics. (position, IK, tracks). Read by 3D Engine, written by Provider.
- **MissionState**: Owned by planner. (active cuts, sequences).
- **SafetyState**: Owned by Safety Engine. (E-STOP status, gas warnings).
- **SensorState**: Owned by Hardware. (Raw temperatures, IMU).
- **CutState**: Owned by Cutting Network. (Geometries of removed panels).
- **UIState / ViewportState**: Owned by Website. (camera focus, x-ray toggle).
- **EnvironmentState**: Owned by Shipyard. (wind, lighting).

## 5. DIGITAL TWIN BOUNDARY
The 3D Engine must be isolated from the React DOM UI.

**Website controls (Inbound API):**
- `focusRobot()`, `focusShip()`, `focusCut(id)`
- `setXRayMode(bool)`
- `setSimulationMode(bool)`
- `triggerComponentHighlight(id)`

**Twin emits (Outbound API):**
- `onCutCompleted(geometry)`
- `onRobotCollision()`

The UI wraps the Twin. The Twin NEVER renders HTML UI overlays directly.

## 6. SIMULATION / LIVE ARCHITECTURE
Data flows through standard Adapter interfaces. UI components must NEVER know if the robot is real or simulated.

**Live Flow:** `ESP32 -> Socket -> LiveAdapter -> Zustand Store -> UI/Twin`
**Sim Flow:** `SimulationController (Math) -> SimAdapter -> Zustand Store -> UI/Twin`

## 7. SAFETY ARCHITECTURE
Safety is Deterministic. AI can advise, but NEVER bypass interlocks.

- **Authoritative Engine**: A dedicated client-side validation loop runs before any command is sent to the ESP32 or Twin.
- **States**: NORMAL -> WARNING -> CRITICAL -> E-STOP.
- **Interlocks**: If IMU tilt > 45deg, Torch = OFF, Tracks = STOP.

## 8. CUTTING ARCHITECTURE
- **Anshika**: Visual rendering (panels, glow, sparks, gravity fall, hull alpha masks).
- **Daksh**: Logic (path closure validation, area calculation, intersection math).

## 9. OWNERSHIP
- **Anshika**: Everything inside the `<Canvas>` (Visuals, Shaders, Procedural Generation, Physics Animations).
- **Daksh**: Everything outside the `<Canvas>` (State, Hardware Integration, UI Shell, Dashboards, AI).
- **Shared**: The Zustand State Contracts and the `<DigitalTwin>` wrapper props.

## 10. SHARED / HIGH-RISK FILES
- `src/lib/robotState.ts` (Risk of merge conflicts; must be split).
- `src/components/DigitalTwin/index.tsx` (The boundary wall).
- `src/app/layout.tsx` (Where the Twin gets mounted).

## 11. IMPLEMENTATION ORDER
1. **Foundation Locked** (Current State).
2. **Website Shell & Layouts** (Daksh builds UI wrappers without touching Twin).
3. **State Splitting & Contracts** (Daksh splits `robotState.ts`).
4. **Twin Integration Boundary** (Anshika exposes `focus()` APIs).
5. **Parallel Tracks**: Anshika works on Visual Polish, Daksh works on Dashboards.
6. **Safety & Hardware Integration**.

## 12. RISK REGISTER
1. **Twin Rerendering / Performance Issue**: Putting the 3D view in Next.js page routes will cause it to reload on navigation. *Prevention: Mount Twin in `layout.tsx` and use CSS to hide/shrink it.*
2. **State Mutation Clashes**: React vs Three.js frame updates. *Prevention: Use Zustand `useStore.getState()` in `useFrame` instead of reactive hooks.*
3. **Simulated Data Leaking to Live**: *Prevention: Strict abstract Provider classes.*

## 13. FOUNDATION LOCKED CRITERIA
- [x] Twin protected in Git.
- [x] Website architecture documented.
- [x] Module ownership boundaries documented.
- [x] Linting rules resolved cleanly.
- [x] Ready for separate feature branches.
