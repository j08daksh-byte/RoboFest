import test from 'node:test';
import assert from 'node:assert';
import { SimulationTelemetryProvider, SimulationCommandTransport } from './simulationTransport';
import { usePlatformStore } from '../platformStore';
import { useRobotStore } from '../robotState';
import { activeCommandTransport, activeTelemetryProvider } from './provider';
import { RobotCommand } from '../api/commands';
import { SafetyLevel } from '../domain';

test('Transport Architecture Tests', async (t) => {
  await t.test('A. SimulationTelemetryProvider emits telemetry', async () => {
    let emitted = false;
    const provider = new SimulationTelemetryProvider(() => ({
      sensor: usePlatformStore.getState().sensor,
      environment: usePlatformStore.getState().environment,
      safety: usePlatformStore.getState().safety,
      systemMode: usePlatformStore.getState().systemMode,
      powerVoltage: 220,
      powerCurrent: 3.5,
    }));
    
    provider.subscribe(() => {
      emitted = true;
    });
    
    provider.start();
    await new Promise((r) => setTimeout(r, 1100)); // wait for 1 tick
    provider.stop();
    
    assert.strictEqual(emitted, true);
  });

  await t.test('B. Telemetry reaches platformStore through the provider boundary', async () => {
    usePlatformStore.setState({ telemetryHistory: [] });
    activeTelemetryProvider.start();
    await new Promise((r) => setTimeout(r, 1100));
    activeTelemetryProvider.stop();
    assert.ok(usePlatformStore.getState().telemetryHistory.length > 0);
  });

  await t.test('C/D/E. Command is sent, becomes PENDING, then ACKNOWLEDGED', async () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: true } });
    
    useRobotStore.getState().setTorch(true);
    const pendingIds = Object.keys(useRobotStore.getState().pendingCommands);
    assert.strictEqual(pendingIds.length, 1);
    
    const cmdId = pendingIds[0];
    const initialPending = useRobotStore.getState().pendingCommands[cmdId];
    assert.strictEqual(initialPending.status, 'PENDING');
    assert.strictEqual(useRobotStore.getState().torch.enabled, false); // Not updated yet
    
    // Wait for transport acknowledgement (simulation takes 20ms)
    await new Promise((r) => setTimeout(r, 50));
    
    const afterAck = useRobotStore.getState().pendingCommands[cmdId];
    assert.strictEqual(afterAck.status, 'ACKNOWLEDGED');
    assert.strictEqual(useRobotStore.getState().torch.enabled, true); // Authoritative state updated
  });

  await t.test('F/G. Rejected/Failed command (simulating disconnected transport)', async () => {
    // Hack to simulate disconnected transport temporarily
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalStatus = (activeCommandTransport as any).status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeCommandTransport as any).status = 'DISCONNECTED';
    
    useRobotStore.getState().setTorch(false);
    const pendingIds = Object.keys(useRobotStore.getState().pendingCommands);
    const cmdId = pendingIds[pendingIds.length - 1]; // get latest
    
    // Wait for sync notification
    await new Promise((r) => setTimeout(r, 10));
    
    const afterFail = useRobotStore.getState().pendingCommands[cmdId];
    assert.strictEqual(afterFail.status, 'FAILED');
    assert.strictEqual(useRobotStore.getState().torch.enabled, true); // Authoritative state remains unchanged
    
    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeCommandTransport as any).status = originalStatus;
  });

  await t.test('I/J/K. Safety-blocked commands never reach transport', async () => {
    // Remove permission
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: false, movementPermission: false } });
    
    const initialPendingCount = Object.keys(useRobotStore.getState().pendingCommands).length;
    
    useRobotStore.getState().setTorch(true);
    useRobotStore.getState().setArmPosition(0, 0);
    useRobotStore.getState().updateLocomotion(10, 10, 0);
    
    assert.strictEqual(Object.keys(useRobotStore.getState().pendingCommands).length, initialPendingCount);
  });
});
