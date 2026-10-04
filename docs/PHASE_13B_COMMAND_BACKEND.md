# PHASE 13B: SECURE & PERSIST COMMAND BACKEND

## 1. Command API
The backend command boundary at `POST /api/robot/command` has been refactored. It is no longer a blindly trusting mock. It enforces authentication, authorization, payload validation, and strict database persistence before ever returning an `ACCEPTED` (pending) response.

A new lookup endpoint `GET /api/robot/command/[id]` provides verifiable traceability of commanded actions.

## 2. Authentication
Both command endpoints are now protected by the `withAuth` boundary, extracting a verified JWT identity (`operatorId`) before proceeding. Unauthenticated requests are immediately rejected with `401 Unauthorized`.

## 3. Authorization
We have defined the minimum explicit boundary: only `OPERATOR`, `ENGINEER`, `SUPERVISOR`, and `ADMIN` roles can dispatch robot commands. 
- **IDOR Protection:** `GET /api/robot/command/[id]` enforces that an `OPERATOR` can only query commands they initiated. Higher-level roles can query any command for audit purposes.

## 4. Command Validation
The robust `validateCommand(body)` method from `src/lib/api/commands.ts` remains the source of truth. Arbitrary payloads, unknown command types, and malformed parameter objects are immediately rejected with `400 Bad Request`.

## 5. CommandRecord Schema
The `CommandRecord` model has been successfully migrated into Prisma/SQLite:
- `id` (PK)
- `commandId` (Unique Trace ID)
- `type`
- `status` (`PENDING`, `REJECTED`, etc.)
- `operatorId` (FK to User)
- `missionId` (Optional trace)
- `source`
- `payload` (JSON string)
- `reason` (Failure/Rejection notes)

## 6. Command Lifecycle
1. Request arrives.
2. Operator authenticated & authorized.
3. Command validated.
4. `CommandRecord` persists to DB as `status: PENDING`.
5. API returns `200 ACCEPTED`. (Note: This means *pending execution*, not *physically executed*).

## 7. Idempotency
`commandId` has a `@unique` database constraint. If a client retries a network-timeout command and the ID already exists, the API gracefully catches the Prisma `P2002` error and returns the existing state without duplicating the record or throwing a `500`.

## 8. Failure Semantics
- Auth Failure -> `401 / 403`
- Bad Payload -> `400`
- DB Failure -> `500` (Crucially, if the database fails, the command is NOT reported as `ACCEPTED`, preventing false execution loops).

## 9. Emergency Stop Semantics
`TRIGGER_EMERGENCY_STOP` passes identical authentication and validation. The authorization boundary deliberately allows standard `OPERATOR` roles to trigger it, ensuring the critical safety path remains unobstructed while finally gaining full backend traceability.

## 10. Hardware Boundary & False Claims
The API explicitly refuses to return a status of `EXECUTED`. The backend command boundary ends at the database `PENDING` state. We do not claim physical execution because there is no hardware transport connected yet.

## 11. Current Simulation Relationship
The browser-based Digital Twin simulation currently bypasses the persistent backend for its active loop (Phase 11B design). The backend boundary implemented here prepares the foundation for when the UI shifts from local state mutation to pure API polling.

## 12. Future Transport Relationship
In the future, a backend polling loop or background worker will read `PENDING` CommandRecords, format them for MQTT/ESP32, await hardware acknowledgement, and update the `CommandRecord` to `EXECUTED`. For now, the records safely halt at `PENDING`.
