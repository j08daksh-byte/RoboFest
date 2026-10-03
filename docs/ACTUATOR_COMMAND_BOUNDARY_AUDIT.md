# ACTUATOR COMMAND BOUNDARY AUDIT

## Phase 4H

### 1. Locomotion (`updateLocomotion` / `setLocomotionIntent`)
- **Authoritative state:** `robotState.ts` (`position`, `locomotionIntent`)
- **Mutation function:** `updateLocomotion(x, y, trackOffsetDelta)`
- **UI callers:** ControlPanel D-Pad (via `setLocomotionIntent`)
- **Simulation callers:** Keyboard listeners in `SimulationController` (via `setLocomotionIntent`), then `useFrame` loop calls `updateLocomotion`.
- **Current safety permission:** `safety.movementPermission`
- **Enforced at mutation boundary:** YES. `updateLocomotion` silently drops the mutation if permission is false.
- **Emergency stop affects it:** YES. E-Stop sets `EVACUATION` level, dropping `movementPermission`.
- **Hardware Adapter Risk:** HARDWARE-DEPENDENT. `locomotionIntent` (the joystick vector) is NOT interlocked, only the physical `position` change is. A future hardware adapter that blindly pipes `locomotionIntent` to physical motors over ESP32 without checking `movementPermission` will bypass the safety engine. 
- **Status:** HARDWARE-DEPENDENT (Requires attention during hardware integration)

### 2. Torch (`setTorch`)
- **Authoritative state:** `robotState.ts` (`torch.enabled`)
- **Mutation function:** `setTorch(enabled: boolean)`
- **UI callers:** ControlPanel Toggle Button
- **Simulation callers:** `SimulationController` (forces `false` on system reset)
- **Current safety permission:** `safety.torchPermission`
- **Enforced at mutation boundary:** YES. Cannot be turned on if `torchPermission` is false. Can always be turned off.
- **Emergency stop affects it:** YES. Drops `torchPermission`.
- **Hardware Adapter Risk:** Safe. The authoritative `torch.enabled` boolean itself cannot become true unsafely.
- **Status:** PASS

### 3. Arm (`setArmPosition`)
- **Authoritative state:** `robotState.ts` (`arm.yPosition`, `arm.xExtension`)
- **Mutation function:** `setArmPosition(y, x)`
- **UI callers:** ControlPanel sliders
- **Simulation callers:** None
- **Current safety permission:** `safety.movementPermission`
- **Enforced at mutation boundary:** YES (Fixed in Phase 4G).
- **Emergency stop affects it:** YES. Drops `movementPermission`.
- **Hardware Adapter Risk:** Safe. The authoritative state itself cannot mutate unsafely.
- **Status:** PASS

### 4. Electromagnet (`setElectromagnet`)
- **Authoritative state:** `robotState.ts` (`electromagnet.enabled`)
- **Mutation function:** `setElectromagnet(enabled: boolean)`
- **UI callers:** ControlPanel toggle
- **Simulation callers:** `SimulationController` (Spacebar hotkey)
- **Current safety permission:** None defined.
- **Enforced at mutation boundary:** NOT-APPLICABLE.
- **Emergency stop affects it:** NO.
- **Hardware Adapter Risk:** N/A.
- **Status:** NOT-APPLICABLE (No safety rule explicitly defines electromagnet shedding during emergencies in the current architecture).

### 5. Emergency Stop (`forceEStop` / `emergencyStateActive`)
- **Authoritative state:** Evaluated in `safetyEngine.ts` via `telemetrySimulator`'s scenario injection.
- **Mutation function:** `telemetrySimulator.setScenario(EMERGENCY_STOP)` (Currently simulated).
- **Behavior:** Forces `safetyLevel` to `EVACUATION`, setting `emergencyStateActive` to `true`, which deterministically evaluates `torchPermission` and `movementPermission` to `false`. 
- **Enforced at mutation boundary:** YES, downstream actuators respect the computed permissions.
- **Status:** PASS

### 6. Cutting/Torch Bypass Analysis
- **Behavior:** Traced all occurrences of `torch.enabled` state changes. The ONLY path that sets it to true is `useRobotStore.getState().setTorch(true)`, which contains the structural interlock.
- **Status:** PASS
