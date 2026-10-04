import { SimulationTelemetryProvider, SimulationCommandTransport } from './simulationTransport';
import { BackendCommandTransport } from './backendTransport';
import { CommandTransport, CommandAcknowledgement, TransportStatus } from './domain';
import { RobotCommand } from '../api/commands';
import { SystemMode } from '../domain';
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

const simTransport = new SimulationCommandTransport();
const backendTransport = new BackendCommandTransport();

class ProxyCommandTransport implements CommandTransport {
  public sendCommand(command: RobotCommand): void {
     if (usePlatformStore.getState().systemMode === SystemMode.SIMULATED) {
         simTransport.sendCommand(command);
     } else {
         backendTransport.sendCommand(command);
     }
  }

  public subscribeToAcknowledgements(listener: (ack: CommandAcknowledgement) => void): () => void {
    const unsubSim = simTransport.subscribeToAcknowledgements(listener);
    const unsubBackend = backendTransport.subscribeToAcknowledgements(listener);
    return () => { unsubSim(); unsubBackend(); };
  }

  public getStatus(): TransportStatus {
     return usePlatformStore.getState().systemMode === SystemMode.SIMULATED 
        ? simTransport.getStatus() 
        : backendTransport.getStatus();
  }
}

export const activeCommandTransport = new ProxyCommandTransport();

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
