# FILE OWNERSHIP MAP

This document maps all major directories and files in the repository to their respective owners to enforce the ZERO-OVERLAP RULE.

## TRACK A (ANSHIKA MA'AM) - DIGITAL TWIN

**Role:** Owner of all 3D geometry, visual representation, and Three.js components.
**Consumer:** None (Track A consumes Platform state).

**Directories Owned:**
- `src/components/DigitalTwin/` (Entire Directory)
  - `RobotModel.tsx`
  - `ShipHull.tsx`
  - `Tracks.tsx`
  - `Magnets.tsx`
  - `Electromagnet.tsx`
  - `CuttingArm.tsx`
  - `Torch.tsx`
  - `HoseSystem.tsx`
  - `SafetyCables.tsx`
  - `SupplySystem.tsx`
  - `CameraController.tsx`
  - `ShipyardEnvironment.tsx`
  - `ShipAssembly.tsx`
  - `SimulationController.tsx` (Visual orchestrator)

## TRACK B (DAKSH) - PLATFORM & LOGIC

**Role:** Owner of the application shell, pages, state logic, business domains, and safety rules.
**Consumer:** Track A consumes the state produced by these files.

**Directories Owned:**
- `src/app/` (Entire Application routing and page UI)
- `src/lib/` (Entire Logic/Domain layer)
  - `src/lib/domain/` (Interfaces and types)
  - `src/lib/cutting/` (Cut validation logic)
  - `src/lib/safety/` (Deterministic safety engine)
  - `src/lib/telemetry/` (Telemetry simulator & history)
  - `src/lib/state/` (Mission logic)
- `src/components/Shell/` (Application Layout UI)
- `src/components/ControlPanel/` (Command Center controls)
- `src/components/MissionControls.tsx`
- `src/components/TelemetryTrend.tsx`

## SHARED & INTEGRATION FILES

These files are integration points. **ONE track is the designated OWNER** who can edit it, the other track is the **CONSUMER** (Read-Only).

| File/Path | Owner | Consumer | Reason |
| --- | --- | --- | --- |
| `src/lib/platformStore.ts` | **Track B** | Track A | Track B models the state; Track A reads to render. |
| `docs/integration/ANSHIKA_TWIN_INTERFACE.md` | **Track A** | Track B | Track A exposes 3D visual hooks to Track B. |
| `docs/integration/DAKSH_PLATFORM_INTERFACE.md` | **Track B** | Track A | Track B exposes data contracts to Track A. |
| `package.json` | **Track B** | Track A | Track B manages platform dependencies; Track A must request new 3D packages through Track B. |
| `src/app/globals.css` | **Track B** | Track A | Track B manages global HMI design tokens. |

**No simultaneous editing of shared files is permitted.**
