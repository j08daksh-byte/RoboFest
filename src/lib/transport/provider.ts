import { SimulationTelemetryProvider, SimulationCommandTransport } from './simulationTransport';
import { usePlatformStore } from '../platformStore';
import { useRobotStore } from '../robotState';

// We create a getter that pulls exactly what the simulator needs from platformStore.
const getStateForSimulator = () => {
  const store = usePlatformStore.getState();
  return {
    sensor: store.sensor,
    environment: store.environment,
    safety: store.safety,
    missionId: store.mission.id || undefined,
    systemMode: store.systemMode,
    powerVoltage: store.robot.powerVoltage,
    powerCurrent: store.robot.powerCurrent,
  };
};

export const activeTelemetryProvider = new SimulationTelemetryProvider(getStateForSimulator);
export const activeCommandTransport = new SimulationCommandTransport();

// Bind the telemetry provider to platformStore
activeTelemetryProvider.subscribe((telemetry) => {
  usePlatformStore.getState().applyTelemetry(telemetry);
});

// Bind command acknowledgements to robotState
activeCommandTransport.subscribeToAcknowledgements((ack) => {
  useRobotStore.getState().handleCommandAcknowledgement(ack);
});

// We can export a function to initialize the transport layer
export function initTransport() {
  if (activeTelemetryProvider.getStatus() === 'DISCONNECTED') {
    activeTelemetryProvider.start();
  }
}
