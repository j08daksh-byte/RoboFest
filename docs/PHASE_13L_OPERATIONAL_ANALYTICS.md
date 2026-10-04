# PHASE 13L — OPERATIONAL PERFORMANCE AND LIFETIME ANALYTICS

## Overview
This phase replaces static, hard-coded lifetime statistics with dynamic, operationally derived analytics. The Command Center's Robot Passport, Analytics, and Performance views now strictly reflect real telemetry, missions, cuts, and events recorded in the SQLite database.

## Architecture & API
- **Removed Static State**: Deprecated and deleted the `LifetimeStatistic` model and singleton approach from the Prisma schema and `healthEngine.ts`.
- **Unified Analytics Endpoint**: Implemented `GET /api/analytics` that performs dynamic aggregation of:
  - Missions (Total, Completed, Aborted, Paused)
  - Cuts (Total Planned, Completed, Aborted, Failed)
  - Events (Safety Events, Maintenance Interventions, Critical Faults)
  - Time tracking (Average Mission Duration, First/Last operational timestamps)
  - Current Health (Active Component Faults and Warnings distribution)
- **Time Windows**: The API natively supports time bounding (`timeRange=today|7d|30d|all`) using strict date range queries.

## Frontend Integration
- **Analytics Page** (`/intelligence/analytics`): Updated to show operational efficiency (mission completion rates, cut success rates) and system utilization metrics directly derived from the database, eliminating the previous "Insufficient Data" empty states.
- **Performance Page** (`/intelligence/performance`): Displays timing metrics like Average Mission Duration, Avg Cuts per Mission, Abort rates, and Fault frequency.
- **Robot Passport** (`/robot/passport`): Refactored to consume the unified analytics endpoint. Commissioning date and Operating Time are now correctly parsed from the operational event logs rather than hard-coded placeholders. 

## Testing and Verification
- **Test Suite Updates**: 
  - Purged all unit tests asserting over `LifetimeStatistic`.
  - Added test case verifying valid `GET /api/analytics` structure within the health API tests suite.
  - Test suite passes with 105/105 tests across all backend systems.
- **No Data Loss**: Dropped `LifetimeStatistic` correctly with safe Prisma DB push in local dev environment.

## Unresolved Limitations
- `totalRuntimeSeconds` is currently proxied by taking the max `runtimeSeconds` across components. When physical hardware is connected via MQTT (Phase 14A), real uptime tick events should stream directly into a persistent high-frequency store.
- Fault frequency calculation divides the total lifetime faults by the total active component operating hours. This is an approximation until rigorous session-based uptime tracking is enabled.
