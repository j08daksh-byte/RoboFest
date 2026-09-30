# Future Architecture

This document describes the planned architecture for connecting the physical robot to this digital twin.

## Data Flow
ESP32-S3 (Physical Robot)
    ↓
Wi-Fi / Communication Protocol
    ↓
Backend
    ↓
WebSocket
    ↓
Frontend (Next.js Application)
    ↓
Digital Twin (3D Visualization)

## Implementation Guidelines
- The frontend should consume a `RobotState` object.
- The 3D scene should not be directly coupled to ESP32 code.
- Ensure the architecture makes it easy to replace placeholder geometries with real CAD-derived GLB/GLTF models (`/public/models/robot.glb`).
