# PHASE 11E: SAFE DEPRECATION AUDIT

## 1. Ship Route Audit (`src/app/ship/*`)
All pages within the `/ship/` module are UI scaffolds containing empty states and a `[systemMode]` badge. They do not hold state, algorithms, or components. 

- `src/app/ship/map/page.tsx`: Placeholder for a "Ship / Hull Map".
- `src/app/ship/internal-structure/page.tsx`: Placeholder for "Internal Structure".
- `src/app/ship/shipyard/page.tsx`: Placeholder for "Digital Shipyard".

**Analysis:** The Senior platform maintains Ship CRUD (fleet records, dimensions). Our Command Center utilizes the Digital Twin (`src/components/DigitalTwin/*` and `src/app/command-center`) as the sole operational visualization surface for ship geometry, path planning, and internal ribs. The standalone `/ship` viewer pages are redundant UI scaffolds. 

## 2. Records Route Audit (`src/app/records/*`)
All pages within the `/records/` module are UI scaffolds. 

- `src/app/records/knowledge-base/page.tsx`: Placeholder for SOPs and CMS.
- `src/app/records/maintenance/page.tsx`: Placeholder for service schedules.
- `src/app/records/history/page.tsx`: Placeholder for event history.

**Analysis:**
- **Knowledge Base**: The Senior platform owns the Blog/CMS. This is a redundant business feature.
- **Maintenance**: The Senior platform owns business-level maintenance records. While our robot experiences faults and safety limits, these trigger `SystemEvent`s in our `PlatformStore` which will be synced to the Senior maintenance API. The local UI for managing service schedules is redundant.
- **History**: Event history and hardware diagnostics are **safety-critical operational data**. Our system owns real-time event logs, emergency state changes, and live diagnostics. This route is an operational necessity and must be kept/adapted to display the SQLite `EventLog` table and in-memory `SystemEvent`s.

## 3. Dependency Graph & Navigation
- **State/Logic**: No Zustand stores, API routes, cutting algorithms, or Digital Twin components import from `/ship` or `/records`.
- **Navigation**: The `Sidebar.tsx` hardcodes links to these pages. `src/app/ship/page.tsx` and `src/app/records/page.tsx` act as sub-navigation hubs. 
- **Tests**: No tests depend on these routes.

## 4. Digital Twin Dependencies
The Digital Twin (`src/components/DigitalTwin/*`) depends on `src/lib/geometry/shipConfig.ts` for geometry constraints and `platformStore`/`robotState` for real-time positioning. It possesses **zero dependency** on the Next.js routes in `src/app/ship/*`. 

## 5. Operational vs Business Ownership
- **SENIOR OWNS (Business/Platform Records)**: Ship Fleet CRUD, Part Offcuts (ROI/Inventory), Blog/CMS, General Maintenance Schedules.
- **OUR REPO OWNS (Operational State)**: Live Digital Twin visualization, cutting physics, hardware safety events, high-frequency telemetry history, deterministic emergency bounds.

## 6. Deprecation Decision Matrix

| Current Route/File | Purpose | Dependency | Senior Duplicate | RF6 Operational Need | Decision |
|---|---|---|---|---|---|
| `src/app/ship/map` | Placeholder ship viewer | Sidebar link | Yes (Ship CRUD) | No (Twin handles this) | **DELETE-SAFE** |
| `src/app/ship/internal-structure` | Placeholder ribs viewer | Sidebar link | Yes (Ship Details) | No (Twin handles this) | **DELETE-SAFE** |
| `src/app/ship/shipyard` | Placeholder yard view | Sidebar link | N/A | No (Twin handles this) | **DELETE-SAFE** |
| `src/app/records/knowledge-base` | Placeholder documentation | Sidebar link | Yes (Blog/CMS) | No (Business SOPs) | **DELETE-SAFE** |
| `src/app/records/maintenance` | Placeholder service schedule| Sidebar link | Yes (Maintenance) | No (Business scheduling) | **DELETE-SAFE** |
| `src/app/records/history` | Event & telemetry history | Sidebar link | No (Senior lacks live RT events) | **YES** (Auditability, fault tracing) | **ADAPT** |
| `src/app/ship/page.tsx` | Sub-navigation hub | Sidebar | N/A | No | **DELETE-SAFE** |
| `src/app/records/page.tsx` | Sub-navigation hub | Sidebar | N/A | No | **ADAPT** |

## 7. Senior Integration Implications
- **For `DELETE-SAFE` (Ship Map/Internal Structure/Knowledge Base/Maintenance)**: We delete these Next.js routes. To acquire ship geometry, we will implement `ShipSnapshot adapter` to pull the active ship from the Senior API into our Zustand store. Hardware faults will trigger an API call to sync with the Senior Maintenance API, completely headlessly.
- **For `ADAPT` (History)**: We keep `src/app/records/history`. It will be adapted to query our local SQLite `EventLog` and Zustand `telemetryHistory`, serving as the primary local diagnostic screen for the operator.

## 8. Exact Deletion Plan (Next Task)
1. Delete `src/app/ship` folder entirely.
2. Delete `src/app/records/knowledge-base` folder.
3. Delete `src/app/records/maintenance` folder.
4. Remove corresponding link definitions from `src/components/Shell/Sidebar.tsx`.
5. Update `src/app/records/page.tsx` to redirect to `/records/history` or remove it if history becomes top-level.
