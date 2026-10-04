# PHASE 11B: TRANSPORT ARCHITECTURE

## 1. Transport Architecture
The transport layer provides a uniform abstraction between the UI state (`platformStore`, `robotState`) and the actual implementation of data exchange (currently simulated, eventually hardware). 

```text
UI (Command Center) 
      ↓
[ Robot Store ] --- (Intent) ---> [ Command Transport ]
      ↑                                 ↓
      |                           [ Network / Simulator ]
      |                                 ↓
      +------ (Acknowledgement) ---------
      
[ Telemetry Provider ] <--------- [ Network / Simulator ]
      ↓
[ Platform Store ] (Authoritative State)
```

## 2. Telemetry Flow
1. The **Telemetry Provider** (e.g., `SimulationTelemetryProvider`) emits typed `PlatformTelemetry` objects.
2. The provider binds to `usePlatformStore.getState().applyTelemetry()`.
3. The UI strictly reads from `usePlatformStore` (or `useRobotStore`). It is completely agnostic to whether the provider is `simulator.ts` or `mqttClient.ts`.

## 3. Command Flow
1. User clicks a UI element.
2. The UI invokes a `robotState` action (e.g., `setTorch(true)`).
3. The action performs synchronous safety interlock checks. If blocked, it logs and drops the command.
4. If permitted, it generates a `RobotCommand` and dispatches it via the `activeCommandTransport`.
5. The UI state registers this command as **PENDING**. It does NOT change the authoritative actuator state immediately.

## 4. Command Lifecycle
- **IDLE**: No command active.
- **PENDING**: Command dispatched to transport, awaiting hardware response.
- **ACKNOWLEDGED**: Transport/Hardware confirmed the command was accepted/executed.
- **REJECTED**: Transport/Hardware rejected the command (e.g., hardware-level safety).
- **FAILED**: Transport dropped the command (e.g., disconnected).
- **TIMED_OUT**: No acknowledgement received within the timeout window.

## 5. Simulation Transport
- `SimulationTelemetryProvider` wraps the original 1Hz `simulator.ts`, decoupling it from Zustand.
- `SimulationCommandTransport` intercepts canonical commands and uses a `setTimeout` to emulate network latency, returning an **ACKNOWLEDGED** state deterministically.

## 6. Safety Boundary
Safety is enforced synchronously in `robotState` before any command is generated. This is the **Deterministic Safety Interlock**.
Emergency Stop remains special: it is evaluated directly by the safety engine (which intercepts scenarios) and forces an immediate state transition without waiting for ordinary command acknowledgements.

## 7. Timeout/Failure Behavior
Commands dispatched to a disconnected transport immediately return **FAILED**. In the future hardware implementation, an internal timer will transition **PENDING** commands to **TIMED_OUT** if the ESP32 fails to respond.

## 8. Future ESP32 Integration Boundary
The future physical robot will simply require implementing:
`HardwareTelemetryProvider implements TelemetryProvider`
`HardwareCommandTransport implements CommandTransport`

## 9. Future WebSocket/MQTT Integration Point
The Next.js API or a standalone Node process will host the WS/MQTT server. The `HardwareTransport` implementations on the client side will connect to this server, preserving the exact same UI contracts.

## 10. State Authority Rules
- **Intent vs. Reality**: UI actions declare *intent*. Only hardware (or simulated hardware) acknowledgements dictate *reality*.
- No dual state stores: `platformStore` remains the sole owner of platform telemetry.
