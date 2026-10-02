import { SensorState, EnvironmentState } from '../domain';

export enum SimulationScenario {
  NORMAL_OPERATION = 'NORMAL_OPERATION',
  GAS_WARNING = 'GAS_WARNING',
  GAS_CRITICAL = 'GAS_CRITICAL',
  MOTOR_OVERHEAT = 'MOTOR_OVERHEAT',
  EXCESSIVE_TILT = 'EXCESSIVE_TILT',
  EMERGENCY_STOP = 'EMERGENCY_STOP'
}

export type ScenarioStateOverride = {
  sensor?: Partial<SensorState>;
  env?: Partial<EnvironmentState>;
  forceEStop?: boolean;
};

export const SCENARIO_DEFINITIONS: Record<SimulationScenario, ScenarioStateOverride> = {
  [SimulationScenario.NORMAL_OPERATION]: {
    sensor: {
      motors: { currentLeft: 4.2, currentRight: 4.1, tempLeft: 42, tempRight: 43 },
      imu: { acceleration: { x: 0, y: -9.81, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, tiltAngle: 2.4 }
    },
    env: {
      combustibleGasLel: 0, o2Percentage: 20.9, coPpm: 0, stormWorkabilityState: 'WORKABLE'
    },
    forceEStop: false
  },
  [SimulationScenario.GAS_WARNING]: {
    env: {
      combustibleGasLel: 12, // Warning threshold is 10
      o2Percentage: 20.9,
      coPpm: 40 // Warning threshold is 35
    },
    forceEStop: false
  },
  [SimulationScenario.GAS_CRITICAL]: {
    env: {
      combustibleGasLel: 25, // Critical is 20
      o2Percentage: 17.5, // Critical low is 18
      coPpm: 120 // Critical is 100
    },
    forceEStop: false
  },
  [SimulationScenario.MOTOR_OVERHEAT]: {
    sensor: {
      motors: { currentLeft: 22, currentRight: 4.1, tempLeft: 85, tempRight: 45 } // Temp crit is 80, current warning is 15
    },
    forceEStop: false
  },
  [SimulationScenario.EXCESSIVE_TILT]: {
    sensor: {
      imu: { acceleration: { x: 0, y: -9.81, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, tiltAngle: 48 } // Crit is 45
    },
    forceEStop: false
  },
  [SimulationScenario.EMERGENCY_STOP]: {
    forceEStop: true
  }
};
