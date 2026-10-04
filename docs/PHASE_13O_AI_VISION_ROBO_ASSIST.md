# PHASE 13O — AI CUT STRATEGY + VISION + ROBO-ASSIST

## Overview
This phase integrated the AI Cut Strategy, Vision interface, and Robo-Assist chat into a unified, functional operational advisory layer. The architecture explicitly restricts AI from circumventing deterministic safety systems, maintaining a clear boundary between operational execution (authoritative) and AI suggestion (advisory).

## 1. AI Cut Strategy Engine
- **Deterministic Validation:** `generateDeterministicStrategy` now acts as the underlying logic for AI-assisted geometry resolution. It computes gas optimization, cut sequence, and structural warnings strictly based on backend constraints.
- **Backend API:** Created `POST /api/ai/strategy`.
- **Confidence Handling:** We strictly return `UNKNOWN` for AI confidence. The system does not hallucinate arbitrary percentages for cut probability.
- **Operator Acceptance:** Accepted strategies create a definitive log via the `EventLog` and can be treated as planned Draft Cuts.
- **Event Logging:** Successfully generates an `AI_RECOMMENDATION_CREATED` event on computation.

## 2. Vision System
- **API Contract:** Created `POST /api/ai/vision` to generate `VisionCandidate` payloads representing detected cuts.
- **Truthfulness (Simulated Flag):** The payload prominently injects `isSimulated: true`, and the UI explicitly declares `SIMULATED CAMERA` / `NO PHYSICAL CAMERA CONNECTED`, fully honoring the directive not to fabricate physical reality.
- **Operator Conversion:** Operators can review vision candidates and manually convert them into `Draft Cuts`. This initiates a full safety-boundary validation, rejecting direct vision-to-actuator control loop bypasses.

## 3. ROBO-ASSIST Grounding
- **Context API:** Built `POST /api/ai/robo-assist` to handle operator queries.
- **Backend-State Grounded:** The query engine parses intent and explicitly searches the `RuntimeState`, `HealthEvent`, and `Mission` tables from the Prisma store to formulate responses.
- **No Hallucination:** If the query falls outside of real system states, it returns a hardcoded refusal to guess.
- **Live Testing:** Asking "What is the current robot health?" or "Is the emergency stop active?" queries real events deterministically. 

## 4. Safety Boundary Enforcement
- All AI features exist behind the existing strict `withAuth` security perimeter.
- No AI logic is permitted to manipulate `RuntimeState` actuator targets or safety interlocks directly. They can only emit `ADVISORY` payloads.

## 5. Tests
- Created `src/lib/ai/ai.test.ts` to validate deterministic rules (e.g., that high-energy cuts are marked sub-optimal and structural conflicts are accurately recognized).
- Confirmed the core safety and command integration test suites (`108/108`) continue to pass successfully.

## Unresolved Limitations
- The Robo-Assist parsing currently utilizes basic substring matching (`.includes('health')`) to fetch Prisma state rather than invoking an LLM for Natural Language Understanding (NLU). Implementing a true LangChain/OpenAI LLM processing agent would dramatically improve intent classification but is deferred until a formal ML infrastructure requirement is scoped.
- Vision candidates are simulated as rectangles; actual OpenCV or segmentation model integration is pending physical camera payload availability.
