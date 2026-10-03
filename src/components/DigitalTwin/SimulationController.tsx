import React, { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';
import { globalCuttingNetwork } from '@/lib/cutting/cuttingNetwork';

export function SimulationController() {
  const { 
    simulationState,
    setTorch, setArmPosition, 
    setLocomotionIntent, updateLocomotion
  } = useRobotStore();
  
  const { 
    armMaxPositionY, armMinPositionY, armMaxExtensionX, armMinExtensionX,
    maxPositionX, minPositionX, maxPositionY, minPositionY, moveSpeed
  } = robotConfig;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const intent = useRobotStore.getState().locomotionIntent;
      let newX = intent.x;
      let newY = intent.y;

      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': newY = 1; break; // UP: move UP along hull vertical (+Y)
        case 's': case 'arrowdown': newY = -1; break; // DOWN: move DOWN along hull vertical (-Y)
        case 'a': case 'arrowleft': newX = 1; break; // LEFT: move LEFT along hull longitudinal (+X)
        case 'd': case 'arrowright': newX = -1; break; // RIGHT: move RIGHT along hull longitudinal (-X)
        case ' ':
          const em = useRobotStore.getState().electromagnet.enabled;
          useRobotStore.getState().setElectromagnet(!em);
          break;
      }
      setLocomotionIntent(newX, newY);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const intent = useRobotStore.getState().locomotionIntent;
      let newX = intent.x;
      let newY = intent.y;

      switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': if (newY === 1) newY = 0; break;
        case 's': case 'arrowdown': if (newY === -1) newY = 0; break;
        case 'a': case 'arrowleft': if (newX === 1) newX = 0; break;
        case 'd': case 'arrowright': if (newX === -1) newX = 0; break;
      }
      setLocomotionIntent(newX, newY);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setLocomotionIntent]);

  useFrame((state, delta) => {
    // 1. Handle Locomotion
    const storeState = useRobotStore.getState();
    const { locomotionIntent, electromagnet, position, torch, activeCutPath, arm } = storeState;
    
    // Only move if not locked
    if (!electromagnet.enabled && (locomotionIntent.x !== 0 || locomotionIntent.y !== 0)) {
      const dx = locomotionIntent.x * moveSpeed * delta;
      const dy = locomotionIntent.y * moveSpeed * delta;
      
      let nextX = position.x + dx;
      let nextY = position.y + dy;
      
      // Bound it to the hull workspace
      nextX = Math.max(minPositionX, Math.min(maxPositionX, nextX));
      nextY = Math.max(minPositionY, Math.min(maxPositionY, nextY));

      // Calculate track offset delta for animation (robot's forward is -X)
      const trackOffsetDelta = -(nextX - position.x);
      
      updateLocomotion(nextX, nextY, trackOffsetDelta);
    }

    // 2. Real Torch Tracking (Part G & H & I & K)
    if (simulationState === 'reset') {
      storeState.clearAllCuts();
      globalCuttingNetwork.reset();
      setTorch(false);
    } else {
      if (torch.enabled) {
        // Torch is ON
        const { bodyWidthX } = robotConfig;
        
        // 1. Calculate Torch position in World Space taking into account the 90 degree visual rotation of the robot
        // The unrotated robot has X as right, Y as forward. 
        // Torch local unrotated: X = bodyWidthX / 2 + arm.xExtension (Right), Y = arm.yPosition (Forward).
        // After rotating +90 around Z, New X = -Y, New Y = X.
        const rightOffset = bodyWidthX / 2 + arm.xExtension;
        const forwardOffset = arm.yPosition;
        
        const currentTorchX = position.x - forwardOffset;
        const currentTorchY = position.y + rightOffset;

        if (isNaN(currentTorchX) || isNaN(currentTorchY)) {
          if (storeState.activeCutPath.length > 0) storeState.discardActiveCut();
          return;
        }

        // Only add point if it moved a minimum distance from the last point to avoid dense arrays
        if (storeState.activeCutPath.length === 0) {
          storeState.addCutPoint(currentTorchX, currentTorchY);
        } else {
          const lastPoint = storeState.activeCutPath[storeState.activeCutPath.length - 1];
          const dist = Math.hypot(currentTorchX - lastPoint.x, currentTorchY - lastPoint.y);
          
          if (dist > 1.0) {
            // Jumped too far! Discard the current invalid path.
            storeState.discardActiveCut();
            storeState.addCutPoint(currentTorchX, currentTorchY);
          } else if (dist > 0.02) { // 2cm resolution
            storeState.addCutPoint(currentTorchX, currentTorchY);
            
              // Add segment to the persistent cutting network
              const newPolygons = globalCuttingNetwork.addSegment(lastPoint, { x: currentTorchX, y: currentTorchY });
              
              if (newPolygons.length > 0) {
                // VALID CLOSED LOOP DETECTED!
                console.log(`CUT LOOP CLOSED! Found ${newPolygons.length} new region(s)`);
                
                // Commit the loops as closed cuts via authoritative platform action
                storeState.commitClosedCuts(newPolygons);
              }
            }
          }
        }
      }
    
      // When Torch turns OFF, commit remaining active path as open cut
      if (!torch.enabled) {
        const freshAP = useRobotStore.getState().activeCutPath;
        if (freshAP.length > 0) {
          useRobotStore.getState().completeCut(false);
        }
      }
    });
  
    return null;
}
