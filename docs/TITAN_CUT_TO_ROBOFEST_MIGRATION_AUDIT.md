# TITAN-CUT TO ROBOFEST MIGRATION AUDIT

## 1. Current RoboFest Architecture
RoboFest (`D:\Webs\Robofest`) is a robust Next.js 16 application acting as the authoritative operational hub. It contains:
- The authoritative `@titan/digital-twin` package (v1.0.2).
- All Digital Twin assets (`public/models`, `public/textures`).
- A highly capable SSE engine (`RealtimeProvider.tsx`) that synchronizes `usePlatformStore` and `useRobotStore` directly from the backend.
- Authoritative API routes (`/api/realtime`, `/api/missions`, `/api/telemetry`).
- A deterministic safety engine and database integration.
- The `command-center` and `operations/missions` UI layouts, which are functional but lack the final presentation-ready Polish developed in the ship-cutter branch.

## 2. Current ship-cutter Architecture
The ship-cutter integration branch (`D:\Webs\ship-cutter`) was used to build the presentation-ready `OperationsLivePage` and adapt the Senior platform to communicate with RoboFest via a proxy/gateway pattern. It contains:
- `OperationsLivePage.jsx`: The highly polished, presentation-ready dashboard layout featuring `LiveSensorCard`, camera view overlays, safety badge UI, and real-time telemetry panels.
- Gateway Adapters (`useGatewayStream.js`, `robofestAdapter.js`): A layer designed to proxy SSE events through the Senior backend.
- Business UI logic not relevant to RoboFest (e.g., Senior part tracking).

## 3. Digital Twin Comparison
- **ship-cutter:** Used `@titan/digital-twin` 1.0.2 packaged as a `.tgz`, with `assetBaseUrl` passed to make static assets load correctly via the proxy.
- **RoboFest:** Already uses the **exact same version** (`1.0.2`) of `@titan/digital-twin` sourced from `packages/digital-twin`. Commit `51ce95b` in RoboFest already made the Twin portable with static assets.
- **Verdict:** The Digital Twin implementation in RoboFest is authoritative, up-to-date, and fully functional. No Digital Twin migration is required.

## 4. Migration Matrix

| Ship-cutter feature | Already exists in RoboFest? | Keep RoboFest version? | Migrate? | Exact source | Exact destination | Risk |
|---|---|---|---|---|---|---|
| **Digital Twin Package** | YES (`packages/digital-twin`) | YES | DO NOT MOVE | N/A | N/A | LOW |
| **Digital Twin Assets** | YES (`public/models`) | YES | DO NOT MOVE | N/A | N/A | LOW |
| **SSE / Realtime Client** | YES (`RealtimeProvider.tsx`) | YES | DO NOT MOVE | N/A | N/A | LOW |
| **Telemetry State Store** | YES (`usePlatformStore`) | YES | DO NOT MOVE | N/A | N/A | LOW |
| **Missions UI** | YES (`operations/missions`) | YES | DO NOT MOVE | N/A | N/A | LOW |
| **Operations Live UI** | NO (RoboFest has older UI) | NO | MIGRATE | `client/src/pages/OperationsLivePage.jsx` | `src/app/command-center/page.tsx` | MED |
| **LiveSensorCard Component** | NO | NO | MIGRATE | `OperationsLivePage.jsx` | `src/components/operations/LiveSensorCard.tsx` | LOW |
| **Safety / Badge UI** | NO | NO | MIGRATE | `OperationsLivePage.jsx` | `src/app/command-center/page.tsx` | LOW |
| **API Gateway Proxies** | NO (Unnecessary) | YES (Direct API) | DO NOT MOVE | N/A | N/A | LOW |

## 5. Exact Components to Migrate
- **OperationsLivePage UI Layout:** The complete visual layout, styling, and grid architecture of the live operations dashboard.
- **LiveSensorCard:** The polished telemetry display cards.
- **Camera Presets / Overlays:** The UI placeholders and styling for camera feeds.

## 6. Exact Components NOT to Migrate
- **@titan/digital-twin:** RoboFest already hosts the authoritative source.
- **useGatewayStream.js / robofestAdapter.js:** RoboFest's `RealtimeProvider.tsx` connects directly to its own backend, eliminating the need for gateway proxies.
- **Senior Business Logic:** Pages like Part Tracking, Feasibility, and Chatbot.

## 7. Asset Migration Plan
**Zero migration required.** All `.gltf` and texture assets already exist natively in `D:\Webs\Robofest\public`. 

## 8. State / Data Migration Plan
The migrated `OperationsLivePage` UI currently depends on the `useGatewayStream` response schema (e.g., `telemetry.raw.motors.tempLeft`). It must be re-wired to consume RoboFest's `usePlatformStore` (e.g., `sensor.motors.tempLeft`). This is a straightforward mapping but requires careful attention to the Zustand store schema.

## 9. API Simplification Plan
RoboFest will serve as the standalone deployment target.
Browser ➔ `RoboFest` Next.js ➔ `RoboFest` Backend ➔ ESP32.
No proxies or senior API layers will be preserved.

## 10. Deployment Requirements
- Next.js must be built via `npm run build` (`prisma generate && next build`).
- The standalone Next.js server will serve the Digital Twin assets directly from `/public`.
- The ESP32 hardware boundaries will remain mapped to the RoboFest backend APIs.

## 11. Risks
- **State Wiring Mismatch (Medium Risk):** The ship-cutter UI components expect a specific nested telemetry object structure provided by the proxy. Rewiring this to RoboFest's native `usePlatformStore` and `useRobotStore` might require small logic tweaks to correctly bind the live data.
- **Styling Clashes (Low Risk):** Ship-cutter uses raw Tailwind classes in a React Vite app, whereas RoboFest uses Next.js with `globals.css` and some custom `cc-` scoped classes. Minor CSS adjustments may be needed.

## 12. Ordered Implementation Phases

- **PHASE A — Digital Twin consolidation:** Verify the local RoboFest Digital Twin runs correctly without changes.
- **PHASE B — Live Operations UI:** Port the `OperationsLivePage.jsx` layout into RoboFest's `command-center` or `operations/live` route.
- **PHASE C — Telemetry/state integration:** Wire the new UI to `usePlatformStore` and `useRobotStore` instead of the old gateway.
- **PHASE D — Missions/cutting:** Verify the existing RoboFest mission UI works correctly alongside the new command center.
- **PHASE E — Safety/health/events:** Wire the new safety badges and event timeline in the UI to the RoboFest state.
- **PHASE F — Presentation shell:** Final CSS polish and layout adjustments.
- **PHASE G — Deployment verification:** Build and run the standalone app to ensure all components load and communicate correctly.
