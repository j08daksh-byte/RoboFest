# PHASE 13N — REAL-TIME OPERATIONAL TRANSPORT

## Overview
This phase implemented a secure application-level real-time transport between the backend and the Next.js Command Center frontend. This ensures state mutations originating from other sources or from backend evaluations are instantly propagated to the frontend interface.

## 1. Transport Technology Selection
- **Technology Chosen:** Server-Sent Events (SSE).
- **Justification:** In a Next.js App Router context (where API routes might be serverless), long-lived native WebSockets require either a dedicated custom server runtime or external third-party services (like Pusher/Redis). However, Server-Sent Events (SSE) map cleanly onto standard HTTP/2 and operate natively within standard Next.js Response streams using `ReadableStream`. SSE supports uni-directional broadcast (server-to-client) which perfectly fits the Command Center's requirement to receive state changes, while mutations continue to be safely requested through strongly-typed API REST routes.

## 2. Real-Time Architecture & Event Contract
- Created `RealtimeBroker` (`src/lib/realtime/broker.ts`), acting as an in-memory PubSub coordinator for connected SSE clients.
- Defined a canonical `RealtimeEvent` schema (`src/lib/realtime/types.ts`) supporting:
  - `RUNTIME_STATE_UPDATED`
  - `COMMAND_STATUS_CHANGED`
  - `MISSION_UPDATED`
  - `CUT_UPDATED`
  - `TELEMETRY_UPDATED`
  - `SAFETY_CHANGED`
  - `HEALTH_UPDATED`
  - `EVENT_CREATED`
- API routes acting as mutation boundaries now invoke `realtimeBroker.publish()` immediately after database persistence.

## 3. Authentication
- The `/api/realtime` SSE route strictly evaluates the secure `auth_token` `HttpOnly` cookie via standard auth boundaries. 
- Unauthenticated or improperly authorized connections are immediately rejected with `401 Unauthorized` before a stream is established.
- Role validations prevent untrusted clients from receiving operational data.

## 4. Frontend Integration & Reconnect Behavior
- Implemented `RealtimeProvider` (`src/components/RealtimeProvider.tsx`) enclosing the active Shell components.
- The provider instantiates a single authoritative `EventSource` connection.
- **Resilience and State Reconciliation:** Upon successful connection (or reconnection), the frontend automatically issues a bounded authoritative reconciliation fetch to `/api/robot/state` to synchronize any events that might have been dropped during a disconnection. Reconnections apply exponential backoff.
- Hooked the provider directly into `usePlatformStore` and `useRobotStore` to selectively update components in real-time.

## 5. Performance and Telemetry Throttling
- The `RealtimeBroker` actively throttles continuous high-frequency metrics like `TELEMETRY_UPDATED` (e.g., dropping broadcasts within a 1-second rolling window) to prevent CPU or TCP saturation.
- Actual underlying telemetry persistence operates synchronously unaffected by this UI optimization.

## 6. Safety Context
- Real-time SSE represents an observability mechanism, *not* a safety-critical executor. 
- Server-side safety logic continues to evaluate deterministically synchronously in response to `POST /api/robot/command` independently of whether an SSE client receives the `RUNTIME_STATE_UPDATED` event.

## 7. Testing and Validation
- Confirmed `105/105` test cases continue passing successfully.
- Validated TypeScript/ESLint constraints across the entire workspace.
- Simulation modes remain independently fully functional.

## Deployment Note for Production
The current `RealtimeBroker` is instantiated as a Node.js global singleton. This works perfectly for local edge deployments or single-instance Next.js deployments. If deploying this to a multi-instance Vercel edge/lambda array or horizontally scaled environment in the future, the broker should be substituted with an external PubSub backplane (e.g., Redis).
