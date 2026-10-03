# BACKEND COMMAND GATEWAY

## Overview
This document outlines the architecture for the Backend Command Gateway, the entry point for all physical robot commands transitioning from the frontend to the future hardware (ESP32) layer.

## Architecture

```text
Frontend/UI (Command Intents)
    ↓
Backend Command Gateway (API Route: /api/robot/command)
    ↓
Structural Validation (lib/api/commands.ts)
    ↓
Future Command Dispatcher (NOT IMPLEMENTED YET)
    ↓
Existing Platform Authority (Zustand: robotState.ts)
    ↓
Digital Twin / Future Hardware Adapter
```

## Current Implementation (What is implemented NOW)
1. **Server Command Model:** Typescript interfaces for the canonical commands defined in Phase 5A (`UPDATE_LOCOMOTION`, `SET_ARM_POSITION`, `SET_TORCH`, `SET_ELECTROMAGNET`, `TRIGGER_EMERGENCY_STOP`).
2. **Structural Validation:** A pure function `validateCommand` that ensures inbound API payloads have the correct schema, ID, timestamp, and payload types.
3. **API Boundary:** A Next.js App Router POST endpoint (`/api/robot/command`) that parses JSON, runs structural validation, and returns a deterministic `CommandResult` (`ACCEPTED` or `REJECTED`).

## Existing Authority (What is preserved)
- The backend currently **DOES NOT** mutate the existing `useRobotStore` directly. Zustand is client-side in our architecture.
- The platform's authoritative safety decisions (e.g., `safetyEngine.ts`, `movementPermission`) remain intact on the frontend simulator. We did not duplicate safety rules on the server.
- The UI continues to use the existing `robotState` mutators. 

## Future Scope (What remains FUTURE)
- **Command Dispatcher:** The logic to pipe an `ACCEPTED` command from the API route to a WebSocket/Hardware Adapter.
- **WebSocket Server:** Real-time bidirectional transport.
- **Hardware Integration:** The actual ESP32 firmware and physical serial connections.
- **Hardware Acknowledgements:** Real responses mapping physical outcomes (`EXECUTED`, `FAILED`) to the `CommandResult` model.

**Note:** This gateway establishes the structural schema contract. It does NOT claim WebSocket, ESP32, or real hardware readiness.
