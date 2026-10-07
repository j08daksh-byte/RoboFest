import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTwinState } from '../../../packages/digital-twin/src/TwinProvider';

function getRobotWorldPosition(localPos: {x: number, y: number, z: number}) {
  return new THREE.Vector3(
    50.25 + localPos.z,
    localPos.y,
    37.5 - localPos.x
  );
}

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const { position, cameraTarget, followMode, cameraFocusTrigger, completedCuts, activeCutPath } = useTwinState();

  const currentTarget = useRef(new THREE.Vector3(10, 0, 7.5));
  const desiredTarget = useRef(new THREE.Vector3(10, 0, 7.5));

  const lastTrigger = useRef(cameraFocusTrigger);

  useEffect(() => {
    // Ship is oriented with Z=Up, Y=Longitudinal. 
    // Set camera up to Z so horizontal side views work properly.
    camera.up.set(0, 0, 1);
  }, [camera]);

  useEffect(() => {
    if (cameraFocusTrigger !== lastTrigger.current || lastTrigger.current === 0) {
      const isInitial = lastTrigger.current === 0 && cameraFocusTrigger === 0;
      lastTrigger.current = cameraFocusTrigger;
      
      const worldPos = getRobotWorldPosition(position);
      
      const camPos = new THREE.Vector3();
      
      switch (cameraTarget) {
        case 'robot':
          // Focus target slightly towards the right side where the arm is
          desiredTarget.current.set(worldPos.x + 0.2, worldPos.y + 0.3, worldPos.z);
          // Camera looking from the right side (+Y), close up
          camPos.set(worldPos.x + 0.6, worldPos.y + 1.8, worldPos.z + 0.6);
          if (isInitial) {
            camera.position.copy(camPos);
          } else {
            camera.position.lerp(camPos, 0.5);
          }
          break;
        case 'cut':
          const cuts = completedCuts;
          const active = activeCutPath;
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
            desiredTarget.current.set(worldPos.x + 0.2, worldPos.y + 0.3, worldPos.z);
            camPos.set(worldPos.x + 0.6, worldPos.y + 1.8, worldPos.z + 0.6);
          }
          camera.position.lerp(camPos, 0.5);
          break;
        case 'ship':
          desiredTarget.current.set(0, 30, 37.5); // Center of new ship
          camPos.set(200, 300, 250); // View full new ship from an impressive high angle
          camera.position.lerp(camPos, 0.5);
          break;
        case 'starboard':
          desiredTarget.current.set(0, 0, 37.5);
          camPos.set(400, 0, 37.5); // Look from starboard side horizontally, further back to see whole ship
          camera.position.lerp(camPos, 0.5);
          break;
        case 'port':
          desiredTarget.current.set(0, 0, 37.5);
          camPos.set(-400, 0, 37.5); // Look from port side horizontally, further back
          camera.position.lerp(camPos, 0.5);
          break;
        case 'front':
          desiredTarget.current.set(0, 0, 37.5);
          camPos.set(0, 400, 37.5); // Look from Bow
          camera.position.lerp(camPos, 0.5);
          break;
        case 'rear':
          desiredTarget.current.set(0, 0, 37.5);
          camPos.set(0, -400, 37.5); // Look from Stern
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
