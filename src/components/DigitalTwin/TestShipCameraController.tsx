import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { shipConfig } from '@/lib/geometry/shipConfig';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type CameraPreset = 'RESET' | 'FRONT' | 'REAR' | 'STARBOARD' | 'PORT' | 'TOP' | 'BOTTOM' | 'ISOMETRIC';
export type InspectionTarget = 'Whole Ship' | 'Bow' | 'Midship' | 'Stern' | 'Keel';

interface TestShipCameraControllerProps {
  preset: CameraPreset;
  targetPreset: InspectionTarget;
}

export function TestShipCameraController({ preset, targetPreset }: TestShipCameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  
  const [isAnimating, setIsAnimating] = useState(true);

  // Derive targetPos and targetLookAt without useEffect side effects
  const { targetPos, targetLookAt } = useMemo(() => {
    const L = shipConfig.lengthOverall;
    const B = shipConfig.beam;
    const H = shipConfig.hullHeight;

    const lookAt = new THREE.Vector3(0, 0, H / 2);
    const pos = new THREE.Vector3();

    // 1. Determine base target from InspectionTarget
    switch (targetPreset) {
      case 'Whole Ship':
        lookAt.set(0, 0, H / 2);
        break;
      case 'Bow':
        lookAt.set(0, L / 2 - 10, H / 2);
        break;
      case 'Midship':
        lookAt.set(0, 0, H / 2);
        break;
      case 'Stern':
        lookAt.set(0, -L / 2 + 10, H / 2);
        break;
      case 'Keel':
        lookAt.set(0, 0, 0);
        break;
    }

    // 2. Determine base distance needed based on target
    const distL = targetPreset === 'Whole Ship' ? L * 1.2 : L * 0.3;
    const distB = targetPreset === 'Whole Ship' ? B * 3 : B * 2;

    // 3. Determine camera position from CameraPreset
    switch (preset) {
      case 'RESET':
        pos.set(B * 2.5, L * 0.8, H * 3);
        lookAt.set(0, 0, H / 2);
        break;
      case 'FRONT':
        pos.set(0, lookAt.y + distL, lookAt.z);
        break;
      case 'REAR':
        pos.set(0, lookAt.y - distL, lookAt.z);
        break;
      case 'STARBOARD':
        pos.set(lookAt.x + distB, lookAt.y, lookAt.z);
        break;
      case 'PORT':
        pos.set(lookAt.x - distB, lookAt.y, lookAt.z);
        break;
      case 'TOP':
        pos.set(lookAt.x, lookAt.y, lookAt.z + distL);
        break;
      case 'BOTTOM':
        pos.set(lookAt.x, lookAt.y, lookAt.z - (targetPreset === 'Whole Ship' ? distL * 0.5 : distL * 0.3));
        break;
      case 'ISOMETRIC':
        pos.set(lookAt.x + distB, lookAt.y + distL * 0.7, lookAt.z + H * 2);
        break;
    }

    return { targetPos: pos, targetLookAt: lookAt };
  }, [preset, targetPreset]);

  // Restart animation when targets change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAnimating(true);
  }, [targetPos, targetLookAt]);

  // Initial snap on load
  useEffect(() => {
    camera.position.copy(targetPos);
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetLookAt);
      controlsRef.current.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Smooth Interpolation
  useFrame((_state, delta) => {
    if (!isAnimating || !controlsRef.current) return;

    // Dampen camera position
    camera.position.lerp(targetPos, 4 * delta);
    
    // Dampen controls target
    controlsRef.current.target.lerp(targetLookAt, 4 * delta);
    controlsRef.current.update();

    // Stop animating when close enough
    if (camera.position.distanceTo(targetPos) < 0.1 && controlsRef.current.target.distanceTo(targetLookAt) < 0.1) {
      setIsAnimating(false);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={shipConfig.lengthOverall * 3}
      maxPolarAngle={Math.PI} // Allow going underneath
      onStart={() => setIsAnimating(false)} // User interaction stops auto-animation
    />
  );
}
