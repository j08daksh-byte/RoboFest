# ROBOFEST SENIOR PLATFORM COMPATIBILITY

## 1. Two-Repository Architecture
RoboFest 6.0 operates under a strict two-repository architecture with clear separation of concerns to prevent split-brain data conflicts and redundant engineering.

**SENIOR PLATFORM (`ship-cutter`)**
*The Business & Platform Authority*
- **Stack:** React/Vite, Express, MongoDB
- **Domain:** Fleet Management (Ships), Structural Parts Business, Feasibility & ROI, General Maintenance Logs, Public Marketing/Website, Media/Photos, Blog/CMS.

**OUR PLATFORM (`daksh/platform`)**
*The Real-Time Command Center & Digital Twin*
- **Stack:** Next.js (Turbopack), Zustand, Three.js, SQLite/Prisma.
- **Domain:** Real-Time Digital Twin, Path Planning, Cutting Physics, Deterministic Safety Interlocks, Live Telemetry Ingestion, Hardware Command Queue, Robot Sensors, Local Operator Auth.

---

## 2. Duplicate Feature Audit & Classification

| Feature Module | Our Current State | Senior Platform State | Classification | Action |
|---|---|---|---|---|
| **Command Center (Twin)** | Highly robust 3D interface | Basic 2D Dashboard | **KEEP** | Our core strength. Remains real-time authority. |
| **Missions (Local)** | Robust execution state | `CuttingOperation` CRUD | **ADAPT** | Bind our local mission execution to Senior `CuttingOperation`. |
| **Robot Safety/Interlocks** | Hardcoded logic | None | **KEEP** | Essential hardware control. Do not expose to Senior API directly. |
| **Ship Management** | Scaffolded (`src/app/ship/`) | Full CRUD | **DEPRECATE** | Remove our redundant Ship UI. We will only fetch the active ship geometry from Senior API for the Twin. |
| **Structural Parts** | `completedCuts` state | Full CRUD | **INTEGRATE**| We generate the physical cut. We will push `Part` data to Senior API on completion. |
| **Maintenance Records** | Scaffolded (`src/app/records/`)| Maintenance CRUD | **DEPRECATE** | Remove our redundant UI. Critical hardware events will sync to Senior Maintenance API. |
| **Knowledge Base / CMS** | Scaffolded | Blog CRUD | **DEPRECATE** | Remove our Knowledge Base UI. |
| **Telemetry History** | SQLite `EventLog` / Local | Mocked | **KEEP** | We own high-frequency telemetry. We will batch-sync summaries to Senior API. |
| **Users / Auth** | SQLite `User` (Operators) | General Users | **KEEP (Isolate)**| Our DB owns strictly hardware-certified operators for safety. Not the same as web users. |

---

## 3. Senior API Integration Map

Our system will act as an edge client to the Senior API. 
*Note: We never allow the Senior API to directly actuate hardware.*

| Operational Event (Our Source) | Senior API Endpoint | Direction | Sync Strategy | Failure Behavior |
|---|---|---|---|---|
| **Command Center Boot** | `GET /api/ships/:id` | Senior → Us | Startup/On-Demand | Use cached SQLite snapshot. |
| **Cut Completion** (`CutRecord`) | `POST /api/parts` | Us → Senior | Immediate upon panel drop | Queue locally, retry. |
| **Robot Critical Fault** | `POST /api/maintenance` | Us → Senior | Immediate upon fault | Queue locally, retry. |
| **Mission Complete** | `PUT /api/operations/:id` | Us → Senior | End of mission | Queue locally, retry. |

---

## 4. Data Ownership & Boundaries

**A. The Mission Boundary**
- **Senior:** `CuttingOperation` represents the business-approved job (budget, material, timeline).
- **Us:** `MissionExecution` represents the real-time robotic state (in-progress, paused, tool paths, collision checks). We map `CuttingOperation.id` to our `Mission.id`.

**B. The Cutting Boundary**
- **Us:** Path planning, inverse kinematics, cutting torch safety, physics detachment, and dimensional verification (`CutRecord`).
- **Senior:** Receives the exported `CutRecord` as a new `Part` for scrap tracking and ROI. The Senior platform is completely decoupled from the real-time cutting loop.

**C. The Telemetry Boundary**
- **Us:** Receives 10Hz+ telemetry from ESP32. Applies deterministic safety limits. Stores rolling buffer.
- **Senior:** Receives low-frequency aggregations (e.g., "Robot operated for 2 hours, consumed 5L of gas").

---

## 5. Integration Adapter Architecture (Upcoming)

To prevent scattered `fetch()` calls and hardcoded coupling, we will build:

```text
src/lib/integration/senior/
 ├── SeniorClient.ts       (Base HTTP client, Auth tokens, retry logic)
 ├── ShipAdapter.ts        (Transforms Senior Ship into our Twin geometry)
 ├── PartAdapter.ts        (Transforms our CutRecord into Senior Part payload)
 └── OperationAdapter.ts   (Transforms our Mission status into Senior Operation)
```

No network calls will be embedded in `robotState.ts` or `platformStore.ts` directly. They will interact through dedicated integration sync services.

---

## 6. Exact Next Implementation Task

**PHASE 11E — DEPRECATE REDUNDANT SCAFFOLDS**
Safely remove `src/app/ship/*` and `src/app/records/*` as identified in this compatibility audit to slim down the repository and ensure we do not build competing features.
