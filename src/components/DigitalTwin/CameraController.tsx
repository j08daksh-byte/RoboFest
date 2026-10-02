import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRobotStore } from '@/lib/robotState';

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
  const position = useRobotStore(state => state.position);
  const cameraTarget = useRobotStore(state => state.cameraTarget);
  const followMode = useRobotStore(state => state.followMode);
  const cameraFocusTrigger = useRobotStore(state => state.cameraFocusTrigger);

  const currentTarget = useRef(new THREE.Vector3(10, 0, 7.5));
  const desiredTarget = useRef(new THREE.Vector3(10, 0, 7.5));
  const desiredCamPos = useRef(new THREE.Vector3(25, -25, 17.5));
  const isTransitioning = useRef(false);

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
      isTransitioning.current = true;
      
      switch (cameraTarget) {
        case 'robot':
          desiredTarget.current.copy(worldPos);
          if (isInitial) {
            // OVERVIEW: Frame robot from its visual right side (World +Y), moderate close-up
            desiredCamPos.current.set(worldPos.x + 10, worldPos.y + 12, worldPos.z + 6);
            camera.position.copy(desiredCamPos.current);
            currentTarget.current.copy(desiredTarget.current);
            if (controlsRef.current) {
              controlsRef.current.target.copy(currentTarget.current);
              controlsRef.current.update();
            }
            isTransitioning.current = false;
          } else {
            // FOCUS ROBOT: Tightly frame the crawler
            desiredCamPos.current.set(worldPos.x + 3, worldPos.y - 3, worldPos.z + 3);
          }
          break;
        case 'cut':
          // FOCUS CUT: Frame the active or most recent cut
          const cuts = useRobotStore.getState().completedCuts;
          const active = useRobotStore.getState().activeCutPath;
          let cutWorld = worldPos;
          if (active.length > 0) {
            cutWorld = getRobotWorldPosition({ x: active[0].x, y: active[0].y, z: -0.05 });
          } else if (cuts.length > 0) {
            const lastCut = cuts[cuts.length - 1];
            cutWorld = getRobotWorldPosition({ x: lastCut.path[0].x, y: lastCut.path[0].y, z: -0.05 });
          }
          desiredTarget.current.copy(cutWorld);
          desiredCamPos.current.set(cutWorld.x + 2, cutWorld.y - 2, cutWorld.z + 2);
          break;
        case 'ship':
          // FOCUS SHIP: High level view of the whole hull
          desiredTarget.current.set(0, 30, 37.5);
          desiredCamPos.current.set(120, -120, 80); 
          break;
        case 'free':
          // RESET VIEW: Return to Overview smoothly (right-side context)
          desiredTarget.current.copy(worldPos);
          desiredCamPos.current.set(worldPos.x + 10, worldPos.y + 12, worldPos.z + 6);
          break;
        case 'starboard':
          desiredTarget.current.set(0, 0, 37.5);
          desiredCamPos.current.set(150, 0, 37.5); 
          break;
        case 'port':
          desiredTarget.current.set(0, 0, 37.5);
          desiredCamPos.current.set(-150, 0, 37.5); 
          break;
        case 'front':
          desiredTarget.current.set(0, 0, 37.5);
          desiredCamPos.current.set(0, 150, 37.5); 
          break;
        case 'rear':
          desiredTarget.current.set(0, 0, 37.5);
          desiredCamPos.current.set(0, -150, 37.5); 
          break;
      }
    }
    // Intentionally omitting position from dependency array.
    // If the robot moves, followMode handles it. We only calculate the target position
    // when a camera trigger explicitly fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFocusTrigger, cameraTarget, camera]); 

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    if (followMode) {
      // Dynamic tracking of the robot
      const worldPos = getRobotWorldPosition(position);
      desiredTarget.current.copy(worldPos);
    }
    
    if (isTransitioning.current) {
      // Smoothly interpolate both target and camera position to the exact defined state
      currentTarget.current.lerp(desiredTarget.current, delta * 4.0);
      controlsRef.current.target.copy(currentTarget.current);
      
      camera.position.lerp(desiredCamPos.current, delta * 4.0);
      controlsRef.current.update();
      
      const distTarget = currentTarget.current.distanceTo(desiredTarget.current);
      const distCam = camera.position.distanceTo(desiredCamPos.current);
      
      // Release camera for free roaming once close enough
      if (distTarget < 0.05 && distCam < 0.1) {
        isTransitioning.current = false;
      }
    } else {
      // Allow OrbitControls to rule, just sync our target refs
      if (followMode) {
        currentTarget.current.lerp(desiredTarget.current, delta * 4.0);
        controlsRef.current.target.copy(currentTarget.current);
        controlsRef.current.update();
      } else {
        currentTarget.current.copy(controlsRef.current.target);
        desiredTarget.current.copy(controlsRef.current.target);
      }
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
