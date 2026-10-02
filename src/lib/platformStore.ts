import { create } from 'zustand';
import {
  SystemMode,
  RobotDomainState,
  MissionState,
  MissionStatus,
  SafetyState,
  SafetyLevel,
  SensorState,
  EnvironmentState,
  SystemEvent,
  TelemetrySample
} from './domain';

export interface ActionResponse {
  success: boolean;
  reason?: string;
}

interface PlatformStoreState {
  systemMode: SystemMode;
  robot: RobotDomainState;
  mission: MissionState;
  safety: SafetyState;
  sensor: SensorState;
  environment: EnvironmentState;
  events: SystemEvent[];
  telemetryHistory: TelemetrySample[];

  // Base Setters
  setSystemMode: (mode: SystemMode) => void;
  setRobotState: (robotState: Partial<RobotDomainState>) => void;
  setMission: (missionState: Partial<MissionState>) => void;
  setSafetyState: (safetyState: Partial<SafetyState>) => void;
  updateSensor: (sensorState: Partial<SensorState>) => void;
  updateEnvironment: (environmentState: Partial<EnvironmentState>) => void;
  addSystemEvent: (event: SystemEvent) => void;
  addTelemetrySample: (sample: TelemetrySample) => void;

  // Mission Actions
  createMission: (missionPayload: Partial<MissionState>) => ActionResponse;
  startMission: () => ActionResponse;
  completeMission: () => ActionResponse;
  cancelMission: () => ActionResponse;
  interruptMission: () => ActionResponse;
  setMissionProgress: (progress: number) => ActionResponse;
}

// Initial deterministic SIMULATED/DEMO state
const initialPlatformState = {
  systemMode: SystemMode.SIMULATED,
  
  robot: {
    status: 'ONLINE' as const,
    batteryPercentage: 92,
    batteryVoltage: 24.1,
    batteryCurrent: 1.2,
    overallHealth: 'GOOD' as const,
    connectionPingMs: 14,
    torchEnabled: false,
    electromagnetEnabled: false,
    activeMissionId: null
  },
  
  mission: {
    id: null,
    shipName: '',
    hullSection: '',
    objective: '',
    status: MissionStatus.PLANNED,
    progressPercentage: 0,
    startTime: null,
    estimatedCompletionTime: null,
    currentCutReference: null,
    createdAt: null,
    updatedAt: null
  },
  
  safety: {
    level: SafetyLevel.NORMAL,
    activeHazards: [],
    torchPermission: true,
    movementPermission: true,
    emergencyStateActive: false,
    acknowledgementRequired: false
  },
  
  sensor: {
    metadata: {
      isSimulated: true,
      isStale: false,
      lastUpdated: new Date().toISOString()
    },
    imu: {
      acceleration: { x: 0, y: -9.81, z: 0 },
      gyro: { x: 0, y: 0, z: 0 },
      tiltAngle: 2.4
    },
    motors: {
      currentLeft: 0.1,
      currentRight: 0.1,
      tempLeft: 42,
      tempRight: 43
    },
    hardware: {
      electromagnetCurrent: 5.2,
      armExtensionY: 0,
      armExtensionX: 0,
      vibrationLevel: 0.05
    },
    gas: {
      torchStatus: 'OFF' as const,
      oxyPressurePsi: 124,
      oxyFlowRate: 0,
      acePressurePsi: 14,
      aceFlowRate: 0
    }
  },
  
  environment: {
    temperatureC: 22,
    humidityPercentage: 45,
    windSpeedKmh: 12,
    rain: false,
    visibilityStatus: 'CLEAR' as const,
    atmosphericPressureHpa: 1013,
    stormWorkabilityState: 'WORKABLE' as const,
    o2Percentage: 20.9,
    coPpm: 0,
    co2Ppm: 400,
    combustibleGasLel: 0
  },
  
  events: [],
  telemetryHistory: []
};

const MAX_HISTORY = 100;

export const usePlatformStore = create<PlatformStoreState>((set, get) => ({
  ...initialPlatformState,

  setSystemMode: (mode) => set({ systemMode: mode }),
  
  setRobotState: (newState) => set((state) => ({ 
    robot: { ...state.robot, ...newState } 
  })),
  
  setMission: (newState) => set((state) => ({ 
    mission: { ...state.mission, ...newState } 
  })),
  
  setSafetyState: (newState) => set((state) => ({ 
    safety: { ...state.safety, ...newState } 
  })),
  
  updateSensor: (newState) => set((state) => ({ 
    sensor: { ...state.sensor, ...newState } 
  })),
  
  updateEnvironment: (newState) => set((state) => ({ 
    environment: { ...state.environment, ...newState } 
  })),
  
  addSystemEvent: (event) => set((state) => ({ 
    events: [event, ...state.events].slice(0, MAX_HISTORY)
  })),

  addTelemetrySample: (sample) => set((state) => ({
    telemetryHistory: [sample, ...state.telemetryHistory].slice(0, MAX_HISTORY)
  })),

  // Mission Actions
  createMission: (payload) => {
    const { mission } = get();
    if (mission.id && ![MissionStatus.COMPLETED, MissionStatus.CANCELLED].includes(mission.status)) {
      return { success: false, reason: 'Active mission already exists' };
    }
    
    set({
      mission: {
        id: payload.id || 'MIS-' + Date.now(),
        shipName: payload.shipName || 'Unknown',
        hullSection: payload.hullSection || 'Unknown',
        objective: payload.objective || '',
        status: MissionStatus.PLANNED,
        progressPercentage: 0,
        startTime: null,
        estimatedCompletionTime: null,
        currentCutReference: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      robot: { ...get().robot, activeMissionId: payload.id || 'MIS-' + Date.now() }
    });
    return { success: true };
  },

  startMission: () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if (![MissionStatus.PLANNED, MissionStatus.INTERRUPTED].includes(mission.status)) {
      return { success: false, reason: 'Cannot start mission from current status' };
    }
    
    set({
      mission: {
        ...mission,
        status: MissionStatus.IN_PROGRESS,
        startTime: mission.startTime || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    return { success: true };
  },

  completeMission: () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if (mission.status !== MissionStatus.IN_PROGRESS) {
      return { success: false, reason: 'Only in-progress missions can be completed' };
    }
    
    set({
      mission: {
        ...mission,
        status: MissionStatus.COMPLETED,
        progressPercentage: 100,
        updatedAt: new Date().toISOString()
      },
      robot: { ...get().robot, activeMissionId: null }
    });
    return { success: true };
  },

  cancelMission: () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if ([MissionStatus.COMPLETED, MissionStatus.CANCELLED].includes(mission.status)) {
      return { success: false, reason: 'Mission is already finished' };
    }
    
    set({
      mission: {
        ...mission,
        status: MissionStatus.CANCELLED,
        updatedAt: new Date().toISOString()
      },
      robot: { ...get().robot, activeMissionId: null }
    });
    return { success: true };
  },

  interruptMission: () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if (mission.status !== MissionStatus.IN_PROGRESS) {
      return { success: false, reason: 'Only in-progress missions can be interrupted' };
    }
    
    set({
      mission: {
        ...mission,
        status: MissionStatus.INTERRUPTED,
        updatedAt: new Date().toISOString()
      }
    });
    return { success: true };
  },

  setMissionProgress: (progress) => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if (mission.status !== MissionStatus.IN_PROGRESS) {
      return { success: false, reason: 'Cannot update progress of inactive mission' };
    }
    if (progress < 0 || progress > 100) {
      return { success: false, reason: 'Progress out of bounds' };
    }
    
    set({
      mission: {
        ...mission,
        progressPercentage: progress,
        updatedAt: new Date().toISOString()
      }
    });
    return { success: true };
  }
}));
