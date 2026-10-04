# PHASE 12A: SENIOR API CONTRACT & SYNC SAFETY AUDIT

## 1. Verified Endpoints
Based on the existing two-repository integration audit, the following endpoints on the Senior Express backend are verified as the intended synchronization targets:
- `GET /api/ships` (or `GET /api/ships/:id`): Fetch active ship dimensions for the Digital Twin.
- `POST /api/parts`: Push a completed cut offcut as a business part record.
- `POST /api/maintenance`: Sync hardware degradation and critical robot faults.
- `PUT /api/operations/:id`: Update the overall business status of a cutting operation.

## 2. Unverified Endpoints
- Any `DELETE` or `PATCH` endpoints.
- Any endpoints related to `Material`, `Feasibility`, `Photo`, `BlogPost`, or `Contact`. We will strictly avoid interacting with these business domains.
- Deep relational nesting endpoints (e.g., `GET /api/ships/:id/parts`).

## 3. Ship API Contract & Fallback Hazard
- **Contract**: `GET /api/ships/:id`
- **Hazard**: The Senior backend implements a graceful fallback using `server/config/seedData.js` when MongoDB is down. 
- **Safety Criticality**: **UNSAFE FOR SAFETY-CRITICAL GEOMETRY**. If our Command Center silently accepts seed/mock ship geometry, the robot's inverse kinematics and path planner will generate cuts for a physically inaccurate hull, causing collisions or air-cuts.
- **Requirement**: Our adapter must explicitly reject responses that match known seed signatures, verify response timestamps, and require strict validation before allowing the Digital Twin to ingest the hull.

## 4. CutRecord → Senior Part Mapping
**Our Schema (`CutRecord`):**
- `id` (UUID)
- `missionId` (UUID)
- `geometryJson` (Complex 3D vertices/paths)
- `status` (Enum)
- `createdAt` (Timestamp)

**Senior Schema (`Part` - Business Offcut):**
- **Mapping**: Our `CutRecord` signifies a physical piece of scrap dropping.
- `id` → `localCutId` (Passed for idempotency, if supported).
- `missionId` → mapped to `operationId`.
- `geometryJson` → **AUTHORITATIVE LOCALLY**. The Senior `Part` schema likely tracks weight, material, and bounding box for recycling/ROI. We will *not* force our complex 3D toolpath into the Senior `Part` model. Our database remains the sole authority for physical cut geometry.
- `createdAt` → `completionDate`.

## 5. Maintenance API Contract
- **Contract**: `POST /api/maintenance`
- **Usage**: The Senior platform uses this for business-level maintenance scheduling and logging.
- **Our Integration**: We will only push `EventLog` records with `severity = CRITICAL` or category `SAFETY/ROBOT_STOP`. This is a downstream asynchronous sync. It is *not* a replacement for our local, real-time diagnostic event history.

## 6. Safety Boundary
**RULE**: Senior API synchronization MUST NEVER be inside the real-time execution loop.
1. The robot cuts.
2. The panel drops.
3. The `CutRecord` is finalized in our local SQLite database.
4. *Only then* is an asynchronous payload queued to `POST /api/parts`.
5. **If Senior API is down: The robot continues operating normally.** The failure is logged as an operational sync warning, not a hardware stop.

## 7. Idempotency Strategy
Because we do not know if the Senior API natively enforces idempotency via request headers (e.g. `Idempotency-Key`), we must:
1. Include our `CutRecord.id` as a reference ID in the payload.
2. Manage a `syncStatus` flag (or a separate `SyncQueue` table) locally.
3. If a network timeout occurs, our adapter should theoretically perform a `GET /api/parts?localCutId=...` to verify if the previous POST succeeded before blindly retrying, to prevent duplicate inventory on the Senior side.

## 8. Failure/Retry Policy
- **Network Timeout / 5xx**: **RETRYABLE**. Queue the sync locally and retry with exponential backoff.
- **Senior MongoDB Fallback (Seed Data)**: **NON-RETRYABLE/BLOCKING**. Treat as 5xx. Do not accept seed data for ships.
- **HTTP 400 (Bad Payload)**: **NON-RETRYABLE**. Log locally as a critical integration fault.
- **HTTP 401/403**: **NON-RETRYABLE** until operator re-authenticates the API bridge.

## 9. Integration Adapter Design
```typescript
// src/lib/integration/senior/SeniorPlatformClient.ts
// Handles base URL, auth, and retry logic.

// src/lib/integration/senior/PartAdapter.ts
export interface PartAdapter {
  exportCutRecord(record: CutRecord): Promise<void>;
}

// src/lib/integration/senior/ShipAdapter.ts
export interface ShipAdapter {
  fetchActiveShip(shipId: string): Promise<ShipGeometry>; // Strictly validates against seed data
}
```

## 10. Environment Configuration
Required `.env` values (DO NOT hardcode in source):
- `SENIOR_API_URL`
- `SENIOR_API_TOKEN` (or client credentials)

## 11. Exact Phase 12B Requirement
**PHASE 12B**: Implement the abstract Senior Integration Adapter interfaces and local retry queue mechanism in `src/lib/integration/senior/`, preparing the boundary without executing live requests.
