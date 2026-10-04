import { create } from 'zustand';
import { PlatformTelemetry } from './transport/domain';
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
  TelemetrySample,
  LifetimeCounters,
  MaintenanceRecord,
  HealthEvent
} from './domain';
import { SyncTask } from './integration/senior/types';

export interface ActionResponse {
  success: boolean;
  reason?: string;
  missionId?: string;
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
  
  // Phase 7A Analytics State
  missionHistory: MissionState[];
  lifetimeCounters: LifetimeCounters;
  maintenanceLog: MaintenanceRecord[];
  healthEvents: HealthEvent[];

  // Phase 12B Integration Sync Queue
  outboundSyncQueue: SyncTask[];

  // Base Setters
  setSystemMode: (mode: SystemMode) => void;
  setRobotState: (robotState: Partial<RobotDomainState>) => void;
  setMission: (missionState: Partial<MissionState>) => void;
  setSafetyState: (safetyState: Partial<SafetyState>) => void;
  updateSensor: (sensorState: Partial<SensorState>) => void;
  updateEnvironment: (environmentState: Partial<EnvironmentState>) => void;
  addSystemEvent: (event: SystemEvent) => void;
  addTelemetrySample: (sample: TelemetrySample) => void;
  applyTelemetry: (telemetry: PlatformTelemetry) => void;

  // Mission Actions
  createMission: (missionPayload: Partial<MissionState>) => Promise<ActionResponse>;
  startMission: () => Promise<ActionResponse>;
  completeMission: () => Promise<ActionResponse>;
  cancelMission: () => Promise<ActionResponse>;
  interruptMission: () => Promise<ActionResponse>;
  setMissionProgress: (progress: number) => ActionResponse;

  // Phase 7A Analytics Actions
  recordCutsCompleted: (count: number, closedPanels: number) => void;
  recordHealthEvent: (event: Omit<HealthEvent, 'id' | 'timestamp'>) => void;
  recordMaintenance: (record: Omit<MaintenanceRecord, 'id' | 'timestamp'>) => void;

  // Phase 12B Sync Actions
  enqueueSyncTask: (task: Omit<SyncTask, 'id' | 'status' | 'retryCount' | 'createdAt'>) => void;
  resolveSyncTask: (id: string, success: boolean) => void;

  // Phase 13D Hydration
  hydrateRuntimeState: (state: any) => void;
}

// Initial deterministic SIMULATED/DEMO state
const initialPlatformState = {
  systemMode: SystemMode.SIMULATED,
  
  robot: {
    status: 'ONLINE' as const,
    powerConnected: true,
    powerVoltage: 220,
    powerCurrent: 3.5,
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
    shipImage: null,
    objective: '',
    status: MissionStatus.DRAFT,
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
  telemetryHistory: [],
  missionHistory: [],
  lifetimeCounters: {
    missionsCompleted: 0,
    cutsCompleted: 0,
    panelsRemoved: 0,
    emergencyStops: 0
  },
  maintenanceLog: [],
  healthEvents: [],
  outboundSyncQueue: []
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
  
  addSystemEvent: (event) => set((state) => {
    const isEStop = event.category === 'SAFETY' && (event.message.includes('EVACUATION') || event.message.includes('EMERGENCY_STOP'));
    return {
      events: [event, ...state.events].slice(0, MAX_HISTORY),
      lifetimeCounters: isEStop 
        ? { ...state.lifetimeCounters, emergencyStops: state.lifetimeCounters.emergencyStops + 1 } 
        : state.lifetimeCounters
    };
  }),

  addTelemetrySample: (sample) => set((state) => ({
    telemetryHistory: [sample, ...state.telemetryHistory].slice(0, MAX_HISTORY)
  })),

  applyTelemetry: (telemetry) => set((state) => {
    let newStops = state.lifetimeCounters.emergencyStops;
    telemetry.events.forEach(e => {
      if (e.category === 'SAFETY' && (e.message.includes('EVACUATION') || e.message.includes('EMERGENCY_STOP'))) {
        newStops++;
      }
    });

    return {
      sensor: telemetry.sensor,
      environment: telemetry.environment,
      safety: telemetry.safety,
      telemetryHistory: [telemetry.telemetrySample, ...state.telemetryHistory].slice(0, MAX_HISTORY),
      events: [...telemetry.events, ...state.events].slice(0, MAX_HISTORY),
      lifetimeCounters: {
        ...state.lifetimeCounters,
        emergencyStops: newStops
      }
    };
  }),

  // Mission Actions
  createMission: async (payload) => {
    const { mission } = get();
    if (mission.id && ![MissionStatus.COMPLETED, MissionStatus.ABORTED].includes(mission.status)) {
      return { success: false, reason: 'Active mission already exists' };
    }
    
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return { success: false, reason: 'Backend error' };
      const { data } = await res.json();
      set({
        mission: {
          ...get().mission,
          ...data
        },
        robot: { ...get().robot, activeMissionId: data.id }
      });
      return { success: true, missionId: data.id };
    } catch (e) {
      return { success: false, reason: 'Network error' };
    }
  },

  startMission: async () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    
    try {
      const isDraft = mission.status === MissionStatus.DRAFT;
      if (isDraft) {
        await fetch(`/api/missions/${mission.id}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
          body: JSON.stringify({ action: 'READY' })
        });
      }
      const action = mission.status === MissionStatus.PAUSED ? 'RESUME' : 'START';
      const res = await fetch(`/api/missions/${mission.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const error = await res.json();
        return { success: false, reason: error.error || 'Failed to start' };
      }
      const { data } = await res.json();
      set({ mission: { ...get().mission, ...data } });
      return { success: true };
    } catch (e) {
      return { success: false, reason: 'Network error' };
    }
  },

  completeMission: async () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    try {
      const res = await fetch(`/api/missions/${mission.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
        body: JSON.stringify({ action: 'COMPLETE' })
      });
      if (!res.ok) return { success: false, reason: 'Failed to complete' };
      const { data } = await res.json();
      set({
        mission: { ...get().mission, ...data, progressPercentage: 100 },
        robot: { ...get().robot, activeMissionId: null },
        missionHistory: [...get().missionHistory, { ...get().mission, ...data, progressPercentage: 100 }],
        lifetimeCounters: { ...get().lifetimeCounters, missionsCompleted: get().lifetimeCounters.missionsCompleted + 1 }
      });
      return { success: true };
    } catch (e) {
      return { success: false, reason: 'Network error' };
    }
  },

  cancelMission: async () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    try {
      const res = await fetch(`/api/missions/${mission.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
        body: JSON.stringify({ action: 'ABORT' })
      });
      if (!res.ok) return { success: false, reason: 'Failed to abort' };
      const { data } = await res.json();
      set({
        mission: { ...get().mission, ...data },
        robot: { ...get().robot, activeMissionId: null }
      });
      return { success: true };
    } catch (e) {
      return { success: false, reason: 'Network error' };
    }
  },

  interruptMission: async () => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    try {
      const res = await fetch(`/api/missions/${mission.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token : ''}` },
        body: JSON.stringify({ action: 'PAUSE' })
      });
      if (!res.ok) return { success: false, reason: 'Failed to pause' };
      const { data } = await res.json();
      set({ mission: { ...get().mission, ...data } });
      return { success: true };
    } catch (e) {
      return { success: false, reason: 'Network error' };
    }
  },

  setMissionProgress: (progress) => {
    const { mission } = get();
    if (!mission.id) return { success: false, reason: 'No mission active' };
    if (mission.status !== MissionStatus.RUNNING) {
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
  },

  recordCutsCompleted: (count, closedPanels) => set((state) => ({
    lifetimeCounters: {
      ...state.lifetimeCounters,
      cutsCompleted: state.lifetimeCounters.cutsCompleted + count,
      panelsRemoved: state.lifetimeCounters.panelsRemoved + closedPanels
    }
  })),

  recordHealthEvent: (event) => set((state) => ({
    healthEvents: [...state.healthEvents, { ...event, id: 'HE-' + Date.now(), timestamp: new Date().toISOString() }]
  })),

  recordMaintenance: (record) => set((state) => ({
    maintenanceLog: [...state.maintenanceLog, { ...record, id: 'MR-' + Date.now(), timestamp: new Date().toISOString() }]
  })),

  enqueueSyncTask: (task) => set((state) => ({
    outboundSyncQueue: [...state.outboundSyncQueue, {
      ...task,
      id: 'SYNC-' + Date.now() + Math.floor(Math.random() * 1000),
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date().toISOString()
    }]
  })),

  resolveSyncTask: (id, success) => set((state) => ({
    outboundSyncQueue: state.outboundSyncQueue.map(task => 
      task.id === id 
        ? { ...task, status: success ? 'SYNCED' : 'FAILED', retryCount: success ? task.retryCount : task.retryCount + 1 }
        : task
    )
  })),

  hydrateRuntimeState: (statePayload) => set((state) => ({
    systemMode: statePayload.systemMode,
    robot: { 
      ...state.robot, 
      activeMissionId: statePayload.activeMissionId 
    },
    safety: { 
      ...state.safety, 
      emergencyStateActive: statePayload.emergencyActive 
    }
  }))
}));
