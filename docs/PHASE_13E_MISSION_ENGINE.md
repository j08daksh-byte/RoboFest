# PHASE 13E: MISSION ENGINE

## 1. Architecture
We implemented a real, persistent Mission Engine explicitly tracking operational lifecycle and isolating it from physical execution commands. The existing Zustand-only optimistic mission state has been fully replaced with a strict backend state machine.

## 2. Prisma Database Model
The `Mission` model was expanded to include explicit lifecycle audit fields and bounded state transitions:
- `status`: Bounded strictly to `DRAFT`, `READY`, `RUNNING`, `PAUSED`, `COMPLETED`, `ABORTED`.
- `progressPercentage`: Int (0-100).
- `startedAt`, `pausedAt`, `completedAt`, `abortedAt`: Optional DateTime boundaries.
- `stateVersion`: For concurrency control.

## 3. Mission State Machine
All state transitions are processed server-side through `POST /api/missions/[id]/transition`.
Valid transitions:
- `DRAFT -> READY`
- `READY -> RUNNING`
- `RUNNING -> PAUSED` | `COMPLETED` | `ABORTED`
- `PAUSED -> RUNNING` | `COMPLETED` | `ABORTED`

Invalid transitions (e.g. `COMPLETED -> RUNNING`, or `DRAFT -> RUNNING`) strictly fail with HTTP 400.

## 4. API Endpoints
- `GET /api/missions`: Fetch mission history.
- `GET /api/missions/[id]`: Fetch specific mission.
- `POST /api/missions`: Creates a new mission, forcing `DRAFT` status regardless of payload.
- `PATCH /api/missions/[id]`: Metadata updates only (objective, shipName, progressPercentage). State transitions are blocked.
- `POST /api/missions/[id]/transition`: The exclusive boundary for changing a mission's state via `action` strings.

## 5. Authorization Rules
Mission creation and lifecycle transitions require explicit operational roles: `OPERATOR`, `ENGINEER`, `SUPERVISOR`, or `ADMIN`. Unauthenticated users receive 401, and unauthorized roles receive 403 via `withAuth`.

## 6. RuntimeState Integration
The Mission Engine guarantees that the global `RuntimeState` always accurately reflects the active mission context:
- `START`/`RESUME` transitions transactionally assert `RuntimeState.activeMissionId = mission.id`.
- `COMPLETE`/`ABORT` transitions transactionally clear `RuntimeState.activeMissionId = null`.

## 7. Safety Gate
A mission `START` action transactionally checks `RuntimeState.emergencyActive`. If an E-Stop is active, starting a mission returns HTTP 409 and explicitly halts operation.

## 8. Recovery Behavior
Because the backend controls the state, browser refreshes correctly hydrate the mission status based on the single source of truth. A `PAUSED` mission remains `PAUSED` after a refresh. The frontend Zustand store makes `fetch` requests and only mutates its UI representation *after* a successful HTTP 200 backend validation.

## 9. EventLog Behavior
Every state machine transition explicitly writes an event to the `EventLog` associated with the transition user and mission ID. Invalid transitions write `WARNING` logs.

## 10. Limitations / Command Relationship
Commands can reference `missionId`, but physical execution does not automatically start just because a mission transitioned to `RUNNING`. Physical execution is explicitly delayed until Phase 14 (IoT/MQTT integration). Pending commands remain `PENDING`.
