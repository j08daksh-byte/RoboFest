# PHASE 10B: PERSISTENT DATA FOUNDATION & DESIGN

## 1. Database Technology Decision

**Current Status in Repository:**
- Inspection of `package.json` confirms **no database adapter or ORM is currently installed**.
- There are no environment variables or configuration files dictating a database choice (e.g., Supabase, PostgreSQL, Prisma, Drizzle).

**Recommended Database Approach:**
- **Primary Recommendation:** PostgreSQL managed via Prisma ORM.
- **Why:** The platform involves strong relational boundaries (User -> Role, Mission -> Cuts, Mission -> Events, Robot -> Telemetry). Prisma provides strict type-safety which perfectly complements the extensive deterministic types already established in `src/lib/domain/index.ts`.
- **Alternative (Minimal):** SQLite via `better-sqlite3` + Kysely/Drizzle for an embedded edge-compatible persistence layer if avoiding external infrastructure is required.

**Decision:**
Per the project mandate ("DO NOT silently introduce a large dependency stack. Instead document the recommended option and stop before irreversible setup if an explicit product decision is required"), **I have stopped before irreversible setup.** No database ORM or driver has been installed. The API routes implemented below use strict request validation but defer the actual storage side-effect to a `[REQUIRES DB DECISION]` stub.

---

## 2. Persistent Domain Boundary

I have defined the minimum persistent entities justified by the current implementation.

### Priority 1 (Implemented API Stubs)

**A. Mission**
- **Purpose:** Cross-session state for ship-hull cutting operations.
- **Primary Identifier:** `id` (UUID).
- **Important Fields:** `shipName`, `objective`, `status`, `startTime`, `estimatedCompletionTime`.
- **Relationships:** Has many `CutPlan`, Has many `CutRecord`.
- **Mutable Fields:** `status`, `progressPercentage`, `currentCutReference`.
- **Source of Truth:** Database.

**B. CutPlan / CutRecord**
- **Purpose:** Store the geometry planned for a mission, and track which cuts are completed.
- **Primary Identifier:** `id` (UUID).
- **Important Fields:** `missionId`, `geometry_json` (Plan), `status` (Record), `completedAt`.
- **Relationships:** Belongs to `Mission`.
- **Immutable Fields:** `geometry_json` (once approved).
- **Mutable Fields:** `status`.
- **Source of Truth:** Database.

**C. System/Event History (EventLog)**
- **Purpose:** Audit and track safety alerts, sensor faults, and mission events.
- **Primary Identifier:** `id` (UUID).
- **Important Fields:** `category`, `severity`, `message`, `timestamp`.
- **Relationships:** Belongs to `Mission` (optional), Belongs to `User` (optional).
- **Immutable Fields:** All (Append-only).
- **Source of Truth:** Database.

### Priority 2 & 3 (Deferred)

- **MaintenanceRecord & HealthEvent:** Deferred. Requires a clearer specification on component-level tracking vs general robot faults.
- **User / Role / Permission:** Deferred. Will be implemented when the Authentication Provider (NextAuth/JWT) is selected.
- **KnowledgeDocument:** Deferred. Will be implemented alongside the CMS selection.
- **Notifications:** Deferred until real-time websocket pushes are established.

---

## 3. Persistence API Boundary

I have implemented the following internal API routes to establish the backend contract and validation layer:

- `POST /api/missions`
- `GET /api/missions`
- `POST /api/missions/[id]/cuts`
- `POST /api/events`

**Validation & Security Protections:**
- **Request Validation:** Every route validates the incoming JSON against the deterministic types in `src/lib/domain/index.ts`.
- **Mass-Assignment Protection:** Arbitrary object spreading is blocked; only explicit allowed fields are extracted from the request payload.
- **Missing Identifier Protection:** Sub-resources (e.g. cuts) enforce the presence of valid parent IDs (`missionId`).
- **Security Boundary:** Currently marked as `// TODO: Phase 10C Auth Enforcement`. Authorization is pending the Identity Provider decision.

---

## 4. Simulation vs Persistent-Data Boundary

To ensure the simulator does not silently write endless telemetry into the production database:
- The persistent API endpoints explicitly reject `SIMULATED` event categories if not explicitly requested, or label them as such.
- `telemetrySimulator.ts` has **not** been connected to the persistent API.
- The Digital Twin continues to run solely on `platformStore` and `robotState`, completely isolated from these new persistent API routes.
- The database is treated as historical/server authority, not the live simulation authority.
