export type HardwareConnectionState = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'DEGRADED' 
  | 'FAULT' 
  | 'STOPPED';

export type HardwareAckStatus = 
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'EXECUTING'
  | 'ACKNOWLEDGED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'REJECTED';

export interface HardwareCommandEnvelope {
  commandId: string;
  timestamp: string;
  robotId: string;
  type: string;          // LOCOMOTION, ARM_X, ARM_Y, TORCH, ELECTROMAGNET, EMERGENCY_STOP, POSITION
  parameters: Record<string, any>;
  correlationId?: string; // e.g. missionId or cutId
  protocolVersion: string;
}

export interface HardwareAckEnvelope {
  commandId: string;
  timestamp: string;
  robotId: string;
  status: HardwareAckStatus;
  reason?: string;
  protocolVersion: string;
}

export interface HardwareTelemetryEnvelope {
  robotId: string;
  timestamp: string;
  sequence: number;
  protocolVersion: string;
  source: 'HARDWARE';
  mode: 'LIVE';
  
  // Actuator/Sensor Feedback
  actuators: {
    torchEnabled: boolean;
    electromagnetEnabled: boolean;
    armX: number;
    armY: number;
    motorTempLeft: number;
    motorTempRight: number;
  };
  
  sensors: {
    voltage: number;
    current: number;
    vibration: number;
    temperatureC: number;
    // IMU
    imuTilt: number;
  };

  faults: string[];
}
