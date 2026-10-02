import { usePlatformStore } from '../platformStore';
import { SimulationScenario, SCENARIO_DEFINITIONS } from './scenarios';
import { evaluateSafetyState } from '../safety';
import { EventCategory, SystemEvent } from '../domain';

class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private activeScenario: SimulationScenario = SimulationScenario.NORMAL_OPERATION;

  public setScenario(scenario: SimulationScenario) {
    if (this.activeScenario !== scenario) {
      this.activeScenario = scenario;
      this.logEvent(EventCategory.OPERATION, `Simulation scenario changed to ${scenario}`, 'INFO');
    }
  }
  
  public getScenario() {
      return this.activeScenario;
  }

  public start() {
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
    const store = usePlatformStore.getState();
    const currentSensor = store.sensor;
    const currentEnv = store.environment;
    const currentSafety = store.safety;
    
    // 1. Generate Telemetry (blend base state with scenario overrides)
    const baseDef = SCENARIO_DEFINITIONS[SimulationScenario.NORMAL_OPERATION];
    const scenarioDef = SCENARIO_DEFINITIONS[this.activeScenario];

    const newSensor = {
      ...currentSensor,
      metadata: { ...currentSensor.metadata, lastUpdated: new Date().toISOString() },
      motors: { ...baseDef.sensor!.motors!, ...(scenarioDef.sensor?.motors || {}) },
      imu: { ...baseDef.sensor!.imu!, ...(scenarioDef.sensor?.imu || {}) },
      // Other fields left as they are for now
    };

    const newEnv = {
      ...currentEnv,
      ...baseDef.env!,
      ...(scenarioDef.env || {})
    };
    
    const forceEStop = scenarioDef.forceEStop || false;

    // 2. Update platform sensor/env state
    store.updateSensor(newSensor);
    store.updateEnvironment(newEnv);

    // 3. Append Telemetry Sample
    store.addTelemetrySample({
      timestamp: new Date().toISOString(),
      sourceMode: store.systemMode,
      robot: {
        powerVoltage: store.robot.powerVoltage,
        powerCurrent: store.robot.powerCurrent
      },
      motors: newSensor.motors,
      imu: newSensor.imu,
      hardware: newSensor.hardware,
      gas: newSensor.gas,
      environment: {
        o2Percentage: newEnv.o2Percentage,
        coPpm: newEnv.coPpm,
        co2Ppm: newEnv.co2Ppm,
        combustibleGasLel: newEnv.combustibleGasLel
      }
    });

    // 3. Evaluate safety engine
    const { state: newSafetyState, newEvents } = evaluateSafetyState(newSensor, newEnv, forceEStop);

    // 4. Update safety state
    store.setSafetyState(newSafetyState);

    // 5. Generate relevant SystemEvent entries
    // Log state transition
    if (newSafetyState.level !== currentSafety.level) {
      this.logEvent(
        EventCategory.SAFETY, 
        `Safety level transitioned from ${currentSafety.level} to ${newSafetyState.level}`,
        newSafetyState.level === 'NORMAL' ? 'INFO' : 'WARNING'
      );
    }
    
    // Log new hazards appearing (simple check by ID)
    const currentHazardIds = currentSafety.activeHazards.map(h => h.id);
    newEvents.forEach(ev => {
      if (!currentHazardIds.includes(ev.hazardId)) {
        this.logEvent(
          EventCategory.SAFETY,
          `Hazard Detected: ${ev.description}`,
          ev.severity === 'HIGH' ? 'CRITICAL' : (ev.severity === 'MEDIUM' ? 'WARNING' : 'INFO')
        );
      }
    });
  }

  private logEvent(category: EventCategory, message: string, severity: SystemEvent['severity']) {
    const store = usePlatformStore.getState();
    const event: SystemEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      category,
      message,
      severity,
      missionId: store.mission.id || undefined,
      robotId: 'ROBOT-01'
    };
    store.addSystemEvent(event);
  }
}

// Singleton instance
export const telemetrySimulator = new TelemetrySimulator();
