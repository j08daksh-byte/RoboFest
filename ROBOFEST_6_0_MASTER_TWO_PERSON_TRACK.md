# ROBOFEST 6.0 MASTER TWO-PERSON TRACK

## ARCHITECTURE BOUNDARIES

The project is executed via two strict, non-overlapping tracks.

**TRACK A (ANSHIKA MA'AM): DIGITAL TWIN + VISUALIZATION**
Owns the 3D world, robot rendering, ship geometry, safety visualization, and camera mechanics. Render-only. No business logic ownership.

**TRACK B (DAKSH): PLATFORM + SOFTWARE BRAIN**
Owns the Next.js shell, authoritative platform state, safety engine, cutting planner, sensor simulation, and integration adapters. No 3D remodeling.

## INTEGRATION GATES

- **GATE 1: Baseline Check** - Both branches compile independently.
- **GATE 2: Platform Interface Approved** - Track B publishes integration endpoints.
- **GATE 3: Twin Interface Approved** - Track A publishes rendering hooks.
- **GATE 4: Command Center Integration** - Command Center consumes Twin safely.
- **GATE 5: Cut Planner Integration** - Cut planner coordinates → Twin visualizer.
- **GATE 6: Safety Integration** - Safety state → Twin visual alarms.
- **GATE 7: Mission Integration** - Mission progress → Twin state.
- **GATE 8: Guided Demo** - End-to-end orchestration flow complete.
- **GATE 9: Full Regression** - System-wide testing across resolutions.
- **GATE 10: Final Release** - Production deploy.

## COMPLETE PRODUCT MODULE CHECKLIST

1. Command Center: PARTIAL
2. Robot Digital Twin: PARTIAL
3. Live Sensor Center: PARTIAL
4. Safety & Hazard Center: PARTIAL
5. Weather & Site Safety: PARTIAL
6. Cutting Planner: PARTIAL
7. AI Cut Strategy: NOT STARTED
8. Vision / Camera Center: PARTIAL
9. ROBO-ASSIST: NOT STARTED
10. Robot Health: PARTIAL
11. Predictive Maintenance: NOT STARTED
12. Robot Passport: PARTIAL
13. Mission Management: PARTIAL
14. Ship / Hull Map: NOT STARTED
15. Internal Ship Structure: PARTIAL
16. Material / Cut Analytics: NOT STARTED
17. Robot Telemetry: PARTIAL
18. Emergency Control: PARTIAL
19. Digital Shipyard: NOT STARTED
20. Event / Alert History: PARTIAL
21. Maintenance Log: NOT STARTED
22. Performance Analytics: NOT STARTED
23. User Roles: NOT STARTED
24. Smart Notifications: PARTIAL
25. Robot Knowledge Base: NOT STARTED
26. Guided Demo: NOT STARTED
27. Backend/API: NOT STARTED
28. ESP32 integration: NOT STARTED
29. Final release: NOT STARTED

## FINAL ROBOFEST DEMO REQUIREMENT

The final presentation must communicate:
PROBLEM → ROBOT → DIGITAL TWIN → SAFETY → MISSION → CUTTING → AI → TELEMETRY → STRUCTURE → PANEL REMOVAL → SAFETY EVENT → RECOVERY → ANALYTICS → ROBOT LIFETIME RECORD.

## DEFINITION OF DONE

A task is DONE only when applicable:
- [ ] implementation
- [ ] unit/integration tests
- [ ] lint
- [ ] build
- [ ] runtime verification
- [ ] visual verification
- [ ] no regression
- [ ] documentation
- [ ] commit
- [ ] push
- [ ] merge at integration gate
