# ROBOFEST 6.0 MASTER EXECUTION TRACK

This document is the SINGLE SOURCE OF TRUTH for the complete RoboFest 6.0 software platform, Digital Twin, backend, and hardware integration. It unifies all previous workstreams under a single master execution track.

## CRITICAL ARCHITECTURAL RULES

### 1. Data Ownership
- **ONE authoritative application state:** The Digital Twin renders authoritative platform state (`robotState.ts` / `platformStore.ts`); it does not duplicate robot truth.
- **Platform → Twin Data:** Robot position, orientation, locomotion, arm state, torch state, electromagnet, sensor state, safety, mission, cut paths, panel events, X-ray mode, alerts, telemetry.
- **Twin → Platform Data:** Cut completion polygons, physical cut metadata, geometry events, visual interactions.

### 2. Safety Architecture
**COMMAND → SAFETY ENGINE → AUTHORITATIVE STATE → DIGITAL TWIN / HARDWARE**
Safety remains 100% deterministic. AI may advise, recommend, and analyze, but AI MUST NOT bypass safety, directly activate actuators, override interlocks, or invent permissions.

### 3. Cutting Pipeline
PLAN → VALIDATE → SAFETY CHECK → HUMAN APPROVAL → TORCH ON → TRACE → CLOSED LOOP → HULL REGION REMOVED → PANEL DETACHMENT → GRAVITY FALL → INTERNAL STRUCTURE REVEALED → HISTORY → ANALYTICS.
*(Open paths without a closed loop do not remove material.)*

### 4. Data Realms
LIVE HARDWARE vs. SIMULATION vs. DEMO/HISTORICAL.
Invented data must never be presented as real hardware telemetry.

---

## INTEGRATION GATES

- **GATE 1: Core State & Safety Trustworthy** (Must precede Hardware Control)
- **GATE 2: Digital Twin Represents Authoritative State** (Must precede Visual Automation)
- **GATE 3: Cutting Behavior is Deterministic** (Must precede Cut Automation)
- **GATE 4: Backend Command Boundary Validated** (Must precede WebSockets)
- **GATE 5: Live Telemetry Contract Validated** (Must precede Sensor Hardware)
- **GATE 6: ESP32 Adapter Passes Safety Tests** (Must precede Physical Integration)
- **GATE 7: Real Robot ↔ Digital Twin Sync Passes**
- **GATE 8: Full Demo Passes Autonomously** (Without manual hidden interventions)

---

## EXECUTION PHASES

### PHASE 0 — BASELINE & ARCHITECTURE
- [✓] Project initialization and scaffolding
- [✓] Establish unidirectional state architecture (Zustand)
- [✓] Setup React Three Fiber rendering pipeline

### PHASE 1 — ROBOT STATE / COMMAND / SAFETY FOUNDATION
- [✓] `robotState.ts` creation
- [✓] `platformStore.ts` creation
- [✓] Safety Rules engine implementation
- [✓] Safety Engine deterministic pipeline
- [✓] Locomotion safety interlock
- [✓] Torch safety interlock
- [✓] Arm safety interlock
- [✓] Actuator command-boundary audit (Phase 4H completion)
- [✓] Robot command contract (Phase 5A completion)

### PHASE 2 — DIGITAL TWIN COMPLETION
- [✓] Robot 3D model & mechanical representation
- [✓] Ship Hull
- [✓] Shipyard / dry dock environment
- [✓] Support mast / pole
- [✓] Four primary support cables + Fourth lateral cable
- [✓] Oxy-acetylene cylinders
- [✓] Two hoses with proper routing
- [✓] Lighting and Materials
- [✓] Internal ribs / frames / stringers
- [ ] 3D camera system enhancements (Multiple perspectives)
- [ ] X-ray visualization refinements
- [ ] Visual mission/safety overlays

### PHASE 3 — PLATFORM ↔ DIGITAL TWIN CONTRACT
- [✓] One-way robot state mapping
- [✓] State-driven locomotion and arm positioning
- [✓] Twin-to-platform cut event publishing

### PHASE 4 — CUTTING ENGINE COMPLETION
- [✓] Continuous path tracing while Torch is ON
- [✓] Open path handling (no material removed)
- [✓] Closed loop detection
- [✓] Hull region removal based on loop
- [✓] Panel creation upon detachment
- [✓] Gravity/falling physics for detached panels
- [✓] Internal structure revelation
- [✓] Multiple independent cuts supported
- [✓] Cut path reset handling

### PHASE 5 — SENSOR / TELEMETRY / ENVIRONMENT
- [✓] Define unified sensor domain models
- [✓] Simulate basic IMU, Motors, Hardware, Gas
- [✓] Simulate Environmental factors (Temperature, Wind, etc)
- [✓] Gas rules / combustible hazard detection
- [✓] Telemetry state propagation to UI

### PHASE 6 — MISSION / SHIP / OPERATIONAL SYSTEMS
- [✓] Basic HMI Layout structure (Command Center)
- [ ] Advanced Mission planning and validation
- [ ] Human approval workflow for cut plans
- [ ] Ship/Hull metadata data management

### PHASE 7 — HEALTH / LIFETIME / MAINTENANCE / ANALYTICS
- [ ] Robot Passport (Lifetime statistics)
- [ ] Predictive maintenance logic
- [ ] Performance analytics
- [ ] Event/alert history timeline

### PHASE 8 — VISION / AI CUT STRATEGY / ROBO-ASSIST
- [ ] Vision-processing architecture skeleton
- [ ] Visual vision/camera presentation layer
- [ ] ROBO-ASSIST agent interface
- [ ] AI Cut Strategy engine (Advisory only)

### PHASE 9 — USERS / ROLES / NOTIFICATIONS / KNOWLEDGE BASE
- [ ] User roles & auth skeleton
- [ ] Platform-wide notifications
- [ ] Knowledge base / docs integration
- [ ] Emergency logic UI enhancements

### PHASE 10 — BACKEND / DATABASE / API
- [✓] Backend Command Gateway (Structural Validation API)
- [ ] API routes for telemetry history (Postgres/Supabase)
- [ ] Data persistence model

### PHASE 11 — LIVE TELEMETRY TRANSPORT
- [ ] WebSockets / Socket.io server implementation
- [ ] Bidirectional transport layer setup
- [ ] Live telemetry contract validation (Gate 5)

### PHASE 12 — ESP32 HARDWARE ADAPTER
- [ ] Implement ESP32 adapter mapping canonical commands
- [ ] Translation of Commands -> ESP32 format
- [ ] Hardware error/acknowledgement handling
- [ ] Safety tests against adapter (Gate 6)

### PHASE 13 — REAL ROBOT ↔ DIGITAL TWIN LOOP
- [ ] Ingest physical ESP32 state into `platformStore`
- [ ] Physical location mapping to Digital Twin
- [ ] Hardware sensor telemetry rendering
- [ ] Communication-loss handling behavior

### PHASE 14 — END-TO-END SAFETY / HARDWARE VALIDATION
- [ ] Full physical actuator testing
- [ ] Hardware E-Stop verification
- [ ] Disconnect / Timeout fallback verification

### PHASE 15 — GUIDED DEMO / ROBOFEST RELEASE
- [ ] Demo orchestration engine
- [ ] Visual sequence: Shipyard overview → robot approach → magnetic adhesion → sensor activation
- [ ] Visual sequence: Mission start → safety check → cutting → panel fall
- [ ] Final polish & UI cleanup
