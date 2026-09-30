import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRobotStore } from '@/lib/robotState';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const position = useRobotStore(state => state.position);
  const cameraTarget = useRobotStore(state => state.cameraTarget);
  const followMode = useRobotStore(state => state.followMode);

  const cameraFocusTrigger = useRobotStore(state => state.cameraFocusTrigger);

  // We keep a separate target vector that smoothly interpolates
  const currentTarget = useRef(new THREE.Vector3(0, 10, -15));
  const desiredTarget = useRef(new THREE.Vector3(0, 10, -15));

  // Determine static camera position and target based on cameraFocusTrigger changes
  const [lastTrigger, setLastTrigger] = React.useState(cameraFocusTrigger);

  useEffect(() => {
    if (cameraFocusTrigger !== lastTrigger) {
      setLastTrigger(cameraFocusTrigger);
      
      const rx = position.x;
      const ry = position.y;
      const rz = position.z;
      
      let camPos = new THREE.Vector3();
      
      switch (cameraTarget) {
        case 'robot':
          desiredTarget.current.set(rx, ry, rz);
          camPos.set(rx + 3, ry + 2, rz + 4);
          camera.position.lerp(camPos, 0.5); // soft snap
          break;
        case 'cut':
          // Focus on most recent cut if any, else center
          const cuts = useRobotStore.getState().completedCuts;
          const active = useRobotStore.getState().activeCutPath;
          if (active.length > 0) {
            desiredTarget.current.set(active[0].x, active[0].y, 0); // approx
            camPos.set(active[0].x, active[0].y, 8);
          } else if (cuts.length > 0) {
            const lastCut = cuts[cuts.length - 1];
            desiredTarget.current.set(lastCut.path[0].x, lastCut.path[0].y, 0);
            camPos.set(lastCut.path[0].x, lastCut.path[0].y, 8);
          } else {
            desiredTarget.current.set(0, 0, 0); 
            camPos.set(0, 0, 8);
          }
          camera.position.lerp(camPos, 0.5);
          break;
        case 'ship':
          desiredTarget.current.set(0, 0, -5);
          camPos.set(-20, 10, 40);
          camera.position.lerp(camPos, 0.5);
          break;
        case 'free':
          // Do nothing to target, let user pan freely
          break;
      }
    }
  }, [cameraFocusTrigger, lastTrigger, cameraTarget, position, camera]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    if (followMode) {
      // Continuously update desired target to robot
      desiredTarget.current.set(position.x, position.y, position.z);
    }
    
    // Are we transitioning to a new target?
    const distToDesired = currentTarget.current.distanceTo(desiredTarget.current);
    const isTransitioning = distToDesired > 0.05 && (cameraTarget !== 'free');

    // Smoothly interpolate the actual orbit target if following OR transitioning
    if (followMode || isTransitioning) {
      currentTarget.current.lerp(desiredTarget.current, delta * 5.0);
      controlsRef.current.target.copy(currentTarget.current);
    } else {
      // Allow free panning
      currentTarget.current.copy(controlsRef.current.target);
      desiredTarget.current.copy(controlsRef.current.target);
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      makeDefault 
      enablePan={true} 
      enableZoom={true} 
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}
