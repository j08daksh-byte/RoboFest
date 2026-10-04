# PHASE 13C: BACKEND COMMAND TRANSPORT

## 1. Architecture
We introduced `BackendCommandTransport` alongside the existing `SimulationCommandTransport`. Rather than destroying the simulation layer, both now exist side-by-side. 
A new `ProxyCommandTransport` intelligently delegates instructions based on the application's `SystemMode` (Simulated vs Live/Backend).

## 2. Simulation Mode
In Simulation mode, the Command Center continues to instantly simulate hardware responses, acknowledging commands locally without network interaction. This preserves offline testing capabilities.

## 3. Backend Mode
In Backend mode, commands are stringently packed into JSON and pushed securely to `POST /api/robot/command`.

## 4. Authentication
Because this is an edge client without a traditional web-browser login screen, we implemented `authStore.ts`. It securely stores the JWT using local mechanism, auto-provisioning the demo admin session if missing.
**CRITICAL SECURITY**: No JWT signing secrets, Prisma DB URLs, or Senior API tokens were bundled into the client JS.

## 5. Authorization
Failures at the backend (401/403) are seamlessly mapped to `REJECTED` command states within the UI, keeping the operator truthfully informed of permission denial.

## 6. Command Lifecycle
When the backend responds with `200 ACCEPTED`, the transport notifies the frontend store that the command is `PENDING`. 
We **do not** falsify an `ACKNOWLEDGED` state. 

## 7. Failure Semantics
- **400 Invalid**: Mapped to `FAILED`.
- **401/403 Auth Denied**: Mapped to `REJECTED`.
- **409 Duplicate**: Mapped to `REJECTED` (preventing double execution).
- **5xx / Network offline**: Mapped to `FAILED`.
- **None of these mutate the authoritative actuator state.**

## 8. E-Stop Semantics
Emergency stop dispatches over HTTP for persistence, but the local deterministic interlock on the frontend remains absolutely intact. If the network crashes, the UI safety engine still locks the Digital Twin down.

## 9. State Authority
**Command Intent** (what the user clicked) is now clearly divorced from **Command Status** (PENDING) and **Authoritative Actuator State** (which remains unmodified during PENDING).

## 10. Current Physical ACK Limitation
> **PHYSICAL EXECUTION ACKNOWLEDGEMENT = NOT IMPLEMENTED**

Because the robot ESP32 hardware is not connected, commands rest eternally in the `PENDING` state. This is truth-in-architecture. The Digital Twin correctly halts animation until genuine acknowledgement is received.

## 11. Future ESP32 Boundary
Phase 14/15 will introduce the MQTT broker layer that actively pulls `PENDING` commands from the database and pushes physical `ACKNOWLEDGED` updates. At that point, the frontend will poll `GET /api/robot/command/[id]` to finally release the `PENDING` state.
