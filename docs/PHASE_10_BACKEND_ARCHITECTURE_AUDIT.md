# PHASE 10: BACKEND / DATABASE / API ARCHITECTURE AUDIT

## 1. Complete State Inventory

| Domain | Current authority | Current persistence | Needs backend? | Why | Proposed API boundary | Priority |
|---|---|---|---|---|---|---|
| Users | Scaffold (domain) | None | Yes | Auth/Identity | `/api/users` | High |
| Roles | Scaffold (domain) | None | Yes | Authz Mapping | `/api/roles` | High |
| Permissions | Scaffold (domain) | None | Yes | Command Authz | Implicit via Role | High |
| Missions | `platformStore` | Local volatile | Yes | Cross-session state | `/api/missions` | High |
| Ships | Mission state | Local volatile | Yes | Digital Shipyard | `/api/ships` | Medium |
| Hull configuration | Mission state | Local volatile | Yes | Board dimensions | `/api/ships` | Medium |
| Planned cuts | `plannerStore` | Local volatile | Yes | Plan verification | `/api/missions/[id]/plan`| High |
| Completed cuts | `platformStore` | Local volatile | Yes | Progress history | `/api/missions/[id]/cuts`| Medium |
| Panel records | `platformStore` | Local volatile | Yes | Operational audit | `/api/missions/[id]/panels`| Medium |
| Telemetry (Live) | `telemetrySimulator`| Local volatile | Yes (Transport) | Hardware ingest | WebSockets/MQTT | High |
| Telemetry history | `platformStore` | Local volatile | Yes | Timeseries analytics | `/api/telemetry` | Low |
| Sensor state | `platformStore` | Local volatile | Yes | Hardware view | Part of Live Telemetry | High |
| Environment state | `platformStore` | Local volatile | Yes | Site constraints | `/api/environment` | Medium |
| Safety events | `platformStore` | Local volatile | Yes | Audit and tracking | `/api/safety/events` | High |
| Emergency events | `platformStore` | Local volatile | Yes | Liability audit | `/api/safety/events` | High |
| Health events | `platformStore` | Local volatile | Yes | Robot maintenance | `/api/health` | Medium |
| Maintenance records| `platformStore` | Local volatile | Yes | Service history | `/api/maintenance` | Low |
| Lifetime counters | `platformStore` | Local volatile | Yes | Odometer | `/api/robot/lifetime` | Medium |
| Performance metrics| Client Derived | None | No | Calculate on UI | N/A | Low |
| Notifications | `platformStore` | Local volatile | Yes | Cross-device alerts | `/api/notifications` | Medium |
| Knowledge docs | Scaffold (domain) | None | Yes | Manuals and SOPs | `/api/knowledge` | Low |
| Audit logs | None | None | Yes | Action tracking | `/api/audit` | High |
| Robot commands | None | None | Yes | Command tracing | `/api/robot/commands` | High |
| Command acks | None | None | Yes | Closed-loop execution| `/api/robot/commands` | High |

---

## 2. Data Lifecycle Classification

**A. CLIENT-ONLY DERIVED**
- Performance analytics, Optimal cut strategy, Live UI rendering loops.

**B. CLIENT SIMULATION STATE**
- `telemetrySimulator`, `CutSim3D` physics.

**C. PERSISTENT SERVER STATE**
- Users, Roles, Missions, Ships, Knowledge Base, Cut Plans.

**D. LIVE SERVER STATE**
- Current Telemetry, Sensor State, Environment, Live Command Queue.

**E. HARDWARE STATE**
- Actual physical positions, electromagnet engagement, torch ignition status.

**F. HISTORICAL/AUDIT RECORD**
- Completed cuts, Safety events, Emergency events, Audit logs, Command history, Maintenance records.

---

## 3. Command Architecture Audit

**Current Flow (Simulated):**
`UI request` → `robotState.ts` (deterministic safety) → `platformStore` (state update) → `Digital Twin` (UI)

**Future Live Flow:**
`UI request` → **`Authorization Check`** → `Command Validation` (/api) → **`Deterministic Safety (Backend/ESP32)`** → `Live Transport` → `ESP32` → `Physical Actuator` → `Acknowledgement` → `Live Transport` → `Backend Platform State` → `Digital Twin`

**CRITICAL REQUIREMENT:** 
The backend must NOT bypass the established deterministic safety system. Hardware safety boundaries (e.g. stopping movement if torch is on and off-path) must be enforced close to the metal (ESP32) and guarded by the API.

---

## 4. Authentication / Authorization Boundary

**Proposed Authorization Pipeline:**
`IDENTITY (JWT)` → `ROLE (DB)` → `PERMISSION CHECK` → `COMMAND REQUEST` → `COMMAND VALIDATION` → `DETERMINISTIC SAFETY` → `EXECUTION`

**Operations requiring Authorization:**
- **Robot Movement/Actuation:** Requires `OPERATOR` or `ENGINEER`.
- **Emergency Stop:** Requires *Any Authenticated User*.
- **Safety Overrides:** Requires `SUPERVISOR` or `ADMIN`.
- **Mission Planning:** Requires `ENGINEER`.
- **User Management:** Requires `ADMIN`.

---

## 5. Required API Groups (Future Implementation)

- **`/api/auth`**: POST (Login/Session creation).
- **`/api/users`**: GET, POST, PUT, DELETE (Admin user management).
- **`/api/missions`**: GET, POST, PUT (Mission lifecycle).
- **`/api/safety/events`**: GET, POST (Audit trail of hazards/emergencies).
- **`/api/robot/command`**: POST (Execute hardware command - *Scaffolded but needs JWT Auth*).
- **`/api/telemetry/history`**: GET (Timeseries data for analytics).

---

## 6. Existing Command API Audit

**Location:** `src/app/api/robot/command/route.ts`
- **Currently Validates:** JSON structure, required payload fields (`UPDATE_LOCOMOTION`, `SET_TORCH`, etc.).
- **Currently Executes:** Nothing. It returns HTTP 200 `ACCEPTED` and drops the payload.
- **Future Responsibilities:**
  1. Extract JWT and verify user permissions.
  2. Push the validated command into a Message Queue / IoT Hub.
  3. Await basic transport layer ACK before returning 200.

---

## 7. Telemetry Architecture Boundary

**Current Simulated Boundary:**
`telemetrySimulator` → `platformStore` → `UI`

**Future Live Boundary:**
`ESP32` → `Hardware Adapter` → `MQTT/WebSocket Transport` → `Backend Telemetry Ingestion` → `Validated State` → `Next.js WebSocket Client` → `platformStore` → `UI`

**Requirements:**
- Sequence numbers and timestamps are strictly required from the ESP32.
- Stale telemetry (loss of heartbeat) MUST trigger an automatic Safety Interlock (ROBOT_STOP).

---

## 8. Proposed Database Entities (Minimum Viable)

1. **`User`**: id, username, role, password_hash.
2. **`Mission`**: id, status, ship_name, objective, created_by, timestamps.
3. **`CutPlan`**: id, mission_id, geometry_json.
4. **`EventLog`**: id, category, severity, message, timestamp, user_id (optional), mission_id.
5. **`CommandRecord`**: id, type, payload_json, status, user_id, timestamp.

---

## 9. Simulation vs Live Transition Architecture

The UI actively utilizes `systemMode` (`SIMULATED`, `LIVE`, `DEMO`, `OFFLINE`). 
To ensure safety:
- If `systemMode === LIVE`, the local `telemetrySimulator` must be aggressively unmounted/disabled.
- The UI must visually declare `[LIVE]` in the header to ensure operators know hardware is moving.
- Live telemetry must completely overwrite any residual client-side state in `platformStore`.

---

## 10. Phase Dependency Graph

```text
[Phase 9: Auth/Knowledge Audit]
           ↓
[Phase 10: Backend Architecture Audit]  <-- WE ARE HERE
           ↓
[Phase 10: Database/Auth Persistence]
           ↓
[Phase 11: Live Telemetry Transport (MQTT/WS)]
           ↓
[Phase 12: ESP32 Hardware Adapter]
           ↓
[Phase 13: Robot ↔ Digital Twin Sync]
           ↓
[Phase 14: Physical Safety Validation]
```

**Immediate actionable items without Browser Verification:**
- Database Schema and Migrations configuration (Prisma/Drizzle/Supabase).
- Backend Authentication Providers (NextAuth/JWT).
- Backend API Route implementations for persistent storage.
