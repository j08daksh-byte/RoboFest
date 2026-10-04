# PHASE 14A — PHYSICAL ROBOT HARDWARE GATEWAY CONTRACT

## Architecture
The Hardware Gateway establishes an explicit, strictly typed boundary between the backend systems (Command Center, Safety Evaluators) and the physical robotics hardware (e.g. ESP32). It abstracts underlying transport (UDP/TCP/MQTT) to ensure that the frontend *never* directly commands hardware sockets. It introduces idempotency, strictly enforced physical ACK lifecycles, and discrete E-Stop routing.

## 1. Gateway Interface
The `HardwareGateway` provides deterministic lifecycle control and event ingestion:
- `connect()`
- `disconnect()`
- `sendCommand(HardwareCommandEnvelope)`
- `getConnectionStatus()`
- `emergencyStop()` (software-issued hardware-stop intent)
- Asynchronous handlers: `onTelemetryReceived`, `onAckReceived`, `onConnectionChanged`, `onHardwareEmergencyStop`

## 2. Command Protocol
Hardware commands explicitly carry protocol versions and unique tracking correlation IDs:
- **Envelope fields:** `commandId`, `timestamp`, `robotId`, `type`, `parameters`, `correlationId`, `protocolVersion`.
- **Supported types:** `LOCOMOTION`, `ARM_X`, `ARM_Y`, `TORCH`, `ELECTROMAGNET`, `EMERGENCY_STOP`, `POSITION`.
This strict structure maps operational intent to actuator capability deterministically.

## 3. Telemetry Protocol
Telemetry payloads from the hardware carry:
- `source: 'HARDWARE'`
- `mode: 'LIVE'`
- `actuators` & `sensors`
This explicit envelope prevents live physical telemetry from being confused with Simulated Data, preventing digital twin pollution and preserving analytical truthfulness.

## 4. ACK Lifecycle
A Command in the backend is merely `PENDING`. Only the hardware gateway emits execution progress:
`RECEIVED` → `ACCEPTED` → `EXECUTING` → `ACKNOWLEDGED`.
Failure states include: `FAILED`, `REJECTED`, and `TIMED_OUT`.

## 5. E-Stop Boundary
The architecture defines two discrete E-Stops:
- **Software E-Stop:** Backend Command Center requesting cessation (emits `emergencyStop()` downward).
- **Physical Hardware E-Stop:** The physical button pressed on the robot payload (emits `onHardwareEmergencyStop` upward).
Software UI cannot fabricate physical E-Stop active states.

## 6. Connection States
The lifecycle accurately tracks physical connection continuity:
`DISCONNECTED` ↔ `CONNECTING` ↔ `CONNECTED` ↔ `DEGRADED` ↔ `FAULT` ↔ `STOPPED`.

## 7. Timeout Behavior
If physical hardware fails to emit an ACK after command transmission, the Gateway transitions the command state to `TIMED_OUT`. Timeout does *not* imply success, mitigating invisible actuator execution failures.

## 8. Idempotency
The gateway tracks `commandId`. If a duplicate network packet arrives attempting to replay a previously executed command, it is immediately `REJECTED` by the gateway adapter to prevent accidental actuator duplication (e.g. duplicate torch firing).

## 9. Simulation Adapter
`SimulationHardwareGateway` faithfully implements the `HardwareGateway` interface. It mimics the ACK latency (e.g. delaying `ACKNOWLEDGED`), explicitly rejects duplicates, supports `TIMED_OUT` evaluation, and triggers E-stops cleanly without physical payloads.

## 10. Security Boundary
The hardware gateway isolates physical robotics from web clients:
`Frontend (UI) → HTTP/Cookies → Backend Authentication → Server Safety Evaluator → DB CommandRecord → Hardware Gateway → ESP32`
There are no shortcuts that bypass authentication or backend safety interlocks.
