# PHASE 13D: DURABLE RUNTIME STATE

## 1. Architecture
We introduced a `RuntimeState` model in the Prisma schema as a strict singleton (`id: "singleton"`) to track the persistent runtime state of the robot and Command Center.

This model includes fields like:
- `systemMode`
- `activeMissionId`
- `lastCommandId`
- `emergencyActive`
- Physical actuator boundaries (e.g. `positionX`, `torchEnabled`)

## 2. Server API & Validation
A dedicated endpoint `/api/robot/state` exposes `GET` and `PATCH`. 
- **GET**: Used on frontend startup to securely hydrate the exact state from DB. If the singleton does not exist, it is created with default `SIMULATED` parameters.
- **PATCH**: Exposes highly restricted mutation parameters. For example, in `LIVE` system mode, physical actuator boundaries like `torchEnabled` or `positionX` **cannot** be mutated via this endpoint, guaranteeing they only respond to genuine hardware transport callbacks later.

## 3. Hydration Flow
On startup, `Shell/index.tsx` runs a top-level `useEffect` which:
1. Validates the JWT session.
2. Fetches `GET /api/robot/state`.
3. Calls `hydrateRuntimeState` on both `platformStore` and `robotState`.
4. Emits a `SystemEvent` (Category: `OPERATION`) documenting successful recovery.

## 4. Command State Linkage
When `POST /api/robot/command` persists a valid command:
- It tracks the `lastCommandId` in `RuntimeState`.
- It **does not** modify actual hardware state (e.g. moving the arm) because `PENDING` is simply intent.
- Exception: `TRIGGER_EMERGENCY_STOP` commands instantly assert `emergencyActive = true` in `RuntimeState` because E-stops are deterministic and must survive a browser crash.

## 5. Recovery Behavior
- Interrupted `PENDING` commands remain stuck in `PENDING` across browser restarts because the local UI twin only advances upon explicit network-acknowledged `ACKNOWLEDGED` (which, right now, requires `SIMULATED` transport or actual future MQTT feedback).
- `activeMissionId` persists across refreshes, avoiding catastrophic loss of mission tracking mid-operation.

## 6. Testing & Quality
- Added `state.test.ts` to strictly validate `RuntimeState` operations.
- Confirmed `PATCH` in LIVE mode correctly drops unauthorized actuator mutation intents.
- Confirmed 403 authorization guard logic for state mutation.
