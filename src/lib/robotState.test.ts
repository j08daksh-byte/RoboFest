import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { useRobotStore } from './robotState';
import { usePlatformStore } from './platformStore';
import { usePlannerStore } from './cutting/plannerStore';

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

  it('TEST 10: torch cannot activate if current cut plan is not APPROVED', () => {
    usePlatformStore.setState({ safety: { ...usePlatformStore.getState().safety, torchPermission: true } });
    const planner = usePlannerStore.getState();
    planner.clearPlanner();
    const id = planner.createCut({ type: 'CUSTOM_POLYGON', vertices: [{x:0,y:0}, {x:1,y:0}, {x:1,y:1}, {x:0,y:1}] }, { name: 'STEEL', thicknessMm: 10 }, 'test');
    planner.setCurrentCut(id);
    
    // Attempt activation (should be blocked by DRAFT approval state)
    useRobotStore.getState().setTorch(true);
    assert.strictEqual(useRobotStore.getState().torch.enabled, false);
    
    // Now force approval
    usePlannerStore.setState({ 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plannedCuts: [{...usePlannerStore.getState().plannedCuts[0], approvalState: 'APPROVED', validation: {} as any}] 
    });
    
    useRobotStore.getState().setTorch(true);
    assert.strictEqual(useRobotStore.getState().torch.enabled, true);
  });
});

describe('Phase 4 Runtime Regression Evidence', () => {
  beforeEach(() => {
    useRobotStore.getState().reset();
    usePlatformStore.setState({
      safety: {
        ...usePlatformStore.getState().safety,
        movementPermission: true,
        torchPermission: true
      }
    });
    usePlannerStore.getState().clearPlanner();
  });

  it('Scenario A: Open path leaves trace but does not create a closed panel', () => {
    const store = useRobotStore.getState();
    // Simulate torch ON, move, torch OFF
    store.setTorch(true);
    store.addCutPoint(0, 0);
    store.addCutPoint(1, 0);
    store.addCutPoint(2, 0);
    store.setTorch(false);
    
    // An open cut should be committed to completedCuts
    const currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 1);
    assert.strictEqual(currentState.completedCuts[0].isClosed, false);
    assert.strictEqual(currentState.activeCutPath.length, 0);
  });

  it('Scenario B: Closed loop creates a closed cut metadata', () => {
    const store = useRobotStore.getState();
    store.commitClosedCuts([{ id: 'C1', points: [{x:0, y:0}, {x:1, y:0}, {x:0, y:1}] }]);
    
    const currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 1);
    assert.strictEqual(currentState.completedCuts[0].id, 'C1');
    assert.strictEqual(currentState.completedCuts[0].isClosed, true);
  });

  it('Scenario C: Multiple independent cuts', () => {
    const store = useRobotStore.getState();
    store.commitClosedCuts([{ id: 'C1', points: [{x:0, y:0}] }]);
    store.commitClosedCuts([{ id: 'C2', points: [{x:2, y:2}] }]);
    
    const currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 2);
    assert.strictEqual(currentState.completedCuts[0].id, 'C1');
    assert.strictEqual(currentState.completedCuts[1].id, 'C2');
  });

  it('Scenario E: Reset clears cut state', () => {
    const store = useRobotStore.getState();
    store.addCutPoint(0, 0);
    store.commitClosedCuts([{ id: 'C1', points: [{x:0, y:0}] }]);
    
    store.reset();
    const currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 0);
    assert.strictEqual(currentState.activeCutPath.length, 0);
  });

  it('Scenario F: X-Ray toggle does not corrupt cutting state', () => {
    const store = useRobotStore.getState();
    store.commitClosedCuts([{ id: 'C1', points: [{x:0, y:0}] }]);
    
    store.setXRayMode(true);
    let currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 1);
    assert.strictEqual(currentState.xRayMode, true);
    
    store.setXRayMode(false);
    currentState = useRobotStore.getState();
    assert.strictEqual(currentState.completedCuts.length, 1);
    assert.strictEqual(currentState.xRayMode, false);
  });
});
