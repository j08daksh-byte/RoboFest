# PLATFORM INTEGRATION INTERFACE (TRACK B)

**OWNER:** DAKSH (TRACK B)
**CONSUMER:** ANSHIKA MA'AM (TRACK A)

This document defines the authoritative state contracts exposed by the Software Platform for the Digital Twin to consume and render.

## 1. ROBOT STATE CONTRACT
*(To be populated by Track B)*
- Position (X, Y, Z)
- Orientation (Heading, Pitch, Roll)
- Arm Extension (X, Y, Z)
- Magnet State (True/False)
- Torch State (Ignited/Off)
- Power State (Cable Connected True/False, No Battery)

## 2. SAFETY & MISSION CONTRACT
*(To be populated by Track B)*
- Current Safety Level (NORMAL, WARNING, CRITICAL, EMERGENCY_STOP)
- Active Mission State (ID, Progress, Status)
- Weather Status (Clear, High Wind, Rain)

## 3. CUTTING & SENSOR CONTRACT
*(To be populated by Track B)*
- Planned Cut Coordinates
- Validated Cut Sequence
- Live Telemetry (IMU, Motors, Gas flow)

## RULES
Track A MUST NOT edit this file. If changes are required, Track B updates it based on integration needs. The platform state is the single source of truth; Track A only reads from it.
