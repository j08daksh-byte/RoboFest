# ROBOFEST: TWO-REPO INTEGRATION AUDIT

## 1. Senior Repo Architecture
The senior team's repository (`anshika01-agrawal/ship-cutter`) is a classic MERN stack application.
- **Frontend**: React 18 + Vite + Tailwind CSS. Hosted statically (likely Vercel/Netlify).
- **Backend**: Express.js REST API with Mongoose ODM connecting to MongoDB Atlas.
- **Fallbacks**: Implements a graceful fallback system. If MongoDB is disconnected, the routes immediately return static seed data (`defaultShips`, `defaultParts`, `defaultOperation`, etc.) defined in `server/config/seedData.js`.

## 2. Senior Frontend Feature Status
- **Public Website:** Fully implemented static UI (landing, about, how-it-works).
- **Operations Dashboard:** Implemented UI, fetches from `/api/operations` (mocked heavily without DB).
- **Ship/Parts Management:** Implemented UI, full CRUD via REST.
- **Material Spectrometry / Feasibility:** Implemented UI, data display.
- **AI Copilot (Gemini):** Dedicated chatbot page.

## 3. Senior Backend Status
- Express REST API running on Port 5000.
- All models have associated CRUD routes.
- **CRITICAL FLAW:** The fallback architecture masks connection failures by returning in-memory mock data. This is unsafe for industrial operations; a robot disconnected from its database should not present fake telemetry to an operator.

## 4. Senior Database/Model Status
- Uses MongoDB via Mongoose.
- Models: `Ship`, `CuttingOperation`, `Part`, `Material`, `Maintenance`, `Feasibility`, `Photo`, `BlogPost`, `Contact`.

## 5. Mock/Fallback Data Locations
- Entire fallback system resides in `server/config/seedData.js`.
- Used extensively in `server/routes/database.js` and individual route controllers when `mongoose.connection.readyState !== 1`.

## 6. Our Repo Architecture
- Next.js 16.3 (Turbopack) Full-stack app.
- State: Zustand (`platformStore`, `robotState`, `plannerStore`).
- Digital Twin: Three.js / React Three Fiber.
- Safety: Deterministic client-side interlocks.
- Persistence: SQLite / Prisma (`User`, `Mission`, `CutRecord`, `EventLog`) via Next.js API routes with standard JWT Auth (`jose`).

## 7. Feature-by-Feature Comparison

| Feature | Our Repo | Senior Repo | Best Owner | Reuse? | API Required? | Conflict? | Action |
|---|---|---|---|---|---|---|---|
| Public Website | None | Yes | Senior | Yes | No | No | Keep isolated |
| Command Center | Yes (Twin) | Yes (Dashboard) | Our Repo | No | Yes | Yes | Adopt Senior UI themes into our Twin |
| Ship Management | Scaffolded | Yes | Senior | Yes | Yes | Yes | Call Senior API |
| Missions / Cut Execution | Yes (Robust) | Mocked | Our Repo | No | Yes | Yes | We drive execution |
| Structural Parts | None | Yes | Senior | Yes | Yes | No | Push our offcuts to Senior Parts API |
| Materials / Feasibility | None | Yes | Senior | Yes | No | No | Keep in Senior |
| Telemetry (Live) | Simulated | Mocked | Our Repo | No | WS/MQTT | Yes | We provide live telemetry |
| Robot Health | Basic | Advanced UI | Senior | Yes | Yes | Yes | Publish our health states to Senior |
| Database | SQLite/Prisma | MongoDB | Shared | N/A | N/A | Yes | Bridge via APIs |

## 8. Ownership Map

**SENIOR REPOSITORY:**
- Public Website & Marketing.
- High-level Fleet Management (Ships, Parts).
- Business Intelligence (Feasibility, Metallurgy, Materials).
- Corporate/Yard Operations (Maintenance logs, Blogs, Contact requests).

**OUR PLATFORM (COMMAND CENTER):**
- Real-time Digital Twin (3D Physics).
- Hardware deterministic safety engine.
- Path Planning & Cutting Physics.
- Real-time robot control & MQTT telemetry ingestion.
- Local command queue and hardware authorization.

## 9. API Integration Map

**OUR COMMAND CENTER -> SENIOR EXPRESS BACKEND**
- We must `POST /api/parts` to Senior backend when a physical cut successfully drops a piece.
- We must `GET /api/ships` to download the active vessel dimensions to generate our Digital Twin.
- We must `POST /api/maintenance` to log real hardware degradation.

**SENIOR BACKEND -> OUR COMMAND CENTER**
- The senior dashboard should point to *our* Next.js application for the actual Live Twin view, perhaps via an `<iframe>` or redirection.

## 10. Data Model Mapping

| Our Entity (Prisma/Local) | Senior Entity (Mongoose) | Sync Direction |
|---|---|---|
| `Mission.shipName` | `Ship.name` | SENIOR -> OURS |
| `CutRecord` (Completed) | `Part` | OURS -> SENIOR |
| `EventLog` (Errors) | `Maintenance` | OURS -> SENIOR |
| `User` (Operators) | N/A | OURS only (hardware safety) |

## 11. Deployment Architecture
- **Senior:** Split deployments (Vercel for Frontend, Render/Heroku for Backend Node server + MongoDB Atlas).
- **Ours:** Monolith Next.js deployment. Edge-capable endpoints, stateful runtime for hardware sync.

## 12. Redundant Systems to Avoid
- We should **not** build Ship CRUD, Material CRUD, Feasibility metrics, or a public website. 
- The senior team should **not** build real-time socket ingestion, 3D path planning, or robot safety interlocks.

## 13. Missing Systems
- The "bridge" between the two APIs.
- Real MQTT/WebSocket live hardware telemetry (both currently use simulation/mocks).

## 14. Revised Master Track V2
See `docs/ROBOFEST_6_0_MASTER_EXECUTION_TRACK_V2.md`.
