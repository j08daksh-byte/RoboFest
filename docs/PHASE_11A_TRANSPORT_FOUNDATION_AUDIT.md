# PHASE 11A: TRANSPORT FOUNDATION AUDIT

## A. Persistence Reality
- **Database Engine:** SQLite (`prisma/dev.db`) via Prisma ORM.
- **Models:** `User`, `Mission`, `CutRecord`, `EventLog` are defined in `schema.prisma`.
- **Status:** **REAL**. The `/api/missions`, `/api/events`, and `/api/missions/[id]/cuts` routes successfully perform CRUD against the actual SQLite database.
- **UI Disconnect:** The UI (Command Center) still relies entirely on `usePlatformStore` (Zustand) for state. It does **not** currently use `fetch` to write to the real database. The persistence exists at the API boundary but is **UNUSED** by the frontend React components.

## B. Telemetry State Authority
- **Source:** `src/lib/telemetry/simulator.ts` running a `setInterval` at 1Hz.
- **Owner:** `usePlatformStore` (Zustand).
- **Flow:** `simulator.ts` → `updateSensor()` / `updateEnvironment()` in `platformStore` → React UI components → `evaluateSafetyState()` → `platformStore`.
- **Status:** **SIMULATED ONLY**. No real sensors are read.

## C. Command Flow
- **Flow:** UI Button → `useRobotStore` (e.g., `setTorch`, `setArmPosition`) → Checks `usePlatformStore.safety.torchPermission` → State mutates.
- **API Boundary:** `src/app/api/robot/command/route.ts` accepts commands and validates their JSON structure via Zod, returning `200 ACCEPTED`.
- **Execution:** It explicitly notes that it does **NOT** execute anything on hardware and does **NOT** mutate Zustand state.
- **Status:** **SIMULATED ONLY**.

## D. Existing Transport
- Search results for `ws`, `socket.io`, `mqtt`, `EventSource`, `TCP/UDP`: **NONE FOUND**.
- Telemetry relies solely on `setInterval` polling in the simulator.
- **Status:** **NO EXISTING TRANSPORT FOUND**.

## E. API Inventory
| Method | Path | Input | Output | State Mutation | Persistence | Hardware Effect | Status |
|---|---|---|---|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` | `{ token }` | None | SQLite (Reads User) | None | REAL |
| POST | `/api/events` | `EventLog payload` | Created Entity | None | SQLite | None | REAL |
| POST | `/api/missions` | `Mission payload` | Created Entity | None | SQLite | None | REAL |
| GET | `/api/missions` | None | Array of Missions | None | SQLite | None | REAL |
| POST | `/api/missions/[id]/cuts` | `CutRecord payload` | Created Entity | None | SQLite | None | REAL |
| POST | `/api/robot/command` | `RobotCommand JSON` | `CommandResult` | None | None | None | STUB |

## F. Hardware Boundary
- Currently, there is NO hardware boundary. 
- **Future Architecture:** An MQTT client or WebSocket server adapter must be created in the Next.js API or as a separate process. 
- **Rule Violation Flag:** The current architecture mutates `robotState` *synchronously* when a user clicks a UI button (e.g., `setTorch`). In a real hardware system, the UI must send the command via transport, and the state should only update when the ESP32 *acknowledges* the state change via return telemetry.

## G. Senior API Integration Status
- **NO SENIOR API CLIENT IMPLEMENTED YET.**
- There are no `fetch()` or `axios` calls to the Senior MongoDB backend (`localhost:5000` or `/api/parts`).

## H. Test/Lint/Build Evidence
- **Tests:** 76/76 Unit and Integration Tests Passed (100% Success).
- **Lint:** 0 errors, 30 warnings (all `no-unused-vars` in UI components from scaffolded pages).
- **Build:** `next build` compiled successfully in ~1.6s.

## I. Blocking Risks
- **Synchronous State Mutation:** UI commands mutate Zustand instantly. When we switch to live transport, this will cause state flickering if the hardware rejects the command or takes time to actuate.
- **Simulator Entanglement:** The `simulator.ts` is hard-coupled to mutating `usePlatformStore`. We must create a clean interface so the store doesn't care if data comes from the simulator or MQTT.

## J. Exact Phase 11B Implementation Requirement
**TASK:** Implement a WebSocket/MQTT Telemetry Transport Adapter.
1. Create a transport layer (e.g., `src/lib/transport/mqttClient.ts` or WebSocket).
2. Refactor `usePlatformStore` to accept telemetry from an abstracted `TelemetryProvider` rather than hardcoding `simulator.ts` imports.
3. Decouple synchronous UI state mutation by implementing an optimistic/acknowledgement pattern for `useRobotStore` actions.
