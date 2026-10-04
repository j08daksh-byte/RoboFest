# Phase 13H: Telemetry Backend and Data Contract

## Objective
Establish a persistent, durable telemetry backend foundation that future hardware (ESP32 via MQTT/WebSockets) can feed safely without replacing the existing simulation stack, enforcing strict source boundaries between `LIVE`, `SIMULATED`, and `HISTORICAL` operation.

## Architecture and Models
A new `TelemetryRecord` model was introduced in `prisma/schema.prisma` mapping to the canonical `TelemetrySample` from the existing `domain/index.ts`.
This model stores all critical robot vitals including IMU, power, motors, hardware actuators (torch, arm, magnet), environmental conditions, and positional state.

## Ingestion API (`POST /api/telemetry`)
* **Durable Telemetry Ingestion**: Exposes an endpoint accepting incoming JSON payloads for telemetry storage.
* **Authentication**: Secured by `withAuth` requiring `OPERATOR`, `ENGINEER`, `ADMIN`, or `SUPERVISOR` roles.
* **Live Constraint Enforcement**: It strictly forbids typical HTTP clients from assigning `SystemMode.LIVE` to telemetry, reserving this trusted state for the eventual hardware adapters (or preventing users from spoofing actual hardware safety signals).
* **Anomaly Event Generation**: Automatically detects out-of-bound or critical faults (e.g. `overallHealth === 'CRITICAL'`) and generates corresponding `EventLog` entries with `SENSOR_FAULT` classifications to notify supervisors/planners.
* **Bounded Retention Strategy**: Enforces a rolling window of history (currently bounded at 1000 samples per mode). High-frequency streams will seamlessly delete oldest records, ensuring the SQLite database does not bloat indefinitely during continuous operations.

## Read API (`GET /api/telemetry` & `/api/telemetry/latest`)
* **Bounded History Extraction**: Queries records scoped securely to mode (e.g. `SIMULATED`), capping output via bounded logic (max 500 samples), serving UI elements like `Sparkline` cleanly.
* **Latest Sample Projection**: The `/api/telemetry/latest` endpoint allows dashboards to poll current metrics efficiently without transmitting long arrays over the wire.

## Frontend Modifications
* **Sensor Center Connections (`robot/sensors/page.tsx`)**: Upgraded to optionally hydrate `usePlatformStore().telemetryHistory` directly from the backend API, enabling cross-session and cross-browser history retrieval when `systemMode !== 'SIMULATED'`.
* **Telemetry Simulator (`lib/telemetry/simulator.ts`)**: Updated to emulate a periodic (1Hz average) network flush to the `/api/telemetry` API. The simulator retains its native 10Hz local simulation speeds for the visualizer while fulfilling backend persistence logic dynamically.

## Health Link & Extensibility
* Exposed exact subsystem metrics (e.g. `envCombustibleGasLel`, `motorTempLeft`) that the Phase 8 Deterministic Strategy Engine can leverage.
* Since it's decoupled, future implementations involving physical hardware just target the exact same API to map real sensor reads onto the Robot Twin logic.

## Validation Status
* Full unit and integration tests successfully implemented and passed against telemetry CRUD boundary (`telemetry.test.ts`).
* Local builds and Next.js compiler completed without validation errors.
* Reusable contracts from the existing `domain` folder successfully extended without breaking any legacy simulation code.
