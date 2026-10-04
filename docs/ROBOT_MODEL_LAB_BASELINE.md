# ROBOT MODEL LAB BASELINE

## Purpose
This document establishes the baseline for the Robot Model Lab. The purpose of the lab is to allow independent visual and mechanical redesign of the Robofest 6.0 robot model without destabilizing the main Digital Twin.

## 1. Existing Digital Twin Robot Inventory
The current robot model in the Digital Twin is composed of the following React components and logic files:

- **RobotModel** (`src/components/DigitalTwin/RobotModel.tsx`): The root assembly, holding the chassis, top deck, and orchestrating child components.
- **Tracks** (`src/components/DigitalTwin/Tracks.tsx`): Renders left and right tracks using basic box geometries and incorporates permanent magnets.
- **Electromagnet** (`src/components/DigitalTwin/Electromagnet.tsx`): The central engagement mechanism.
- **CuttingArm** (`src/components/DigitalTwin/CuttingArm.tsx`): The arm extending laterally.
- **Magnets** (`src/components/DigitalTwin/Magnets.tsx`): The permanent magnets array within the tracks.
- **Torch** (`src/components/DigitalTwin/Torch.tsx`): The cutting tool attached to the arm.
- **HoseSystem** & **SafetyCables** (`src/components/DigitalTwin/HoseSystem.tsx`, `SafetyCables.tsx`): External attachments that connect the robot to the ship/environment.
- **robotConfig.ts** (`src/lib/robotConfig.ts`): The centralized configuration holding current dimensions and offsets.

### Dependency Boundaries
- The current `RobotModel` relies on `useRobotStore` (Zustand) for its position, rotation, arm extension, and torch states.
- It is instantiated inside `index.tsx` (the main Digital Twin canvas), tightly coupled with `ShipAssembly` and `SimulationController`.

## 2. Coordinate System Mapping
**Existing Digital Twin Convention:**
- **Y-Axis**: Longitudinal (Movement direction, along the track length).
- **X-Axis**: Lateral (Width direction, arm extension direction).
- **Z-Axis**: Vertical (Height above the hull).

**Requested Convention:**
- **X-Axis**: Longitudinal direction
- **Y-Axis**: Lateral direction
- **Z-Axis**: Vertical direction

*Note:* Because changing the world coordinate system would break the existing Digital Twin, the Robot Model Lab will either maintain the existing Y-longitudinal convention internally, or we must explicitly map X to Y at the root of the RobotModelLab component if we adopt the requested convention. For now, the existing `robotConfig` (Y=Longitudinal, X=Lateral) dictates the world behavior.

## 3. Known vs Unknown Dimensions (Parametric Config)

**Known/Current Baseline Dimensions (from `robotConfig.ts`):**
- Body Length (Y): 0.8m
- Body Width (X): 0.5m
- Body Height (Z): 0.15m
- Track Width: 0.12m
- Track Length: 0.9m
- Track Height: 0.18m
- Electromagnet Radius: 0.1m
- Arm Extension: 0.2m to 1.0m
- Torch Radius: 0.02m

**Unknown/Placeholder Dimensions (To be refined in Lab):**
- Exact track link dimensions (ESTIMATE)
- Drive wheel/Idler wheel radius and spacing (ESTIMATE)
- Track roller positions (ESTIMATE)
- Fasteners and bracket dimensions (PLACEHOLDER)
- Electronics housing geometry (ESTIMATE)
- Sensor assembly mounting points (ESTIMATE)

## 4. Robot Model Lab Architecture
A new, isolated route `/robot-lab` has been created.
The new components are located in `src/components/RobotModelLab/` and establish a clean, detailed mechanical boundary:

- `RobotAssembly`
- `RobotChassis`
- `LeftTrackAssembly` / `RightTrackAssembly`
- `TrackLink`
- `DriveWheel` / `IdlerWheel` / `TrackRoller`
- `PermanentMagnetAssembly` / `ElectromagnetAssembly`
- `TopDeck`
- `CuttingArmAssembly` / `ArmXAxis` / `ArmYAxis`
- `TorchHolder` / `OxyAcetyleneTorch`
- `RobotHoseConnection`
- `ElectronicsHousing`
- `SensorAssembly`
- `FastenersAndBrackets`

## 5. Main Digital Twin Preservation
The original components in `src/components/DigitalTwin/` remain untouched. The existing `RobotModel` and `robotConfig.ts` are preserved. The Robot Model Lab is a strictly visual testing ground and imports the existing `RobotModel` side-by-side with the new `RobotAssembly` as a baseline reference.
