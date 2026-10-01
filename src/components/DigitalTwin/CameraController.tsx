import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRobotStore } from '@/lib/robotState';

function getRobotWorldPosition(localPos: {x: number, y: number, z: number}) {
  return new THREE.Vector3(
    9.95 - localPos.z,
    localPos.y,
    7.5 + localPos.x
  );
}

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const position = useRobotStore(state => state.position);
  const cameraTarget = useRobotStore(state => state.cameraTarget);
  const followMode = useRobotStore(state => state.followMode);
  const cameraFocusTrigger = useRobotStore(state => state.cameraFocusTrigger);

  const currentTarget = useRef(new THREE.Vector3(10, 0, 7.5));
  const desiredTarget = useRef(new THREE.Vector3(10, 0, 7.5));

  const [lastTrigger, setLastTrigger] = React.useState(cameraFocusTrigger);

  useEffect(() => {
    if (cameraFocusTrigger !== lastTrigger) {
      setLastTrigger(cameraFocusTrigger);
      
      const worldPos = getRobotWorldPosition(position);
      
      const camPos = new THREE.Vector3();
      
      switch (cameraTarget) {
        case 'robot':
          desiredTarget.current.copy(worldPos);
          camPos.set(worldPos.x + 2.5, worldPos.y - 1.5, worldPos.z + 1.5);
          camera.position.lerp(camPos, 0.5);
          break;
        case 'cut':
          const cuts = useRobotStore.getState().completedCuts;
          const active = useRobotStore.getState().activeCutPath;
          if (active.length > 0) {
            const cutWorld = getRobotWorldPosition({ x: active[0].x, y: active[0].y, z: -0.05 });
            desiredTarget.current.copy(cutWorld);
            camPos.set(cutWorld.x + 1.5, cutWorld.y - 1, cutWorld.z + 1);
          } else if (cuts.length > 0) {
            const lastCut = cuts[cuts.length - 1];
            const cutWorld = getRobotWorldPosition({ x: lastCut.path[0].x, y: lastCut.path[0].y, z: -0.05 });
            desiredTarget.current.copy(cutWorld);
            camPos.set(cutWorld.x + 1.5, cutWorld.y - 1, cutWorld.z + 1);
          } else {
            desiredTarget.current.copy(worldPos); 
            camPos.set(worldPos.x + 2.5, worldPos.y - 1.5, worldPos.z + 1.5);
          }
          camera.position.lerp(camPos, 0.5);
          break;
        case 'ship':
          desiredTarget.current.set(0, 30, 0); // Center of new ship
          camPos.set(80, 50, 80); // View full new ship from an impressive high angle
          camera.position.lerp(camPos, 0.5);
          break;
        case 'starboard':
          desiredTarget.current.set(0, 0, 7.5);
          camPos.set(120, 0, 7.5); // Look from starboard side horizontally
          camera.position.lerp(camPos, 0.5);
          break;
        case 'port':
          desiredTarget.current.set(0, 0, 7.5);
          camPos.set(-120, 0, 7.5); // Look from port side horizontally
          camera.position.lerp(camPos, 0.5);
          break;
        case 'front':
          desiredTarget.current.set(0, 0, 7.5);
          camPos.set(0, 100, 7.5); // Look from Bow
          camera.position.lerp(camPos, 0.5);
          break;
        case 'rear':
          desiredTarget.current.set(0, 0, 7.5);
          camPos.set(0, -100, 7.5); // Look from Stern
          camera.position.lerp(camPos, 0.5);
          break;
        case 'free':
          break;
      }
    }
  }, [cameraFocusTrigger, lastTrigger, cameraTarget, position, camera]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    if (followMode) {
      const worldPos = getRobotWorldPosition(position);
      desiredTarget.current.copy(worldPos);
    }
    
    const distToDesired = currentTarget.current.distanceTo(desiredTarget.current);
    const isTransitioning = distToDesired > 0.05 && (cameraTarget !== 'free');

    if (followMode || isTransitioning) {
      currentTarget.current.lerp(desiredTarget.current, delta * 5.0);
      controlsRef.current.target.copy(currentTarget.current);
    } else {
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
