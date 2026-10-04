import { SimulationScenario, SCENARIO_DEFINITIONS } from './scenarios';
import { evaluateSafetyState } from '../safety';
import { EventCategory, SystemEvent, SensorState, EnvironmentState, SafetyState, TelemetrySample, SystemMode } from '../domain';
import { PlatformTelemetry } from '../transport/domain';

export type SimulatorStateGetter = () => {
  sensor: SensorState;
  environment: EnvironmentState;
  safety: SafetyState;
  missionId?: string;
  systemMode: SystemMode;
  powerVoltage: number;
  powerCurrent: number;
};

class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private activeScenario: SimulationScenario = SimulationScenario.NORMAL_OPERATION;

  public setScenario(scenario: SimulationScenario) {
    if (this.activeScenario !== scenario) {
      this.activeScenario = scenario;
    }
  }
  
  public getScenario() {
      return this.activeScenario;
  }

  private onTick?: (telemetry: PlatformTelemetry) => void;
  private getState?: SimulatorStateGetter;

  public start(getState: SimulatorStateGetter, onTick: (telemetry: PlatformTelemetry) => void) {
    this.getState = getState;
    this.onTick = onTick;
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1000); // 1Hz telemetry tick
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    if (!this.getState || !this.onTick) return;
    const currentState = this.getState();
    const currentSensor = currentState.sensor;
    const currentEnv = currentState.environment;
    const currentSafety = currentState.safety;
    
    // 1. Generate Telemetry (blend base state with scenario overrides)
    const baseDef = SCENARIO_DEFINITIONS[SimulationScenario.NORMAL_OPERATION];
    const scenarioDef = SCENARIO_DEFINITIONS[this.activeScenario];

    const newSensor = {
      ...currentSensor,
      metadata: { ...currentSensor.metadata, lastUpdated: new Date().toISOString() },
      motors: { ...baseDef.sensor!.motors!, ...(scenarioDef.sensor?.motors || {}) },
      imu: { ...baseDef.sensor!.imu!, ...(scenarioDef.sensor?.imu || {}) },
    };

    const newEnv = {
      ...currentEnv,
      ...baseDef.env!,
      ...(scenarioDef.env || {})
    };
    
    const forceEStop = scenarioDef.forceEStop || false;

    // 2. Append Telemetry Sample
    const sample: TelemetrySample = {
      timestamp: new Date().toISOString(),
      sourceMode: currentState.systemMode,
      robot: {
        powerVoltage: currentState.powerVoltage,
        powerCurrent: currentState.powerCurrent
      },
      motors: newSensor.motors,
      imu: newSensor.imu,
      hardware: newSensor.hardware,
      gas: newSensor.gas,
      environment: {
        o2Percentage: newEnv.o2Percentage,
        coPpm: newEnv.coPpm,
        co2Ppm: newEnv.co2Ppm,
        combustibleGasLel: newEnv.combustibleGasLel,
        temperatureC: newEnv.temperatureC,
        humidityPercentage: newEnv.humidityPercentage,
        atmosphericPressureHpa: newEnv.atmosphericPressureHpa,
        windSpeedKmh: newEnv.windSpeedKmh,
        rain: newEnv.rain,
        visibilityStatus: newEnv.visibilityStatus
      }
    };

    // 3. Evaluate safety engine
    const { state: newSafetyState, newEvents } = evaluateSafetyState(newSensor, newEnv, forceEStop);

    // 4. Generate relevant SystemEvent entries
    const generatedEvents: SystemEvent[] = [];
    if (newSafetyState.level !== currentSafety.level) {
      generatedEvents.push(this.createEvent(
        currentState,
        EventCategory.SAFETY, 
        `Safety level transitioned from ${currentSafety.level} to ${newSafetyState.level}`,
        newSafetyState.level === 'NORMAL' ? 'INFO' : 'WARNING'
      ));
    }
    
    const currentHazardIds = currentSafety.activeHazards.map(h => h.id);
    newEvents.forEach(ev => {
      if (!currentHazardIds.includes(ev.hazardId)) {
        generatedEvents.push(this.createEvent(
          currentState,
          EventCategory.SAFETY,
          `Hazard Detected: ${ev.description}`,
          ev.severity === 'HIGH' ? 'CRITICAL' : (ev.severity === 'MEDIUM' ? 'WARNING' : 'INFO')
        ));
      }
    });

    this.onTick({
      sensor: newSensor,
      environment: newEnv,
      safety: newSafetyState,
      telemetrySample: sample,
      events: generatedEvents
    });

    // POST to backend occasionally (e.g. every 1 second / ~10 ticks)
    if (Math.random() < 0.1) {
      try {
        const token = typeof window !== 'undefined' && localStorage.getItem('auth-storage') 
          ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token 
          : '';
        if (token) {
          fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              source: 'SIMULATOR',
              mode: SystemMode.SIMULATED,
              timestamp: sample.timestamp,
              robot: sample.robot,
              imu: sample.imu,
              motors: sample.motors,
              hardware: sample.hardware,
              gas: sample.gas,
              environment: sample.environment
            })
          }).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    }
  }

  private createEvent(state: ReturnType<SimulatorStateGetter>, category: EventCategory, message: string, severity: SystemEvent['severity']): SystemEvent {
    return {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category,
      message,
      severity,
      missionId: state.missionId,
      robotId: 'ROBOT-01'
    };
  }
}

// Singleton instance
export const telemetrySimulator = new TelemetrySimulator();
