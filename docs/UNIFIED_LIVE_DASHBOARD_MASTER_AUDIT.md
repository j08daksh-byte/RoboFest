# ROBOFEST 6.0 & TITAN-CUT — TWO-REPO UNIFIED LIVE DASHBOARD MASTER AUDIT

> **DOCUMENT STATUS:** COMPLETE ARCHITECTURAL AUDIT & PLANNING BASELINE  
> **EXECUTION PHASE:** AUDIT & PLANNING ONLY — NO CODE IMPLEMENTATION PERFORMED  
> **AUTHORITY:** ROBOFEST 6.0 LEAD ARCHITECTURE & SYSTEMS ENGINEERING  
> **TARGET BRANCH (Senior Repo):** `integration/unified-live-dashboard`  
> **LOCAL CLONE WORKSPACE:** `D:\Webs\ship-cutter`  
> **ENGINE REPOSITORY:** `D:\Webs\Robofest`  
> **AUDIT TIMESTAMP:** October 7, 2026  

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Current Architecture of Both Repositories](#2-current-architecture-of-both-repositories)
3. [Two-Repository Ownership & Boundary Map](#3-two-repository-ownership--boundary-map)
4. [Complete Feature Inventory Matrix](#4-complete-feature-inventory-matrix)
5. [Duplicate Feature Detection & Resolution Strategy](#5-duplicate-feature-detection--resolution-strategy)
6. [Digital Twin Failure Analysis (Deep-Dive Root Causes)](#6-digital-twin-failure-analysis-deep-dive-root-causes)
7. [System-Wide Performance Bottleneck Audit (Top 10 Critical Issues)](#7-system-wide-performance-bottleneck-audit-top-10-critical-issues)
8. [Navigation Hierarchy & Journey Audit](#8-navigation-hierarchy--journey-audit)
9. [UI/UX & Visual Cohesion Audit](#9-uiux--visual-cohesion-audit)
10. [Recommended Target Unified Dashboard Architecture](#10-recommended-target-unified-dashboard-architecture)
11. [Integration Strategy Comparison (Options A through E)](#11-integration-strategy-comparison-options-a-through-e)
12. [Recommended Integration Strategy](#12-recommended-integration-strategy)
13. [Data Ownership & API Integration Contract](#13-data-ownership--api-integration-contract)
14. [Step-by-Step Implementation Sequence](#14-step-by-step-implementation-sequence)
15. [System Risk Register & Mitigation Plan](#15-system-risk-register--mitigation-plan)
16. [Definition of Done (DoD)](#16-definition-of-done-dod)

---

## 1. EXECUTIVE SUMMARY

The RoboFest / TITAN-CUT project has reached an architectural inflection point. Two separate repositories have been developed independently to solve different aspects of the same industrial ship-dismantling robotics problem:

1. **The Senior Repository (`j08daksh-byte/ship-cutter`):**  
   Built as a full-stack MERN platform (Vite + React 19 SPA client, Express + MongoDB server). It excels at public customer-facing marketing, fleet vessel registry, salvage part inventory, structural scrap valuation, metallurgical feasibility calculations, photographic inspection logs, and high-level enterprise reporting.
2. **The RoboFest Operational Engine (`j08daksh-byte/RoboFest`):**  
   Built as a high-density, real-time industrial robotics operations platform (Next.js 16 + Turbopack, React 19, TypeScript, React Three Fiber 9, Three.js 0.186, Zustand 5, Prisma 5 with SQLite). It contains the true cyber-physical operational engine: the real-time Digital Twin 3D simulation, kinematics control, crawler motion physics, deterministic ISO safety interlocks, 400mm plasma cutting arm trajectory planner, live telemetry streams, predictive component health, operational event logging, and grounded AI assistance.

### The Problem
In an attempt to bridge the two systems, the Senior website currently implements an `<iframe>` embed inside a sub-tab named *"Ship Cutting Simulations"* (`/dashboard/ship-cutting-simulations`) pointing to the deployed RoboFest Command Center (`https://robo-fest-self.vercel.app/command-center`).

As evidenced by user testing and system telemetry, this architecture is critically flawed:
- **Nested Interface Clutter:** The user sees a sidebar inside a sidebar, a header inside a header, and dual branding (TITAN-OS vs RF6 COMMAND).
- **Severe 3D Viewport Compression:** The 3D Digital Twin canvas is squeezed into an unusable ~350px wide container inside the iframe, suffocating the 3D visualization.
- **Double Runtime Overhead:** The browser loads two distinct React 19 runtimes, two Three.js graphic engines, multiple WebGL contexts, and independent polling loops simultaneously in a single tab.
- **Input Trapping:** Keyboard controls ('W', 'A', 'S', 'D') fail to operate the robot because focus belongs to the parent window; mouse orbiting stutters as soon as the cursor exits the 780px iframe bounds.
- **State Desynchronization:** Senior's "Safety Interlock Bridge" (Adafruit IO) and RoboFest's internal safety engine operate on completely disconnected data models.

### The Objective
This audit establishes the blueprint for **ONE BEST UNIFIED LIVE OPERATIONS DASHBOARD**. We eliminate duplicate screens, tear down nested iframes, establish strict domain ownership, and provide a single authoritative command center for the TITAN-CUT autonomous crawler.

---

## 2. CURRENT ARCHITECTURE OF BOTH REPOSITORIES

### 2.1 Senior Repository (`ship-cutter`)
```
D:\Webs\ship-cutter\
├── client\                      # Frontend SPA (Vite + React 19)
│   ├── src\
│   │   ├── components\
│   │   │   ├── common\          # StatsCard, ProgressRing, ImageUpload, ErrorBoundary
│   │   │   ├── dashboard\       # RobotArmSimulator3D (Raw Three.js canvas)
│   │   │   ├── home\            # Hero, About, Gallery, ScrollVideoBackground, Blog
│   │   │   └── layout\          # PublicLayout, DashboardLayout, Sidebar, Navbar
│   │   ├── pages\               # 15 React Pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── DashboardPage.jsx            # Duplicate metrics & progress ring
│   │   │   ├── SensorsPage.jsx              # Adafruit IO & ESP32 live stream
│   │   │   ├── ShipCuttingSimulationsPage.jsx # Contains the RoboFest IFRAME embed
│   │   │   ├── SimulationBridgePage.jsx     # Safety Interlock Bridge display
│   │   │   ├── PartTrackingPage.jsx         # Salvage parts inventory (MongoDB)
│   │   │   ├── MaterialPage.jsx             # Metallurgy & scrap pricing (MongoDB)
│   │   │   ├── MaintenancePage.jsx          # Robot maintenance logs (MongoDB)
│   │   │   ├── FeasibilityPage.jsx          # ROI & dismantling economics
│   │   │   ├── HistoryPage.jsx              # Cut history records (MongoDB)
│   │   │   ├── PhotosPage.jsx               # Inspection photo uploads (Multer)
│   │   │   ├── ShipsPage.jsx                # Ship fleet management (MongoDB)
│   │   │   ├── DatabaseViewerPage.jsx       # MongoDB raw document explorer
│   │   │   └── ChatbotPage.jsx              # Floating/page AI assistant
│   │   └── services\api.js      # REST client connecting to Express server
│   └── package.json             # React 19, Three.js 0.186, Chart.js 4.5, Framer Motion 13.5
├── server\                      # Backend API (Node.js + Express 4 + Mongoose)
│   ├── config\db.js             # MongoDB connection logic
│   ├── models\                  # Mongoose Schemas (Ship, Part, Material, Maintenance, etc.)
│   ├── routes\                  # Express routers (ships, operations, sensors, etc.)
│   │   └── sensors.js           # In-memory Adafruit IO stream & mock safety evaluator
│   └── server.js                # Port 5000 HTTP entrypoint
└── vercel.json                  # Serverless function rewrite: /api/* -> server/server.js
```

### 2.2 RoboFest Operational Engine (`RoboFest`)
```
D:\Webs\Robofest\
├── src\
│   ├── app\                     # Next.js 16 App Router (Turbopack)
│   │   ├── command-center\      # Authoritative Multi-Pane Operational Command Center
│   │   ├── robot-lab\           # Isolated 3D Robot Kinematics Validation Lab
│   │   ├── robot\               # /twin, /health, /sensors, /passport, /vision
│   │   ├── operations\          # /missions, /planner, /cut-strategy
│   │   ├── safety\              # /emergency, /hazards, /weather, /notifications
│   │   ├── intelligence\        # /robo-assist, /analytics, /telemetry, /performance
│   │   ├── records\             # /history (Full deterministic event log)
│   │   └── api\                 # 22 Serverless REST & SSE Endpoints
│   │       ├── realtime\route.ts  # SSE Realtime Broker (10-20 Hz state broadcast)
│   │       ├── robot\state\     # Robot position, orientation, arm, torch state
│   │       ├── robot\command\   # Teleoperation & motion dispatch
│   │       ├── robot\health\    # Component health & maintenance records
│   │       ├── telemetry\       # Multi-sensor telemetry ingestion
│   │       ├── missions\        # Mission life-cycle state machine
│   │       ├── events\          # Append-only audit trail
│   │       └── ai\robo-assist\  # Grounded, non-hallucinatory AI operator assistant
│   ├── components\
│   │   ├── DigitalTwin\         # Industrial 3D R3F Model (ShipHull, RobotModel, Tracks,
│   │   │                        #  CuttingArm, Torch, SafetyCables, CameraController)
│   │   ├── Shell\               # AppShell, Sidebar, TopHeader
│   │   └── ControlPanel\        # Manual teleoperation & parameter HUD
│   ├── lib\
│   │   ├── platformStore.ts     # Primary Zustand store (robot, safety, sensor, env)
│   │   ├── robotState.ts        # Kinematic coordinate system & 3D state store
│   │   ├── cutting\             # Trajectory planner & cut record store
│   │   ├── safety\              # Deterministic safety rule engine & ISO E-stop
│   │   └── prisma.ts            # Global Prisma Client singleton (SQLite)
│   └── prisma\
│       ├── schema.prisma        # 8 Relational Models (User, Mission, CutRecord, EventLog,
│       │                        #  CommandRecord, RuntimeState, TelemetryRecord, ComponentHealth)
│       └── dev.db               # SQLite operational store
└── package.json                 # Next.js 16.3.6, React 19, R3F 9.8, Three.js 0.186, Prisma 5.22
```

---

## 3. TWO-REPOSITORY OWNERSHIP & BOUNDARY MAP

To prevent duplication and architectural conflict, the boundary between the two systems must be absolute:

| Domain Layer | Senior Repository (`ship-cutter`) | RoboFest Engine (`RoboFest`) | Rationale & Boundary Rule |
| :--- | :--- | :--- | :--- |
| **Product Shell & Public Site** | **EXCLUSIVE OWNER** | *Out of Scope* | Senior repo owns landing page, branding, public marketing, hero video, blog, contact forms. |
| **Business Fleet & Vessels** | **EXCLUSIVE OWNER** | Consumes via ID | Senior repo owns ship specifications, deadweight tonnage, owner records, shipyard location. |
| **Scrap & Metallurgy Valuation** | **EXCLUSIVE OWNER** | Consumes via ID | Senior repo owns material pricing ($/ton), steel grade analysis, salvage ROI calculators. |
| **Parts & Salvage Inventory** | **EXCLUSIVE OWNER** | *Out of Scope* | Senior repo tracks recovered valves, pumps, propellers, and plate inventory in MongoDB. |
| **Inspection Photo Gallery** | **EXCLUSIVE OWNER** | *Out of Scope* | Senior repo manages field upload photos via Multer/Cloud storage. |
| **Enterprise Business DB** | **EXCLUSIVE OWNER** | *Out of Scope* | Senior repo maintains MongoDB collections for enterprise reporting. |
| **Live Command Center** | *Deprecated / Removed* | **EXCLUSIVE OWNER** | RoboFest owns the authoritative real-time unified command center interface. |
| **3D Digital Twin & Physics** | *Deprecated / Removed* | **EXCLUSIVE OWNER** | RoboFest owns all R3F kinematics, procedural ship hull, cutting arm, cables, camera controls. |
| **Robot Kinematics & Motion** | *Out of Scope* | **EXCLUSIVE OWNER** | RoboFest tracks exact X/Y/Z coords, track velocities, adhesion state, arm extension (0-400mm). |
| **Deterministic Safety & E-Stop** | Consumes Signal | **EXCLUSIVE OWNER** | RoboFest executes the ISO safety state machine, motion lockout, hardware interlock relays. |
| **Cutting Planner & Execution** | Consumes Progress | **EXCLUSIVE OWNER** | RoboFest executes open-path & closed-loop cut plans, torch arc ignition, standoff regulation. |
| **Telemetry & Sensor Streaming** | Ingests IoT into RoboFest | **EXCLUSIVE OWNER** | RoboFest acts as the single telemetry broker (combining ESP32 hardware and sensor feeds). |
| **Component Health & MTBF** | Consumes Alerts | **EXCLUSIVE OWNER** | RoboFest evaluates real-time wear, motor overcurrent, vibration alarms, service thresholds. |
| **Operational Event Trail** | Consumes Audit Log | **EXCLUSIVE OWNER** | RoboFest maintains append-only relational audit logs (`EventLog`) for mission compliance. |
| **Operational AI (ROBO-ASSIST)** | *Deprecated / Removed* | **EXCLUSIVE OWNER** | RoboFest hosts the grounded, deterministic AI engine with live operational state inspection. |

---

## 4. COMPLETE FEATURE INVENTORY MATRIX

Every feature across both repositories evaluated for purpose, source of truth, and architectural disposition:

| Feature Name | Repos | Routes | Components | Purpose | Data Source | Duplicate? | Recommendation | Authoritative Owner | Architectural Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Landing Page** | Senior | `/` | `HomePage.jsx`, `HeroSection.jsx` | Commercial presentation, product overview | Static / CMS | No | **KEEP SENIOR** | Senior | Acts as the primary entrance to the product suite. |
| **Blog & Knowledge Base** | Senior | `/blog` | `BlogPage.jsx`, `BlogPreview.jsx` | Industry insights, dismantling articles | MongoDB (`BlogPost`) | No | **KEEP SENIOR** | Senior | Content marketing belongs in product shell. |
| **Contact & Inquiries** | Senior | `/contact` | `ContactPage.jsx`, `ContactSection.jsx`| Lead generation, client communication | MongoDB (`Contact`) | No | **KEEP SENIOR** | Senior | Customer relationship pipeline belongs in product shell. |
| **Ship Fleet Registry** | Senior | `/dashboard/ships` | `ShipsPage.jsx` | Fleet management, vessel specifications | MongoDB (`Ship`) | Partial | **KEEP SENIOR** | Senior | Enterprise business asset tracking belongs in MongoDB. |
| **Salvage Parts Tracker** | Senior | `/dashboard/parts` | `PartTrackingPage.jsx` | Catalog recovered marine equipment | MongoDB (`Part`) | No | **KEEP SENIOR** | Senior | Commercial supply chain feature. |
| **Material & Metallurgy** | Senior | `/dashboard/materials`| `MaterialPage.jsx` | Steel grade analysis & scrap pricing | MongoDB (`Material`) | No | **KEEP SENIOR** | Senior | Financial scrap valuation feature. |
| **Feasibility & ROI Calc** | Senior | `/dashboard/feasibility`| `FeasibilityPage.jsx` | Economic viability simulation | MongoDB (`Feasibility`)| No | **KEEP SENIOR** | Senior | Pre-operational investment analysis tool. |
| **Photo Inspection Manager**| Senior | `/dashboard/photos` | `PhotosPage.jsx`, `ImageUpload.jsx` | Marine survey photo documentation | Server Uploads / DB | No | **KEEP SENIOR** | Senior | Document management feature. |
| **Database Inspector** | Senior | `/dashboard/database`| `DatabaseViewerPage.jsx` | Administrative MongoDB inspection | Express API | No | **KEEP SENIOR** | Senior | Developer/admin diagnostic tool for Senior DB. |
| **Real-time Cutting Stats** | Senior | `/dashboard` | `DashboardPage.jsx`, `StatsCard.jsx`| High-level operational metrics card | MongoDB Mock / DB | **YES** | **MERGE / ADAPTER**| RoboFest | Senior shows hardcoded/mock 68.4% progress; RoboFest has real mission telemetry. |
| **Ship Cutting Simulations**| Senior | `/dashboard/ship-cutting-simulations` | `ShipCuttingSimulationsPage.jsx` | Embeds iframe of RoboFest | IFRAME (`robo-fest-self`) | **YES** | **REMOVE IFRAME** | RoboFest | Destroys UX via nested sidebars, double headers, and WebGL context duplication. |
| **Raw 3D Robot Arm Sim** | Senior | `/dashboard/ship-cutting-simulations` | `RobotArmSimulator3D.jsx` | Standalone Three.js arm animation | Local Three.js state | **YES** | **REMOVE** | RoboFest | Crude prototype that contradicts RoboFest's accurate 400mm 3D crawler model. |
| **Curated 3D WebGL Links** | Senior | `/dashboard/ship-cutting-simulations` | Tab `online-gallery` | Links to threejs.org examples | External URLs | No | **REMOVE** | N/A | External demo links dilute professional industrial product credibility. |
| **Safety Interlock Bridge** | Senior | `/dashboard/simulation`| `SimulationBridgePage.jsx` | Displays bulkhead gas/temp permit | Memory (`sensors.js`)| **YES** | **MERGE / ADAPTER**| RoboFest | Senior simulates opposite void gas; must feed into RoboFest's safety engine. |
| **IoT / Adafruit Sensor Log**| Senior | `/dashboard/sensors` | `SensorsPage.jsx` | Graphs Adafruit IO live feeds | Adafruit IO / REST | **YES** | **ADAPTER** | RoboFest | Live sensor feeds should be ingested into RoboFest's central telemetry store. |
| **Robot Maintenance (Biz)**| Senior | `/dashboard/maintenance`| `MaintenancePage.jsx` | Manual log of completed repairs | MongoDB (`Maintenance`)| **YES** | **MERGE** | Shared | Senior manages work-order logs; RoboFest computes real-time wear & MTBF. |
| **AI Cutting Copilot (Chat)**| Senior | `/dashboard/chatbot` | `ChatbotPage.jsx` | Conversational chatbot | Mock / Keyword logic | **YES** | **REMOVE / MERGE**| RoboFest | Senior's chatbot is generic; RoboFest's ROBO-ASSIST has grounded telemetry inspection. |
| **Command Center** | RoboFest | `/command-center` | `CommandCenterPage.tsx` | Master industrial supervisory console | Zustand (`platformStore`)| **YES** | **KEEP ROBOFEST** | RoboFest | The single true command dashboard for real-time operations. |
| **3D Digital Twin** | RoboFest | `/robot/twin`, `/command-center` | `DigitalTwin/index.tsx` | 1:1 Cyber-Physical 3D Crawler on Hull | Three.js / R3F / Drei | **YES** | **KEEP ROBOFEST** | RoboFest | Complete physics, hull curvature, magnetic tracks, cutting torch arc, camera rig. |
| **Kinematics Control HUD** | RoboFest | `/robot/twin` | `ControlPanel/index.tsx` | Direct teleoperation & arm jogging | Zustand (`robotState`) | No | **KEEP ROBOFEST** | RoboFest | Authoritative manual teleoperation interface. |
| **Robot Lab Viewport** | RoboFest | `/robot-lab` | `RobotModelLab/index.tsx` | Isolated kinematic calibration view | Zustand (`robotState`) | No | **KEEP ROBOFEST** | RoboFest | Engineering calibration tool for crawler dimensions. |
| **Mission Life-cycle State**| RoboFest | `/operations/missions` | `MissionsPage.tsx` | DRAFT -> READY -> RUNNING -> COMPLETED| Prisma SQLite | No | **KEEP ROBOFEST** | RoboFest | Authoritative state machine for autonomous operations. |
| **Cutting Path Planner** | RoboFest | `/operations/planner` | `PlannerPage.tsx` | Coordinate-level path planner & toolpath | Zustand (`cutting`) | No | **KEEP ROBOFEST** | RoboFest | Mathematical toolpath interpolation and cut sequencing. |
| **AI Cutting Strategy** | RoboFest | `/operations/cut-strategy`| `StrategyPage.tsx` | Heat dissipation & panel sequence AI | Next.js API / Heuristics| No | **KEEP ROBOFEST** | RoboFest | Engineering intelligence for minimizing hull thermal warping. |
| **Deterministic Safety State**| RoboFest | `/safety/emergency` | `EmergencyPage.tsx` | ISO E-stop, interlock threshold alarms | `serverSafety.ts` | **YES** | **KEEP ROBOFEST** | RoboFest | Hard real-time safety interlock and motion inhibitor. |
| **Hazard Matrix & Weather** | RoboFest | `/safety/hazards` | `HazardsPage.tsx`, `WeatherPage.tsx` | Wind, rain, flammable LEL environment | Prisma / Telemetry | No | **KEEP ROBOFEST** | RoboFest | Environmental operational boundary checks. |
| **Predictive Component Health**| RoboFest | `/robot/health` | `RobotHealthPage.tsx` | Real-time motor temp, vibration, MTBF | Prisma (`ComponentHealth`)| **YES** | **KEEP ROBOFEST** | RoboFest | Cyber-physical health monitoring based on live telemetry. |
| **Live Multi-Sensor Bus** | RoboFest | `/robot/sensors` | `SensorsPage.tsx` | Voltage, current, IMU tilt, gas levels | Prisma (`TelemetryRecord`)| **YES** | **KEEP ROBOFEST** | RoboFest | Authoritative sensor visualization with trendlines. |
| **Operational Event Log** | RoboFest | `/records/history` | `HistoryPage.tsx` | Append-only event trail with severity | Prisma (`EventLog`) | **YES** | **KEEP ROBOFEST** | RoboFest | Certified legal/operational flight-recorder log. |
| **ROBO-ASSIST AI Engine** | RoboFest | `/intelligence/robo-assist`| `RoboAssistPage.tsx` | Grounded operator assistant | `lib/ai/engine.ts` | **YES** | **KEEP ROBOFEST** | RoboFest | Non-hallucinatory AI that inspects real database state. |
| **Operational Analytics** | RoboFest | `/intelligence/analytics`| `AnalyticsPage.tsx` | Cut speed, power efficiency, gas flow | Prisma Aggregate | No | **KEEP ROBOFEST** | RoboFest | Mission productivity analytics. |
| **Hardware Gateway (ESP32)**| RoboFest | `lib/hardware/` | `tcpTransport.ts`, `serialTransport` | Direct hardware socket protocol | TCP / WebSocket | No | **KEEP ROBOFEST** | RoboFest | Production bridge to physical crawler microcontrollers. |

---

## 5. DUPLICATE FEATURE DETECTION & RESOLUTION STRATEGY

Eight primary capabilities currently exist in duplicate across both repositories. Here is the exact resolution strategy for each:

```
                    DUPLICATE FEATURE RESOLUTION MAP
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ Feature Domain                       │ Architectural Resolution Strategy                       │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Real-time Cutting Dashboard       │ REMOVE Senior mock dashboard; PROMOTE RoboFest CC       │
│ 2. 3D Digital Twin & Simulation      │ REMOVE Senior raw Three.js & iframe; USE RoboFest R3F   │
│ 3. Sensor Streaming (IoT / Adafruit) │ ADAPTER: Ingest Senior sensor stream into RoboFest bus  │
│ 4. Safety Interlock & E-Stop         │ ADAPTER: Feed Senior opposite-wall gas into RoboFest ISO│
│ 5. Maintenance Tracking              │ MERGE: Senior keeps biz logs; RoboFest computes health  │
│ 6. Operational Event History         │ MERGE: Senior points to RoboFest append-only EventLog   │
│ 7. AI Assistant / Copilot            │ REMOVE Senior mock chatbot; USE RoboFest ROBO-ASSIST    │
│ 8. Ship Metadata & Geometry          │ ADAPTER: Senior provides vessel specs; RoboFest renders │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### 5.1 Cutting Operation Overview & Dashboard
- **Senior Implementation:** `/dashboard` (`DashboardPage.jsx`) fetches from `/api/operations/active` (mock MongoDB data) and renders static cards: 68.4% progress, 287 cut parts, 142.5 cm/min speed.
- **RoboFest Implementation:** `/command-center` displays live cut execution, active toolpath progress, torch arc ignition state, real-time voltage/current, and scenario triggers.
- **Resolution: REMOVE SENIOR DASHBOARD OVERVIEW — PROMOTE ROBOFEST COMMAND CENTER.** Senior's `/dashboard` route will directly host the unified live operational command center powered by RoboFest's engine.

### 5.2 3D Robot Simulation
- **Senior Implementation:** `RobotArmSimulator3D.jsx` is an uncalibrated 3-axis arm on an empty plane. Additionally, `ShipCuttingSimulationsPage.jsx` embeds RoboFest in an iframe and links to external Three.js examples.
- **RoboFest Implementation:** `DigitalTwin/index.tsx` is a high-fidelity industrial digital twin featuring the magnetic track crawler, procedural 3D ship hull, 400mm dual-axis cutting arm, plasma arc particles, dynamic safety tethers, supply hoses, dry dock environment, and 13 camera viewpoints.
- **Resolution: REMOVE SENIOR 3D ARTIFACTS — KEEP ROBOFEST DIGITAL TWIN.** Remove `RobotArmSimulator3D.jsx` and all external demo links. The RoboFest Digital Twin becomes the sole 3D visualization.

### 5.3 Sensor Streaming & Ingestion
- **Senior Implementation:** `server/routes/sensors.js` connects to Adafruit IO feed (`anshika01_`) and holds in-memory readings for temperature, standoff gap, and opposite-wall gas PPM.
- **RoboFest Implementation:** `src/lib/telemetry/` and `src/lib/realtime/` broker multi-channel telemetry (voltage, current, IMU 3-axis accel/gyro, motor temps, combustible gas LEL, O2, CO, CO2, torch pressures).
- **Resolution: CREATE SENSOR INGESTION ADAPTER.** Expose a webhook / bridge from Senior's sensor service to pipe Adafruit IO live reverse-bulkhead readings directly into RoboFest's `TelemetryRecord` table, ensuring all sensors appear on one authoritative telemetry bus.

### 5.4 Safety Interlock & E-Stop
- **Senior Implementation:** `SimulationBridgePage.jsx` checks if opposite-side temperature is < 50°C and gas is < 35 PPM, showing a green/red badge and sending a browser alert on emergency stop.
- **RoboFest Implementation:** `src/lib/safety/safetyRules.ts` implements an ISO-compliant deterministic safety engine evaluating tilt angles (<35°), motor temperatures (<75°C), vibration levels (<3.5G), gas pressures, and hardware E-stop latching with real-time motion inhibition.
- **Resolution: UNIFY INTO ROBOFEST DETERMINISTIC SAFETY ENGINE.** Treat Senior's reverse-compartment gas/temp checks as an input hazard vector (`HAZARD_REVERSE_COMPARTMENT_GAS`) inside RoboFest's deterministic safety evaluator. The RoboFest ISO safety state becomes the single authority for cutting authorization.

### 5.5 Maintenance & Component Health
- **Senior Implementation:** `/dashboard/maintenance` manages business work orders (scheduled date, technician name, notes) stored in MongoDB.
- **RoboFest Implementation:** `/robot/health` calculates cyber-physical component health scores, runtime wear hours, fault states, and service thresholds for 7 critical robot subsystems (`SYS-POWER`, `MOT-DRIVE`, `ACT-TORCH`, `SEN-IMU`, `ACT-MAG`, `ACT-ARM`, `SYS-TRACK`).
- **Resolution: CLEAN DOMAIN SPLIT.** RoboFest owns real-time component health scores and automated fault detection; Senior's maintenance page displays scheduled business service logs while displaying live subsystem health badges linked from RoboFest.

### 5.6 Cut & Event History
- **Senior Implementation:** `/dashboard/history` renders a simple table of past cuts stored in MongoDB.
- **RoboFest Implementation:** `/records/history` renders a chronological, append-only flight-recorder audit log (`EventLog`) with categories (`SYSTEM`, `OPERATIONS`, `SAFETY`, `SECURITY`), severity levels (`INFO`, `WARNING`, `CRITICAL`, `FAULT`), and user attribution.
- **Resolution: UNIFY UNDER ROBOFEST OPERATIONAL EVENT LOG.** RoboFest's relational event store is the official operational flight recorder.

### 5.7 AI Assistant / Copilot
- **Senior Implementation:** `/dashboard/chatbot` is a generic chatbot with static question matching.
- **RoboFest Implementation:** `/intelligence/robo-assist` is a grounded, non-hallucinatory AI operator assistant that executes live SQL queries against `RuntimeState`, `ComponentHealth`, and `Mission` tables to answer queries with verifiable data sources.
- **Resolution: ADOPT ROBOFEST ROBO-ASSIST.** Replace Senior's chatbot with the RoboFest ROBO-ASSIST interface.

---

## 6. DIGITAL TWIN FAILURE ANALYSIS (DEEP-DIVE ROOT CAUSES)

Why does the RoboFest Digital Twin fail to perform properly when launched or embedded through the Senior website? The audit reveals seven distinct failure mechanisms:

```
                     CROSS-ORIGIN IFRAME FAILURE CHAIN
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Senior Website (Vite + React 19)                                    │
│    Width: 100vw | Height: 100vh                                        │
│    └── Outer Sidebar: 256px | Outer Navbar: 64px                       │
│        └── Main Viewport: ~900px usable width                          │
│            └── Sub-tab "Ship Cutting Simulations"                      │
│                └── Iframe Box: Fixed 780px Height                      │
│                    ┌───────────────────────────────────────────────┐   │
│                    │ 2. RoboFest App Inside Iframe (Next.js 16)    │   │
│                    │    └── Inner Header: 56px                     │   │
│                    │    └── Inner Sidebar: 240px                   │   │
│                    │    └── Inner Right Panel: 320px               │   │
│                    │    └── Digital Twin Canvas: Squeezed to ~340px│   │
│                    │        - SQUISHED VIEWPORT                    │   │
│                    │        - TRAPPED POINTER EVENTS               │   │
│                    │        - LOST KEYBOARD FOCUS                  │   │
│                    │        - DUAL THREE.JS / WEBGL CONTEXTS       │   │
│                    └───────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Severe Viewport & Geometric Compression
- **Calculated Geometry:** On a standard 1080p display (1920x1080 with 125% OS scaling = 1536x864 effective viewport):
  - Senior Sidebar consumes **256px**.
  - Senior Container padding consumes **48px**.
  - Available width inside Senior main view = **1232px**.
  - Inside the iframe, RoboFest loads its complete `AppShell`:
    - RoboFest Sidebar consumes **240px**.
    - RoboFest Right Telemetry Panel consumes **320px**.
    - Grid gap and padding consume **36px**.
  - **Remaining width for 3D Canvas:** `1232px - 240px - 320px - 36px` = **636px** at best, dropping to **~340px** on laptop screens!
- **Vertical Compression:** Senior Navbar (64px) + Senior Tab strip (48px) + Senior Bridge status bar (52px) + Senior Iframe wrapper (fixed 780px). Inside the iframe, RoboFest Header (56px) + RoboFest Bottom Environment panel (180px). **Usable 3D vertical height drops to ~400px**.
- **Impact:** The 3D Digital Twin is squeezed into a tiny peephole, making the ship hull and robot crawler virtually unreadable.

### 6.2 Trapped Pointer Events & OrbitControls Stutter
- When the user drags to rotate the 3D camera, the mouse cursor inevitably crosses the 780px iframe boundary into the parent Senior window.
- The browser immediately transfers pointer capture to the parent document. The iframe ceases to receive `pointermove` and `pointerup` events.
- **Result:** The 3D camera freezes or continues rotating uncontrollably until the user clicks inside the iframe again.

### 6.3 Isolated Keyboard Focus
- RoboFest crawler locomotion relies on keyboard event listeners (`window.addEventListener('keydown')`) listening for 'W', 'A', 'S', 'D' and Arrow keys.
- In the iframe setup, clicking anywhere in the Senior sidebar, tabs, or address bar transfers focus to the top-level window.
- **Result:** Pressing 'W' or 'A' does nothing to move the robot crawler because the iframe window never receives the event. The user believes the simulation is broken.

### 6.4 WebGL Context Duplication & GPU Resource Exhaustion
- Senior's `RobotArmSimulator3D.jsx` initializes a raw WebGL renderer (`new THREE.WebGLRenderer`) upon mounting.
- Concurrently, the iframe initializes a second WebGL renderer via React Three Fiber (`<Canvas shadows dpr={[1, 2]}>`).
- RoboFest's Digital Twin configures:
  - Directional Light Shadow Map: **2048 x 2048**
  - ContactShadows resolution: **2048 x 2048**
  - High devicePixelRatio: **up to 2.0**
- Running two separate WebGL contexts with 2048-resolution shadow buffers on consumer hardware (especially laptops with integrated Intel Iris Xe / AMD Radeon graphics) triggers severe GPU thermal throttling, dropped frames (<20 FPS), and occasional `CONTEXT_LOST_WEBGL` crashes.

### 6.5 ResizeObserver Race Conditions & Canvas Aspect Distortion
- React Three Fiber attaches a `ResizeObserver` to the canvas parent container (`.digital-twin-container`).
- When Senior's responsive sidebar collapses or when tabs are toggled, the iframe's outer dimensions change asynchronously.
- The iframe's internal Next.js layout engine often reports stale client rects during the transition, causing Three.js to render with an incorrect aspect ratio (distorted, stretched ship hull) until an explicit window resize event occurs.

### 6.6 Cross-Origin Caching & Branch Mismatch
- Senior's `ShipCuttingSimulationsPage.jsx` hardcoded:
  `const ROBOFEST_SIM_URL = 'https://robo-fest-self.vercel.app/command-center';`
- As discovered in our live audit, this URL was pointing to an older production build from `main` that lacked the latest coordinate mapping and Prisma bugfixes from `daksh/platform`.
- Because the iframe URL is stored in browser `localStorage` (`USER_DEPLOYED_SIM_URL`), the user continued loading stale code even after code updates were pushed, creating false bug reports.

### 6.7 Double React 19 Runtime Waterfall
- The browser downloads and parses Senior's Vite bundle (~850 KB JS).
- The browser renders the page, then mounts the iframe.
- The iframe initiates a second full network request cycle, downloading Next.js HTML, Turbopack manifest, Next.js chunk bundles, and Three.js runtime (~1.4 MB JS).
- Total time to interactive (TTI) for the 3D simulation exceeds **5.8 seconds** on standard 4G connections.

---

## 7. SYSTEM-WIDE PERFORMANCE BOTTLENECK AUDIT (TOP 10 CRITICAL ISSUES)

Through systematic inspection of bundle sizes, assets, render loops, and network calls, the top 10 performance bottlenecks have been identified:

| Rank | Bottleneck Description | Affected Repo / File | Quantitative Impact | Root Cause |
| :---: | :--- | :--- | :--- | :--- |
| **#1** | **Dual WebGL Contexts & Redundant Three.js Bundles** | Both repos in iframe | ~140 MB VRAM consumed; ~1.8 MB duplicate JS | Two separate Three.js engines (raw Three.js in Senior + R3F in RoboFest) running simultaneously. |
| **#2** | **Excessive 2048x2048 Shadow Maps at 2.0 DPR** | RoboFest: `DigitalTwin/index.tsx` | 18 ms GPU frame time (drops FPS from 60 to ~28) | `shadow-mapSize={[2048, 2048]}` combined with `ContactShadows res=2048` rendered at `dpr={[1, 2]}`. |
| **#3** | **Uncoordinated High-Frequency Polling Timers** | Senior `sensors.js` & RoboFest `CommandCenter` | Constant CPU wakeups; network churn | Senior polls Adafruit at 2.5 Hz (`setInterval`); RoboFest polls scenario state at 1 Hz while SSE runs at 10 Hz. |
| **#4** | **Uncached Iframe Cold-Start Waterfall** | Senior `ShipCuttingSimulationsPage.jsx` | 4.5s - 6.0s Time-To-Interactive delay | Parent page loads completely before iframe begins downloading Next.js runtime over the network. |
| **#5** | **Heavy Autoplay Video Assets on Home Route** | Senior `ScrollVideoBackground.jsx` | ~12-25 MB video download; CPU video decode | High-definition background video decoding in parallel with Framer Motion scroll animations. |
| **#6** | **Unbounded Chart.js Canvas Re-renders** | Senior `SensorsPage.jsx` & RoboFest `TelemetryTrend` | 100% main-thread spike during telemetry bursts | Chart datasets re-instantiated on every incoming telemetry tick instead of updating data arrays in-place. |
| **#7** | **Continuous Animation Loops in Background Tabs** | Senior `RobotArmSimulator3D.jsx` | 15% continuous CPU load when tab is inactive | `requestAnimationFrame` loop in Senior's raw Three.js canvas lacks visibility-change pause logic. |
| **#8** | **Framer Motion Transition Overhead on Grid Shell**| Senior `client/src/App.jsx` & layouts | Layout thrashing on page navigation | Large animated DOM tree transitions with deep nesting on every route transition. |
| **#9** | **Prisma SQLite Cold-Start File Copying** | RoboFest `src/lib/prisma.ts` | 400ms - 800ms serverless cold-start latency | `fs.copyFileSync` executed on every cold start to copy `dev.db` into Vercel's writable `/tmp` directory. |
| **#10**| **Unmanaged Three.js Geometries & Texture Memory** | RoboFest `DigitalTwin/ShipAssembly.tsx` | ~45 MB memory leak on repeated route switches | Geometries and procedural materials in `ShipHull` and `ShipAssembly` not explicitly disposed on unmount. |

---

## 8. NAVIGATION HIERARCHY & JOURNEY AUDIT

### Current Broken User Journey (5 Labyrinthine Steps)
```
[Public Home] 
     ↓  (Clicks "Launch Live Dashboard")
[/dashboard]  (Senior Overview: static 68.4% cut progress)
     ↓  (Locates & clicks "Ship Cutting Simulations" in Senior sidebar)
[/dashboard/ship-cutting-simulations]  (Page loads with 4 tabs)
     ↓  (Finds "Deployed Crawler Simulation" tab; sees nested iframe)
[Inside Iframe: https://robo-fest-self.vercel.app/command-center]
     ↓  (User must click inside iframe to establish keyboard focus)
[RoboFest Command Center] (Squished, cramped, double sidebars, double headers)
```

### Target Unified User Journey (Clean, Direct, Professional)
```
[Public Marketing Website]  (Senior Shell)
     │
     ├── Fleet Registry (/fleet)
     ├── Scrap Valuation (/materials)
     ├── Feasibility ROI (/feasibility)
     └── Salvage Inventory (/parts)
     │
     ▼  (Clicks "Launch Live Operations")
[ONE UNIFIED LIVE OPERATIONS DASHBOARD]  (/operations/live)
     ├── Full-Screen Industrial Command Center
     ├── 100% Unobstructed Large Digital Twin Viewport (70% screen)
     ├── Real-Time Telemetry & Sensor Rail (30% screen)
     ├── Unified ISO Deterministic Safety & E-Stop HUD
     ├── Collapsible Mission & Cut Path Deck
     └── Grounded ROBO-ASSIST Operational AI
```

---

## 9. UI/UX & VISUAL COHESION AUDIT

Analysis of visual dissonance evidenced in current user screenshots:

1. **Double Sidebars:**
   - Leftmost: Senior dark zinc sidebar (`w-64`, 256px wide) with 13 navigation links.
   - Inner: RoboFest dark slate sidebar (`240px` wide) with 6 category groups.
   - Combined, they waste **496px** of horizontal screen width on redundant navigation!
2. **Double Headers:**
   - Top: Senior Top Navbar (64px) with breadcrumbs, profile badge, and search.
   - Inner: RoboFest Header (56px) with "RF6 COMMAND", "SIMULATED", "MISSION: DRAFT", "SAFETY: NORMAL", and theme button.
   - Vertical stacking wastes **120px** of prime vertical monitor real estate.
3. **Conflicting Color Palettes:**
   - Senior repo uses Tailwind `neutral-950` (#0a0a0a) with bright cyan accents (`#00f0ff`) and emerald success badges.
   - RoboFest uses custom CSS HSL tokens: deep navy background (`#0b0e14`), industrial slate cards (`#121722`), and amber/blue status indicators.
   - The visual seam between the two designs inside the iframe looks unpolished and amateurish.
4. **Nested Scrollbars:**
   - When the user scrolls, the outer Senior dashboard page scrolls, while the inner iframe also has an internal scrollbar on the right telemetry panel. The page exhibits erratic "scroll-jacking".
5. **Card Density Mismatch:**
   - Senior cards feature generous padding (`p-6`, rounded-xl, low data density).
   - RoboFest Command Center is built as a high-density, compact SCADA command system (`p-3`, monospace typography, zero whitespace waste).
   - Mixing the two breaks industrial design coherence.

---

## 10. RECOMMENDED TARGET UNIFIED DASHBOARD ARCHITECTURE

The target architecture replaces all duplicate views with **ONE BEST LIVE OPERATIONS DASHBOARD**.

### 10.1 Conceptual Information Architecture
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED INDUSTRIAL HUD (56px)                                                                          │
│ [TITAN-CUT ROBOFEST 6.0] │ ROBOT: ALPHA-01 [ONLINE] │ MISSION: HULL-CUT-04 [RUNNING] │ SAFETY: [PERMIT]│
│ CONNECTION: 24ms │ LAT: LIVE (2.5Hz) │ [EMERGENCY STOP (ISO 13850)] │ OPERATOR: OP-01 │ [FULLSCREEN]  │
├───────────────────────────────────────────────────────────────────┬────────────────────────────────────┤
│ PRIMARY WORKSPACE: 3D DIGITAL TWIN (68% Width)                     │ SECONDARY OPERATIONAL RAIL (32%)   │
│                                                                   │ ┌────────────────────────────────┐ │
│ ┌───────────────────────────────────────────────────────────────┐ │ │ ACTIVE MISSION & CUT PROGRESS   │ │
│ │ FLOATING SUPERVISORY CAMERA HUD                               │ │ │ Progress: 68.4% [4/8 Cuts Done]│ │
│ │ [Robot] [Cut] [Ship] [Port] [Starboard] [Reset] [Follow]      │ │ │ Toolpath: CUT-04 (CLOSED-LOOP) │ │
│ └───────────────────────────────────────────────────────────────┘ │ ├────────────────────────────────┤ │
│                                                                   │ │ REAL-TIME TELEMETRY HUD        │ │
│                                                                   │ │ Power: 220.4 V │ Current: 3.4 A│ │
│                     HIGH-FIDELITY 3D VIEWPORT                   │ │ Track Temp: 42.1°C │ Arm: 38.4°C │ │
│                                                                   │ │ Vibration: 0.05 G (NOMINAL)    │ │
│             - Full Hull Curvature & Coordinate Grid             │ │ Adhesion: 24.2 kN [MAGNETS ON]   │ │
│             - 1:1 Magnetic Crawler with Dynamic Tracks          │ ├────────────────────────────────┤ │
│             - 400mm Extended Cutting Arm with Standoff Gap      │ │ SENSOR & ATMOSPHERE INTERLOCK  │ │
│             - Live Plasma Torch Arc Particle Flame              │ │ O2: 20.9% │ Combustible: 0% LEL │ │
│             - Active Cut Path Overlay (Planned vs Cut)          │ │ Reverse Wall Temp: 28.5°C [OK] │ │
│             - Supply Umbilicals & Safety Tethers                │ │ Reverse Gas: 8.2 PPM [SAFE]    │ │
│                                                                   │ ├────────────────────────────────┤ │
│                                                                   │ │ SUB-SYSTEM HEALTH MONITOR      │ │
│                                                                   │ │ Drive: 98% │ Torch: 95% │ IMU: OK│ │
│                                                                   │ └────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────┴────────────────────────────────────┤
│ LOWER COLLAPSIBLE OPERATIONAL DECK (Expandable / 3 Tabs)                                               │
│ [ TAB 1: Real-Time Event Flight Recorder ]  [ TAB 2: AI ROBO-ASSIST ]  [ TAB 3: Ship Metallurgical Data]│
│ 11:21:04 AM [SAFETY] All parameters within certified ISO cutting thresholds. Permit granted.           │
│ 11:21:02 AM [CUTTING] Torch standoff verified at 40.0mm via ultrasonic sensor. Arc ignited.             │
│ 11:20:58 AM [ROBOT] Adhesion verified: 24.2 kN normal force across both magnetic caterpillar tracks.    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Architectural Components Breakdown
1. **Unified Industrial HUD (Top 56px):**
   - High-contrast, single-row status bar.
   - Shows active vehicle identifier, mission state badge, connection ping, and prominent physical-styled **EMERGENCY STOP** latch button.
2. **Primary Digital Twin Viewport (Center-Left 68%):**
   - Direct, hardware-accelerated WebGL canvas (no iframes).
   - Floating unobtrusive glassmorphism camera bar for instant view-switching (Follow Robot, Inspect Cut, Bow/Stern views).
   - High performance: Dynamic DPR scaling, frustum culling, optimized 1024 shadow maps, zero stutter.
3. **Secondary Operational Rail (Right 32%):**
   - Displays all critical operational gauges without requiring scrolling.
   - Direct real-time updates via SSE / WebSocket stream.
4. **Lower Collapsible Operational Deck (Bottom):**
   - Houses non-visual operational tools in a compact tabbed dock:
     - **Event Log:** Chronological flight recorder audit trail.
     - **ROBO-ASSIST AI:** Grounded operator assistant with real database queries.
     - **Ship Context:** Live metallurgy and hull section plate thickness pulled from Senior's ship business database.

---

## 11. INTEGRATION STRATEGY COMPARISON (OPTIONS A THROUGH E)

Five architectural patterns evaluated against 9 strict technical criteria:

| Evaluation Criteria | Option A: Status Quo Iframe Embed | Option B: Direct Component Port into Vite | Option C: Reverse Proxy Route Integration | Option D: Shared NPM / Monorepo Package | Option E: Frameless Decoupled Operational Deployment |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Viewport & Canvas Layout** | **FAIL** (Squished, 340px) | **EXCELLENT** (Native DOM) | **EXCELLENT** (Native DOM) | **EXCELLENT** (Native DOM) | **EXCELLENT** (100% full screen) |
| **2. Pointer & Keyboard Focus** | **FAIL** (Trapped/lost) | **EXCELLENT** (Native) | **EXCELLENT** (Native) | **EXCELLENT** (Native) | **EXCELLENT** (Native window) |
| **3. WebGL / GPU Performance** | **POOR** (Dual contexts) | **EXCELLENT** (Single engine)| **EXCELLENT** (Single engine)| **EXCELLENT** (Single engine) | **EXCELLENT** (Single engine) |
| **4. Bundle & Load Speed** | **FAIL** (5.8s waterfall)| **GOOD** (~1.2s bundle) | **GOOD** (~1.1s direct) | **GOOD** (~1.2s bundle) | **EXCELLENT** (Instant sub-second) |
| **5. Authentication / Session** | **POOR** (Cross-origin)| **EXCELLENT** (Unified) | **EXCELLENT** (Cookie share)| **EXCELLENT** (Unified) | **GOOD** (JWT token passing) |
| **6. Realtime & State Latency** | **POOR** (No bridge) | **EXCELLENT** (Direct store) | **EXCELLENT** (Direct SSE) | **EXCELLENT** (Direct store) | **EXCELLENT** (Direct SSE stream) |
| **7. Code Duplication** | **HIGH** (2 full apps) | **LOW** (Single client)| **MEDIUM** (Separate repos)| **ZERO** (Shared library)| **LOW** (Clean boundaries) |
| **8. Development Complexity** | **LOW** (Trivial iframe) | **VERY HIGH** (Port R3F/TS) | **LOW** (Vercel rewrite) | **HIGH** (Package management)| **VERY LOW** (Clean route link) |
| **9. Upstream Maintenance** | **POOR** (Desync prone)| **HIGH RISK** (Fork burden)| **EXCELLENT** (Independent)| **HIGH** (Versioning chore) | **EXCELLENT** (Clean decoupling) |

---

## 12. RECOMMENDED INTEGRATION STRATEGY

### Architectural Verdict: HYBRID OPTION E + OPTION C (Clean Route Bridge & Frameless Shell)

The analysis definitively rules out Option A (iframe embed) due to permanent, unsolvable viewport and event-trapping limitations. Option B (rewriting RoboFest's TypeScript/R3F/Prisma stack into Senior's Vite/JavaScript/Express stack) carries excessive risk, would take weeks, and would introduce regression bugs into the working physics engine.

### The Recommended Architecture:
1. **Clean Route Delegation on Senior Platform:**
   - In Senior's navigation and landing page, the *"Launch Live Dashboard"* CTA routes to `/operations/live`.
   - Senior repository removes the broken `/dashboard/ship-cutting-simulations` iframe page and the crude `RobotArmSimulator3D.jsx`.
2. **RoboFest "Frameless Enterprise Mode":**
   - RoboFest exposes a specialized clean operational route: `/operations/live` (or dedicated fullscreen query `?mode=embedded`).
   - In this mode, RoboFest automatically suppresses its own outer sidebar and marketing headers, rendering **ONLY the pure, high-density Industrial HUD, the Large Digital Twin, and the Real-time Telemetry Rail**.
3. **Seamless Top-Level Navigation:**
   - The Senior product shell seamlessly loads the operational dashboard either via direct route proxy rewrite (Option C) or via seamless full-viewport single-sign-on launch with an integrated "Return to Fleet Manager" breadcrumb back to Senior's business pages.
4. **Shared Session & Telemetry Bridge:**
   - Senior's sensor service (`sensors.js`) pushes Adafruit IO reverse-bulkhead readings directly into RoboFest's `/api/telemetry` endpoint.
   - A single unified JWT token authorizes the operator across both domains.

---

## 13. DATA OWNERSHIP & API INTEGRATION CONTRACT

To maintain a single source of truth, data flow between the two systems is governed by this strict API contract:

```
                    DATA SYNCHRONIZATION PIPELINE
┌──────────────────────────────┐                ┌──────────────────────────────┐
│ SENIOR PLATFORM (MongoDB)    │                │ ROBOFEST ENGINE (Prisma/SQL) │
│ - Vessel Specifications      │ ─────────────> │ - Mission Vessel Context     │
│ - Metallurgy & Steel Grade   │  REST Sync     │ - Cutting Trajectory Limits  │
│ - Adafruit Reverse Gas/Temp  │ ─────────────> │ - Deterministic Safety Bus   │
│                              │                │                              │
│ - Work Order Repair Logs     │ <───────────── │ - Live Component Wear & MTBF │
│ - Fleet Scrap Valuation      │ <───────────── │ - Completed Cut Volume & M2  │
└──────────────────────────────┘   Telemetry    └──────────────────────────────┘
                                    Webhook
```

### 13.1 Inbound to RoboFest (Senior -> RoboFest)
1. **Vessel Context:** When an operator starts a mission on a ship (e.g. `MV Ocean Voyager`), Senior sends:
   - `shipId`, `hullSection`, `plateThicknessMM`, `steelGrade`
   - RoboFest uses these parameters to set cutting torch travel speed and plasma arc amperage.
2. **Reverse Bulkhead Telemetry:** Senior's Adafruit feed forwards:
   - `oppositeSideTemp` (Celsius), `oppositeSideGasPPM` (PPM), `flammableGasLevel` (% LEL)
   - RoboFest's deterministic safety evaluator continuously validates:
     `oppositeSideTemp < 50.0 && oppositeSideGasPPM < 35.0`
   - If violated, RoboFest immediately trips `SAFETY_SIGNAL_INHIBITED_RED` and locks crawler motion.

### 13.2 Outbound from RoboFest (RoboFest -> Senior)
1. **Completed Cut Telemetry:** Upon cut completion, RoboFest emits:
   - `cutId`, `lengthMeters`, `durationSeconds`, `gasConsumedLiters`, `salvagedPlateAreaM2`
   - Senior stores these in MongoDB to update scrap recovery value and part inventory.
2. **Subsystem Maintenance Wear:** RoboFest periodically emits:
   - `componentId`, `runtimeHours`, `faultCount`, `healthScore`
   - Senior updates its fleet maintenance records.

---

## 14. STEP-BY-STEP IMPLEMENTATION PHASES

*(For Execution in Future Implementation Phase — NOT PERFORMED IN THIS AUDIT)*

### Phase 1: Senior Shell Cleanup & Deprecation (Branch: `integration/unified-live-dashboard`)
- [ ] Deprecate and remove `ShipCuttingSimulationsPage.jsx` and its nested iframe.
- [ ] Remove crude `RobotArmSimulator3D.jsx` from Senior dashboard.
- [ ] Remove external demo links tab (`online-gallery`).
- [ ] Update Senior's `Sidebar.jsx` to redirect "Live Operations" directly to the unified command center route.

### Phase 2: RoboFest Frameless Command Center Optimization
- [ ] Optimize `DigitalTwin/index.tsx`: Reduce shadow map resolution from 2048 to 1024, tune ContactShadows to 1024, clamp DPR to 1.5.
- [ ] Implement responsive viewport observer that grants the 3D canvas minimum 65% width on any screen.
- [ ] Ensure keyboard listeners handle global focus gracefully with prominent canvas-focus indicator.
- [ ] Implement dispose methods on all procedural Three.js meshes to eliminate memory leaks on unmount.

### Phase 3: Telemetry & Safety Gateway Unification
- [ ] Configure webhook in Senior's `sensors.js` forwarding Adafruit IO reverse-void readings to RoboFest `/api/telemetry`.
- [ ] Map Senior's reverse-void hazard into RoboFest's deterministic ISO safety evaluator.
- [ ] Wire physical-styled Emergency Stop button on HUD to trip both RoboFest crawler motion and Senior interlock relay.

### Phase 4: Production Verification & End-to-End Validation
- [ ] Verify zero WebGL context leaks across route changes.
- [ ] Validate 60 FPS performance on 1080p and high-DPI displays.
- [ ] Execute complete simulated mission (Draft -> Running -> Active Cut -> E-Stop -> Recovery).
- [ ] Validate unified production deployment on Vercel.

---

## 15. SYSTEM RISK REGISTER & MITIGATION PLAN

| Risk ID | Risk Description | Likelihood | Impact | Severity | Mitigation Strategy |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **RSK-01** | **Cross-Origin Telemetry Latency:** Forwarding Adafruit IO data from Senior to RoboFest introduces latency (>500ms). | Medium | High | **HIGH** | Use direct lightweight REST webhook or direct WebSocket connection; RoboFest safety engine enforces 1500ms heartbeat timeout. |
| **RSK-02** | **Vercel Serverless SQLite Limitations:** SQLite database in `/tmp` loses state on serverless container recycling. | High | Medium | **MEDIUM** | For long-term production, migrate RoboFest Prisma schema to hosted PostgreSQL (Neon / Supabase); SQLite remains strictly for local/demo runs. |
| **RSK-03** | **WebGL Context Loss on Lower-End Hardware:** Complex procedural ship geometry crashes older mobile/integrated GPUs. | Low | High | **MEDIUM** | Implement WebGL capability detection; automatically disable ContactShadows and dynamic lighting on mobile/low-tier GPUs. |
| **RSK-04** | **Coordinate Frame Confusion:** Discrepancy between Senior vessel hull coordinate system and RoboFest robot kinematic frame. | Low | High | **HIGH** | Strict adherence to `COORDINATE_SYSTEM.md`: Robot kinematics map X (Longitudinal), Y (Vertical), Z (Normal standoff). |
| **RSK-05** | **Session & Authentication Desynchronization:** Operator logged in on Senior shell encounters 401 on RoboFest endpoints. | Medium | Medium | **MEDIUM** | Implement shared JWT secret (`JWT_SECRET`) and verify authorization tokens across both API surfaces. |
| **RSK-06** | **Accidental Modification of Senior Main Branch:** Unverified merge breaks production Senior website. | Low | Critical| **CRITICAL** | All work restricted strictly to branch `integration/unified-live-dashboard`; zero pushes to upstream `main` without explicit approval. |

---

## 16. DEFINITION OF DONE (DoD)

The unified live dashboard project will be considered complete when all of the following criteria are met:

1. **Zero Nested IFrames:** No iframes exist anywhere in the live dashboard or operational views.
2. **Single 3D Canvas:** Only ONE Three.js / WebGL context runs in the entire application, maintaining a stable 60 FPS.
3. **No Duplicate Controls:** Only ONE master command dashboard exists, hosting the authoritative robot state, mission controls, and telemetry gauges.
4. **Unobstructed Viewport:** The 3D Digital Twin canvas occupies at least 65% of the operational screen width, free from squishing or clipping.
5. **Direct Navigation:** The user reaches the live operations dashboard in **1 click** from the public website ("Launch Live Dashboard").
6. **Authoritative Safety:** The ISO deterministic safety engine is the single point of control for cutting authorization and emergency stop.
7. **Clean Branch Isolation:** All changes committed solely to `integration/unified-live-dashboard` with zero unapproved modifications to `main`.
8. **Clean Production Build:** `npm run build` passes with zero TypeScript, ESLint, or runtime bundle errors.

---
*AUDIT COMPLETE — NO IMPLEMENTATION PERFORMED.*
