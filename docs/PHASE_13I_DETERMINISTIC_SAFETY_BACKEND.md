# Phase 13I: Deterministic Safety Backend

## Overview
This phase implements the deterministic safety boundary for the backend. It ensures that the system can reliably block dangerous operations based on hazardous conditions reported in telemetry and an active emergency stop state, irrespective of the client interface.

## 1. Safety State
- `RuntimeState` now leverages `emergencyActive` as the canonical E-Stop state.
- `SafetyLevel` enum provides priority-ordered severity for hazards (`NORMAL` to `EVACUATION`).
- Telemetry hazard evaluation is unified under `evaluateServerSafety`.

## 2. Server-Side Interlocks
Server-side interlocks now gate operational transitions across the API.
- **Mission Start**: Blocked if `emergencyActive` is true or if safety hazards exceed acceptable thresholds.
- **Cut Start**: Blocked if mission is not `RUNNING`, if `emergencyActive` is true, or if critical safety conditions fail.
- **Robot Command**: Dangerous actuator operations (locomotion, torch, arm) are validated and rejected before reaching `PENDING` status if safety violations exist. E-Stop commands bypass this restriction.

## 3. E-Stop Behavior
- **Trigger**: Asserting E-Stop is available to all authenticated roles. It sets `emergencyActive = true` in the DB instantly.
- **Clear**: Clearing E-Stop requires elevated authorization (`ENGINEER`, `SUPERVISOR`, `ADMIN`). `OPERATOR` cannot clear E-Stops.
- **Hardware Note**: This represents **SOFTWARE SAFETY STATE**. Do not claim physical E-stop capability until ESP32 integration exists.

## 4. Protected APIs
The following routes have been secured with `evaluateServerSafety`:
- `POST /api/robot/command` (Blocks dangerous commands)
- `POST /api/missions/[id]/transition` (Blocks mission starts on hazard)
- `POST /api/missions/[id]/cuts/[cutId]/transition` (Blocks cut queueing/running on hazard)

## 5. EventLog & Tracing
Safety changes are now transparently recorded with the `SAFETY` category:
- `SAFETY_ESTOP_ASSERTED`
- `SAFETY_ESTOP_CLEARED`
- `SAFETY_COMMAND_REJECTED`
- `SAFETY_MISSION_REJECTED`
- `SAFETY_CUT_REJECTED`

## Unresolved Limitations
- Currently, telemetry-based hazards are determined by evaluating the *latest* telemetry record. If telemetry is not flowing (stale), it should explicitly trigger a hazard (partially handled via `systemRules`).
- No physical hardware connection exists yet. Software E-stop operates purely as an interlock for the backend queue.
