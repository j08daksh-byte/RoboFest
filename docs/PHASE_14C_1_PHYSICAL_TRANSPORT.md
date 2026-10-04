# PHASE 14C-1: PHYSICAL TRANSPORT FOUNDATION

## Selected Transport
**TCP Socket** (`net.Socket`) with newline (`\n`) delimited JSON framing.

## Why it was selected
- Standard practice for ESP32 devices running on local Wi-Fi networks (RTOS).
- Extremely low overhead (unlike HTTP/WebSocket, avoiding heavy headers).
- Easy to frame reliably (reading up to `\n`).
- The `net` module in Node.js handles streaming buffer lifecycle effortlessly.

## Architecture
```
Frontend
↓ (HTTP/WS)
Backend API
↓
serverSafety (Deterministic Safety Rules)
↓
HardwareGateway (orchestrator tracking pending ACKs and mapping to PhysicalHardwareGateway)
↓
Esp32ProtocolAdapter (pure JSON string encoding/decoding and type guarding)
↓
TcpHardwareTransport (TCP socket buffer / framing)
↓ (TCP Port 5000)
ESP32 Physical Robot
```

## Message Framing Implementation
Messages are delimited by newline characters `\n`.
The `TcpHardwareTransport` accumulates raw TCP buffers into a string buffer. If the buffer exceeds `4096` bytes without encountering a newline, it is safely truncated to prevent unbounded memory exhaustion attacks (malformed packets).
Valid packets are sliced at `\n`, trimmed, and dispatched to the adapter.

## Connection States
Implementation adheres strictly to `HardwareConnectionState`:
- `DISCONNECTED`: Initial state. Disconnected intentionally or closed by peer.
- `CONNECTING`: Socket attempting to open TCP connection (5000ms timeout).
- `CONNECTED`: Valid TCP connection established.
- `FAULT`: Connection timed out or experienced socket error.

The transport does not infer UI logic or fabricate a connected state during simulated modes.

## Protocol Integration
- `PhysicalHardwareGateway` wraps the transport and the `Esp32ProtocolAdapter`.
- It registers an `onMessage` handler.
- It intercepts ACKs, verifying if the `commandId` is actively tracked in `pendingCommands`.
- If an ACK maps to an unknown command, it is logged and dropped without mutating backend state.

## Safety Boundary
- Server safety rules remain 100% deterministically governed by `serverSafety.ts`.
- The physical transport cannot be bypassed by the frontend.
- Incoming physical `EMERGENCY_STOP` packets trigger the `onHardwareEmergencyStop` gateway hook, which is structurally separate from software-driven E-stops.

## Loopback Implementation
A `MockHardwareTransport` acts as the loopback for simulation and automated testing. It simulates connection latency, deterministic disconnects, and physical buffer drops without using sockets.

## Physical Connection Requirements
- Network: Robot and command center must be on the same subnet (or routable IP).
- TCP Server/Client: Currently designed as TCP Client connecting to ESP32 Server (port 5000).

## Known Limitations
- The connection is unencrypted. Given the environment (isolated RoboFest Wi-Fi), this is acceptable for Phase 1.
- No auto-reconnect logic is bundled into the transport; connection management handles this upstream.

**NO PHYSICAL ESP32 CONNECTION HAS BEEN TESTED IN PHASE 14C-1.**
