import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { useRobotStore } from './robotState';
import { usePlatformStore } from './platformStore';

describe('Safety Interlocks in robotState', () => {
  beforeEach(() => {
    useRobotStore.getState().reset();
    usePlatformStore.setState({
      safety: {
        ...usePlatformStore.getState().safety,
        torchPermission: true,
        movementPermission: true,
      }
    });
  });

  it('TEST 1: movementPermission = true -> locomotion command can move robot', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: true } });
    useRobotStore.getState().updateLocomotion(1.0, 1.0, 0);
    const newPos = useRobotStore.getState().position;
    assert.strictEqual(newPos.x, 1.0);
    assert.strictEqual(newPos.y, 1.0);
  });

  it('TEST 2: movementPermission = false -> same locomotion command does NOT move robot', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: false } });
    useRobotStore.getState().updateLocomotion(1.0, 1.0, 0);
    const newPos = useRobotStore.getState().position;
    assert.strictEqual(newPos.x, 0.0);
    assert.strictEqual(newPos.y, 0.0);
  });

  it('TEST 3: torchPermission = true -> setTorch(true) can enable torch', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: true } });
    useRobotStore.getState().setTorch(true);
    assert.strictEqual(useRobotStore.getState().torch.enabled, true);
  });

  it('TEST 4: torchPermission = false -> setTorch(true) cannot enable torch', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: false } });
    useRobotStore.getState().setTorch(true);
    assert.strictEqual(useRobotStore.getState().torch.enabled, false);
  });

  it('TEST 5: torchPermission = false -> setTorch(false) still disables torch', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: true } });
    useRobotStore.getState().setTorch(true);
    assert.strictEqual(useRobotStore.getState().torch.enabled, true);
    
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: false } });
    useRobotStore.getState().setTorch(false);
    assert.strictEqual(useRobotStore.getState().torch.enabled, false);
  });

  it('TEST 6: movement blocked by safety -> no position mutation occurs', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: false } });
    const initialPos = { ...useRobotStore.getState().position };
    useRobotStore.getState().updateLocomotion(2.0, 3.0, 0);
    const pos = useRobotStore.getState().position;
    assert.strictEqual(pos.x, initialPos.x);
    assert.strictEqual(pos.y, initialPos.y);
    assert.strictEqual(pos.z, initialPos.z);
  });

  it('TEST 7: movementPermission = true -> setArmPosition changes arm position', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: true } });
    useRobotStore.getState().setArmPosition(0.2, 0.5);
    const arm = useRobotStore.getState().arm;
    assert.strictEqual(arm.yPosition, 0.2);
    assert.strictEqual(arm.xExtension, 0.5);
  });

  it('TEST 8: movementPermission = false -> setArmPosition does NOT change arm position', () => {
    useRobotStore.getState().setArmPosition(0.0, 0.3); // Set initial state
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: false } });
    
    useRobotStore.getState().setArmPosition(0.2, 0.5); // Attempt mutation
    
    const arm = useRobotStore.getState().arm;
    assert.strictEqual(arm.yPosition, 0.0);
    assert.strictEqual(arm.xExtension, 0.3);
  });

  it('TEST 9: restoring movementPermission -> setArmPosition changes arm position again', () => {
    useRobotStore.getState().setArmPosition(0.0, 0.3);
    
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: false } });
    useRobotStore.getState().setArmPosition(0.2, 0.5); // Blocked
    
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, movementPermission: true } });
    useRobotStore.getState().setArmPosition(0.25, 0.6); // Allowed
    
    const arm = useRobotStore.getState().arm;
    assert.strictEqual(arm.yPosition, 0.25);
    assert.strictEqual(arm.xExtension, 0.6);
  });
});
