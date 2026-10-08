# PHASE B — LIVE OPERATIONS UI MIGRATION

## Overview
This phase successfully migrated the presentation-ready "Live Operations" dashboard from the `ship-cutter` integration branch into the final `RoboFest` standalone deployment target.

## Components Migrated
- **`OperationsLivePage.jsx` (ship-cutter) ➔ `command-center/page.tsx` (RoboFest):** The entire layout structure, grid system, and bottom tab navigation were ported.
- **`LiveSensorCard`:** Ported into `src/components/operations/LiveSensorCard.tsx` and modified to use inline styles mimicking the original Tailwind classes, as RoboFest does not use Tailwind.
- **Event Timeline Styling:** Replaced the older RoboFest list style with the block-color warning styling from `ship-cutter`.
- **E-STOP Integration:** Ported the critical safety header and E-STOP button to directly trigger the RoboFest native `api/robot/command` endpoint.

## Components Intentionally NOT Migrated
- **Digital Twin Package:** RoboFest's `packages/digital-twin` v1.0.2 is the authoritative source. The twin was successfully embedded in the new layout using `<DigitalTwin />`.
- **`useGatewayStream.js`:** The proxy was discarded. The new layout directly binds to `usePlatformStore` and `useRobotStore`.
- **Gateway SSE Endpoints:** Discarded. RoboFest's `RealtimeProvider.tsx` provides the live data.

## State Mappings Used
- **Connection Status:** Mapped from `robot.status` (`usePlatformStore`).
- **Telemetry:** Mapped directly from `usePlatformStore().sensor`.
  - e.g. `telemetry.raw.motors.tempLeft` ➔ `sensor.motors.tempLeft`.
- **Safety:** Mapped directly from `usePlatformStore().safety`.
- **Environment:** Mapped directly from `usePlatformStore().environment`.
- **Missions:** Mapped directly from `usePlatformStore().mission` context.
- **Robot Command API:** The manual control tabs now trigger `POST /api/robot/command` with strict typings (e.g., `UPDATE_LOCOMOTION`, `SET_ARM_POSITION`).

## Known Limitations
- The `LiveSensorCard` and main page layout use inline styles to recreate the Tailwind look from `ship-cutter`. This ensures zero dependency overhead but slightly inflates the TSX file.
- The `Live Operations` page replaces the older Command Center. Future additions will be added to this layout instead of scattered routes.
