# Phase 1: Interactive 3D Digital Twin

## Objectives
Build the first interactive software prototype of a web-based digital twin for a magnetic tracked robot designed to move on a vertical steel ship hull and perform oxy-fuel cutting.

## Requirements Implemented
1. **Interactive 3D Digital Twin**: Rendered using Next.js, React Three Fiber, and Three.js.
2. **Coordinate System**: X-Y plane represents the vertical ship hull. +Z is outward from the ship hull, -Z is toward the ship hull.
3. **Track System**: Two tank-style continuous tracks with internal wheel structure and neodymium magnets on the track.
4. **Central Electromagnet**: Located underneath the robot body.
5. **Upper Structure**: A structural frame mounted above/around the robot body.
6. **Cutting Arm**: Exits from the robot's RIGHT SIDE (+X), moves vertically (+Y).
7. **Torch**: Simplified oxy-acetylene torch. Fixed orientation, points toward the ship hull along -Z.
8. **Gas Hoses**: Placeholder red and blue hoses.
9. **Ship Hull**: Large vertical steel plate on the X-Y plane.
10. **Camera Controls**: Isometric, Front, Top/debug, Side, and close-up presets.
11. **Interactive Controls**: Dev control panel to adjust sliders and toggles.
12. **Robot State Model**: Clean JSON state model for all controls and simulated values.
13. **Documentation**: Thorough documentation describing the current phase, future architecture, and coordinate systems.

## Not Implemented in Phase 1
- Real robot telemetry or backend connections
- Physical hardware integration (ESP32-S3)
- Real sensor readings or camera streaming
- AI/Predictive analytics or anomaly detection
- Real flame physics simulation
- Real CAD model (currently using configurable placeholders)
