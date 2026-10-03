// SYSTEM MODE
export enum SystemMode {
  SIMULATED = 'SIMULATED',
  DEMO = 'DEMO',
  LIVE = 'LIVE',
  OFFLINE = 'OFFLINE'
}

// USER & ROLE DOMAIN (PHASE 9 SCAFFOLD)
export enum UserRole {
  OPERATOR = 'OPERATOR',
  ENGINEER = 'ENGINEER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum UserPermission {
  READ_TELEMETRY = 'READ_TELEMETRY',
  MANAGE_MISSION = 'MANAGE_MISSION',
  OPERATE_ROBOT = 'OPERATE_ROBOT',
  OVERRIDE_SAFETY = 'OVERRIDE_SAFETY',
  MANAGE_USERS = 'MANAGE_USERS'
}

export interface UserContext {
  id: string;
  username: string;
  role: UserRole;
  permissions: UserPermission[];
  isAuthenticated: boolean;
}

// KNOWLEDGE BASE DOMAIN (PHASE 9 SCAFFOLD)
export enum KnowledgeCategory {
  SAFETY = 'SAFETY',
  MAINTENANCE = 'MAINTENANCE',
  OPERATIONS = 'OPERATIONS',
  TROUBLESHOOTING = 'TROUBLESHOOTING'
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: KnowledgeCategory;
  lastUpdated: string;
  contentReference: string; // URL or static ID
}

// ROBOT DOMAIN
export interface RobotDomainState {
  status: 'ONLINE' | 'OFFLINE' | 'FAULT' | 'MAINTENANCE';
  powerConnected: boolean;
  powerVoltage: number;
  powerCurrent: number;
  overallHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
  connectionPingMs: number;
  // High-level operational commands (Not 3D mesh states)
  torchEnabled: boolean;
  electromagnetEnabled: boolean;
  activeMissionId: string | null;
}

// MISSION DOMAIN
export enum MissionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  INTERRUPTED = 'INTERRUPTED',
  EMERGENCY_STOP = 'EMERGENCY_STOP',
  MAINTENANCE_REQUIRED = 'MAINTENANCE_REQUIRED'
}

export interface MissionState {
  id: string | null;
  shipName: string;
  hullSection: string;
  shipImage?: string | null;
  objective: string;
  status: MissionStatus;
  progressPercentage: number;
  startTime: string | null;
  estimatedCompletionTime: string | null;
  currentCutReference: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// SAFETY DOMAIN
export enum SafetyLevel {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  TORCH_OFF = 'TORCH_OFF',
  ROBOT_STOP = 'ROBOT_STOP',
  ALARM = 'ALARM',
  EVACUATION = 'EVACUATION'
}

export interface SafetyState {
  level: SafetyLevel;
  activeHazards: Array<{
    id: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    timestamp: string;
  }>;
  torchPermission: boolean;
  movementPermission: boolean;
  emergencyStateActive: boolean;
  acknowledgementRequired: boolean;
}

// SENSOR DOMAIN
export interface SensorMetadata {
  isSimulated: boolean;
  isStale: boolean;
  lastUpdated: string;
}

export interface ImuData {
  acceleration: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  tiltAngle: number;
}

export interface MotorData {
  currentLeft: number;
  currentRight: number;
  tempLeft: number;
  tempRight: number;
}

export interface HardwareData {
  electromagnetCurrent: number;
  armExtensionY: number;
  armExtensionX: number;
  vibrationLevel: number;
}

export interface GasData {
  torchStatus: 'IGNITED' | 'OFF' | 'FAULT';
  oxyPressurePsi: number;
  oxyFlowRate: number;
  acePressurePsi: number;
  aceFlowRate: number;
}

export interface SensorState {
  metadata: SensorMetadata;
  imu: ImuData;
  motors: MotorData;
  hardware: HardwareData;
  gas: GasData;
}

// ENVIRONMENT DOMAIN
export interface EnvironmentState {
  temperatureC: number;
  humidityPercentage: number;
  windSpeedKmh: number;
  rain: boolean;
  visibilityStatus: 'CLEAR' | 'MODERATE' | 'POOR';
  atmosphericPressureHpa: number;
  stormWorkabilityState: 'WORKABLE' | 'RESTRICTED' | 'NO_GO';
  
  // Gas environment (from Phase 4B)
  o2Percentage: number;
  coPpm: number;
  co2Ppm: number;
  combustibleGasLel: number;
}

// TELEMETRY SAMPLE DOMAIN
export interface TelemetrySample {
  timestamp: string;
  sourceMode: SystemMode;
  robot: {
    powerVoltage: number;
    powerCurrent: number;
  };
  motors: MotorData;
  imu: ImuData;
  hardware: HardwareData;
  gas: GasData;
  environment: Pick<EnvironmentState, 'o2Percentage' | 'coPpm' | 'co2Ppm' | 'combustibleGasLel' | 'temperatureC' | 'humidityPercentage' | 'atmosphericPressureHpa' | 'windSpeedKmh' | 'rain' | 'visibilityStatus'>;
}

// SYSTEM EVENT
export enum EventCategory {
  CONNECTION = 'CONNECTION',
  MISSION = 'MISSION',
  SAFETY = 'SAFETY',
  OPERATION = 'OPERATION',
  MAINTENANCE = 'MAINTENANCE',
  SENSOR_FAULT = 'SENSOR_FAULT'
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  category: EventCategory;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  missionId?: string;
  robotId?: string;
  source?: string;
}

// LIFETIME COUNTERS DOMAIN
export interface LifetimeCounters {
  missionsCompleted: number;
  cutsCompleted: number;
  panelsRemoved: number;
  emergencyStops: number;
}

// MAINTENANCE DOMAIN
export interface MaintenanceRecord {
  id: string;
  timestamp: string;
  component: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

// HEALTH EVENTS DOMAIN
export interface HealthEvent {
  id: string;
  timestamp: string;
  subsystem: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  reason: string;
}
