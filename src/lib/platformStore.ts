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
  SystemEvent
} from './domain';

interface PlatformStoreState {
  systemMode: SystemMode;
  robot: RobotDomainState;
  mission: MissionState;
  safety: SafetyState;
  sensor: SensorState;
  environment: EnvironmentState;
  events: SystemEvent[];

  // Actions
  setSystemMode: (mode: SystemMode) => void;
  setRobotState: (robotState: Partial<RobotDomainState>) => void;
  setMission: (missionState: Partial<MissionState>) => void;
  setSafetyState: (safetyState: Partial<SafetyState>) => void;
  updateSensor: (sensorState: Partial<SensorState>) => void;
  updateEnvironment: (environmentState: Partial<EnvironmentState>) => void;
  addSystemEvent: (event: SystemEvent) => void;
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
    activeMissionId: 'MIS-2026-A1'
  },
  
  mission: {
    id: 'MIS-2026-A1',
    shipName: 'Vessel Alpha',
    hullSection: 'Starboard-A',
    objective: 'Standard Panel Cut',
    status: MissionStatus.PLANNED,
    progressPercentage: 0,
    startTime: null,
    estimatedCompletionTime: null,
    currentCutReference: null
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
  
  events: []
};

export const usePlatformStore = create<PlatformStoreState>((set) => ({
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
    events: [event, ...state.events].slice(0, 100) // Keep last 100
  }))
}));
