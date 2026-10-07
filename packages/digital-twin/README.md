# @titan/digital-twin

## Purpose
This package defines the pure presentational boundary for the RoboFest Digital Twin. It is designed to be completely framework-agnostic and decoupled from any operational backend logic, allowing it to be safely embedded within both the RoboFest operational engine (for engineering/control) and the Senior web application (for real-time live monitoring and presentation).

## Architecture
This package establishes a **read-only presentation boundary**. 

- **TwinState Contract**: All visual components within this package MUST receive their dynamic data exclusively via the `TwinState` interface exposed through `TwinProvider`.
- **No Zustand**: This package does not import from RoboFest's Zustand stores.
- **No API Calls**: This package does not generate or dispatch commands.

### Authority
- **RoboFest Remains Authoritative**: The RoboFest application (`D:\Webs\Robofest`) retains 100% authority over robot physics simulation, human-in-the-loop safety logic, mission planning, and cutting command generation.
- **Senior Receives Telemetry**: The Senior unified dashboard shell (`D:\Webs\ship-cutter`) receives live robot state telemetry via the secure Server-Sent Events (SSE) gateway, blindly feeding that payload into this package's `TwinProvider` for read-only visualization.

## Current Status
**CONTRACT ONLY**: Currently, this package only establishes the dependency and context skeleton. The actual `react-three-fiber` components have not yet been moved out of `RoboFest/src/components/DigitalTwin`. Do NOT mount this package yet.
