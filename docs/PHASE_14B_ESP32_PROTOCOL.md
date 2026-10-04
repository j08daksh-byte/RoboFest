# PHASE 14B: ESP32 Hardware Protocol + Adapter Foundation

**Notice:** NO PHYSICAL HARDWARE COMMUNICATION IS IMPLEMENTED OR TESTED IN PHASE 14B.

This document defines the canonical application-layer protocol bridging the Robofest 6.0 Backend (`HardwareGateway`) to the eventual physical ESP32 firmware.

## 1. Protocol Architecture

The boundary isolates domain logic from serialized communication.

```
Frontend 
  → Backend API 
  → serverSafety (Deterministic Authority)
  → CommandRecord (Persisted State: PENDING)
  → HardwareGateway (Abstract Gateway)
  → Esp32ProtocolAdapter (Serialization / Deserialization boundary)
  → HardwareTransport (Interface - MOCKED)
  → (Future Physical Transport: WebSocket/Serial)
  → ESP32 Firmware
```

## 2. Protocol Core
- **Version:** `1.0.0`
- **Format:** JSON
- **Common Fields:** `protocolVersion`, `messageType`, `robotId`, `timestamp`, `messageId`

## 3. Supported Message Types
- `COMMAND`
- `COMMAND_ACK`
- `TELEMETRY`
- `HEARTBEAT`
- `EMERGENCY_STOP`
- `FAULT`

## 4. Command Specifications
Commands inherit exact strict parameters bounded by the canonical application validation model.

Supported Commands:
- `LOCOMOTION`: Validated spatial coordinate vectors
- `ARM_X`: Delta/Absolute X positioning
- `ARM_Y`: Delta/Absolute Y positioning
- `TORCH`: Boolean `enabled` toggle
- `ELECTROMAGNET`: Boolean `enabled` toggle
- `EMERGENCY_STOP`: Absolute interruption directive

*Arbitrary parameter injections are rejected via adapter validation.*

## 5. Hardware ACK Lifecycle
A physical hardware node MUST advance commands through the exact sequential states:
1. `RECEIVED`: Hardware consumed the message off the wire.
2. `ACCEPTED`: Command passes hardware-level validation.
3. `EXECUTING`: Hardware began physical action.
4. `ACKNOWLEDGED`: Hardware successfully completed physical action.

**Terminal Interruptions:**
- `FAILED`: Failure mid-execution.
- `REJECTED`: Failure during validation/acceptance.
- `TIMED_OUT`: Failed to achieve physical completion inside a bounded time window.

## 6. Telemetry Model
Telemetry represents the authoritative live state reported via sensors. Falsification or imputation of unavailable physical sensors is forbidden.

Fields (Current Implementation):
- `position`: Odometer/optical positioning
- `armState`: X/Y encoder positions
- `torchState`: True/False status
- `electromagnetState`: True/False status
- `motionState`: Active translation/rotation boolean, and velocity
- `power`: Battery voltage and current draw
- `temperature`: Thermal readings
- `emergencyState`: Active assertion indicator
- `faults`: Array of string faults

*Simulation telemetry must emit `mode: "SIMULATED"` (currently defined outside of ESP32 physical adapter protocol bounds).*

## 7. Connection Supervision
Connection state relies on active deterministic heartbeats.
- **Heartbeat Interval:** 1000ms
- **Degraded Threshold:** 3 missed intervals
- **Disconnected Threshold:** 10 missed intervals

States: `DISCONNECTED` | `CONNECTING` | `CONNECTED` | `DEGRADED` | `FAULT` | `STOPPED`

## 8. Hardware Emergency Stop
Physical button presses distinct from Software E-Stops trigger a `HARDWARE_E_STOP` telemetry event. The backend deterministic server handles correlation and locks application capability. Hardware overrides are never auto-cleared.

## 9. Hardware Faults
Categorized diagnostic states to support maintenance tracing:
Categories: `COMMUNICATION`, `MOTOR`, `TORCH`, `ELECTROMAGNET`, `POWER`, `TEMPERATURE`, `EMERGENCY_STOP`, `UNKNOWN`.

Severity Levels: `WARNING`, `CRITICAL`, `FATAL`

## 10. Adapter and Simulation Separation
- The `Esp32ProtocolAdapter` is exclusively for serializing and parsing to/from JSON strings. It NEVER modifies React `Zustand` state directly.
- Simulation operations never masquerade as `source = HARDWARE`.

## What Remains Unimplemented
- Physical ESP32 codebase (C++/Arduino)
- Physical Transport (Wi-Fi, Bluetooth, Serial) implementation of `HardwareTransport`
- Over-the-wire test executions (Mock string serialization validation was used instead).
