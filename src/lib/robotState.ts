import { create } from 'zustand';
import { robotConfig } from './robotConfig';
import { usePlatformStore } from './platformStore';
import { usePlannerStore } from './cutting/plannerStore';
import { CutGeometry, CutMaterial } from './cutting/domain';

export interface CutRecord {
  id: string;
  path: Array<{x: number, y: number}>;
  isClosed: boolean;
  timestamp: string;
  plannedCutId?: string;
  missionId?: string;
  geometry?: CutGeometry;
  material?: CutMaterial;
  estimatedDurationSeconds?: number;
}

export interface RobotState {
  position: { x: number; y: number; z: number };
  orientation: { roll: number; pitch: number; yaw: number };
  arm: { yPosition: number; xExtension: number };
  tracks: { leftSpeed: number; rightSpeed: number };
  electromagnet: { enabled: boolean };
  torch: { enabled: boolean };
  simulationState: 'playing' | 'paused' | 'reset';
  uiMode: 'debug' | 'presentation';
  xRayMode: boolean;
  followMode: boolean;
  cameraTarget: 'robot' | 'cut' | 'ship' | 'free' | 'starboard' | 'port' | 'front' | 'rear';
  cameraFocusTrigger: number;
  
  // Cut tracking
  activeCutPath: Array<{x: number, y: number}>;
  completedCuts: CutRecord[];
  
  // Locomotion specific
  locomotionIntent: { x: number; y: number };
  trackOffset: number; // for animating the crawler belts
  fifthCableLength: number;
  
  // Actions
  setArmPosition: (y: number, x: number) => void;
  setElectromagnet: (enabled: boolean) => void;
  setTorch: (enabled: boolean) => void;
  setSimulationState: (state: 'playing' | 'paused' | 'reset') => void;
  setUiMode: (mode: 'debug' | 'presentation') => void;
  setXRayMode: (enabled: boolean) => void;
  setFollowMode: (enabled: boolean) => void;
  triggerCameraFocus: (target: 'robot' | 'cut' | 'ship' | 'free' | 'starboard' | 'port' | 'front' | 'rear') => void;
  addCutPoint: (x: number, y: number) => void;
  completeCut: (isClosed?: boolean) => void;
  commitClosedCuts: (newPolygons: Array<{id: string, points: Array<{x: number, y: number}>}>) => void;
  discardActiveCut: () => void;
  clearAllCuts: () => void;
  setLocomotionIntent: (x: number, y: number) => void;
  updateLocomotion: (x: number, y: number, trackOffsetDelta: number) => void;
  reset: () => void;
}

const initialState = {
  position: { x: 0, y: 0, z: 0 },
  orientation: { roll: 0, pitch: 0, yaw: 0 },
  arm: { yPosition: 0, xExtension: 0.3 }, 
  tracks: { leftSpeed: 0, rightSpeed: 0 },
  electromagnet: { enabled: false },
  torch: { enabled: false },
  simulationState: 'paused' as const,
  uiMode: 'presentation' as const,
  xRayMode: false,
  followMode: false,
  cameraTarget: 'robot' as const,
  cameraFocusTrigger: 0,
  activeCutPath: [],
  completedCuts: [],
  locomotionIntent: { x: 0, y: 0 },
  trackOffset: 0,
  fifthCableLength: 4.2, // Dist from winch to robot
};

export const useRobotStore = create<RobotState>((set, get) => ({
  ...initialState,
  
  setArmPosition: (y, x) => set((state) => {
    const safety = usePlatformStore.getState().safety;
    if (!safety.movementPermission) {
      console.warn("Safety Interlock: Arm movement rejected due to safety permission.");
      return state;
    }
    return { arm: { yPosition: y, xExtension: x } };
  }),
  setElectromagnet: (enabled) => set((state) => ({ electromagnet: { enabled } })),
  setTorch: (enabled) => set((state) => {
    // 1. SAFETY INTERLOCK
    const safety = usePlatformStore.getState().safety;
    if (enabled && !safety.torchPermission) {
      console.warn("Safety Interlock: Torch activation rejected due to safety permission.");
      return state;
    }

    // 2. HUMAN APPROVAL INTERLOCK
    const planner = usePlannerStore.getState();
    const plannedCut = planner.currentCutId ? planner.plannedCuts.find(c => c.id === planner.currentCutId) : null;
    
    if (enabled && planner.currentCutId) {
      if (plannedCut && plannedCut.approvalState !== 'APPROVED') {
        console.warn(`Approval Interlock: Torch activation rejected. Cut ${planner.currentCutId} is not APPROVED.`);
        return state;
      }
    }

    if (!enabled && state.activeCutPath.length > 0) {
      usePlatformStore.getState().recordCutsCompleted(1, 0); // Open cut
      return {
        torch: { enabled },
        completedCuts: [...state.completedCuts, {
          id: Math.random().toString(36).substring(2, 9),
          path: [...state.activeCutPath],
          isClosed: false,
          timestamp: new Date().toISOString(),
          plannedCutId: planner.currentCutId || undefined,
          missionId: plannedCut?.missionId,
          geometry: plannedCut?.geometry,
          material: plannedCut?.material,
          estimatedDurationSeconds: plannedCut?.estimate?.estimatedDurationSeconds
        }],
        activeCutPath: []
      };
    }
    return { torch: { enabled } };
  }),
  setSimulationState: (simState) => set({ simulationState: simState }),
  setUiMode: (mode) => set({ uiMode: mode }),
  setXRayMode: (enabled) => set({ xRayMode: enabled }),
  setFollowMode: (enabled) => set({ followMode: enabled }),
  triggerCameraFocus: (target) => set((state) => ({ cameraTarget: target, cameraFocusTrigger: state.cameraFocusTrigger + 1 })),
  addCutPoint: (x, y) => set((state) => ({ activeCutPath: [...state.activeCutPath, {x, y}] })),
  completeCut: (isClosed = false) => set((state) => {
    if (state.activeCutPath.length === 0) return state;
    const planner = usePlannerStore.getState();
    const plannedCut = planner.currentCutId ? planner.plannedCuts.find(c => c.id === planner.currentCutId) : null;
    
    const newCut: CutRecord = {
      id: Math.random().toString(36).substring(2, 9),
      path: [...state.activeCutPath],
      isClosed,
      timestamp: new Date().toISOString(),
      plannedCutId: planner.currentCutId || undefined,
      missionId: plannedCut?.missionId,
      geometry: plannedCut?.geometry,
      material: plannedCut?.material,
      estimatedDurationSeconds: plannedCut?.estimate?.estimatedDurationSeconds
    };
    
    usePlatformStore.getState().recordCutsCompleted(1, isClosed ? 1 : 0);
    
    return {
      completedCuts: [...state.completedCuts, newCut],
      activeCutPath: [] // clear active path
    };
  }),
  commitClosedCuts: (newPolygons) => set((state) => {
    const planner = usePlannerStore.getState();
    const plannedCut = planner.currentCutId ? planner.plannedCuts.find(c => c.id === planner.currentCutId) : null;
    const timestamp = new Date().toISOString();
    
    const newCuts: CutRecord[] = newPolygons.map(poly => ({
      id: poly.id,
      path: poly.points,
      isClosed: true,
      timestamp,
      plannedCutId: planner.currentCutId || undefined,
      missionId: plannedCut?.missionId,
      geometry: plannedCut?.geometry,
      material: plannedCut?.material,
      estimatedDurationSeconds: plannedCut?.estimate?.estimatedDurationSeconds
    }));
    
    // Also commit the current active path prefix as an open cut if substantial
    const prefixPath = state.activeCutPath.slice(0, -1);
    let extraOpenCut = 0;
    if (prefixPath.length > 2) {
      extraOpenCut = 1;
      newCuts.push({
        id: Math.random().toString(36).substring(2, 9),
        path: prefixPath,
        isClosed: false,
        timestamp,
        plannedCutId: planner.currentCutId || undefined,
        missionId: plannedCut?.missionId,
        geometry: plannedCut?.geometry,
        material: plannedCut?.material,
        estimatedDurationSeconds: plannedCut?.estimate?.estimatedDurationSeconds
      });
    }
    
    usePlatformStore.getState().recordCutsCompleted(newCuts.length, newPolygons.length);
    
    return {
      completedCuts: [...state.completedCuts, ...newCuts],
      activeCutPath: [] // clear active path so we start fresh from here
    };
  }),
  discardActiveCut: () => set({ activeCutPath: [] }),
  clearAllCuts: () => set({ activeCutPath: [], completedCuts: [] }),
  setLocomotionIntent: (x, y) => set({ locomotionIntent: { x, y } }),
  updateLocomotion: (x, y, trackOffsetDelta) => set((state) => {
    // 1. SAFETY INTERLOCK
    const safety = usePlatformStore.getState().safety;
    if (!safety.movementPermission) {
      // Do not mutate position if safety permission is missing
      return state;
    }

    // Keep robot Z locked to the hull based on X curvature
    const { hullRadius, hullCenterZ, hullSurfaceOffsetZ } = robotConfig;
    const theta = Math.asin(x / hullRadius);
    const z = hullCenterZ + hullRadius * Math.cos(theta) + hullSurfaceOffsetZ;
    
    // Calculate 5th cable length (distance from winch [x, 4.2, 0] to robot center [x, y, z])
    // The winch now moves left/right WITH the robot. So its x is the robot's x!
    const cableLen = Math.sqrt(Math.pow(x - x, 2) + Math.pow(y - 4.2, 2) + Math.pow(z - 0, 2));

    return { 
      position: { x, y, z },
      trackOffset: state.trackOffset + trackOffsetDelta,
      fifthCableLength: cableLen
    };
  }),
  reset: () => set({ ...initialState, uiMode: 'presentation' }), 
}));
