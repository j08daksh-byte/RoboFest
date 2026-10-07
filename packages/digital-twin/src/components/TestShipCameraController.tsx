// @ts-nocheck
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { shipConfig } from '../lib/geometry/shipConfig';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type CameraPreset = 'RESET' | 'FRONT' | 'REAR' | 'STARBOARD' | 'PORT' | 'TOP' | 'BOTTOM' | 'ISOMETRIC';
export type InspectionTarget = 'Whole Ship' | 'Bow' | 'Midship' | 'Stern' | 'Keel';

interface TestShipCameraControllerProps {
  preset: CameraPreset;
  targetPreset: InspectionTarget;
}

export function TestShipCameraController({ preset, targetPreset }: TestShipCameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  
  const [isAnimating, setIsAnimating] = useState(true);

  // Force Z-up convention for the camera and OrbitControls
  useEffect(() => {
    camera.up.set(0, 0, 1);
    camera.updateProjectionMatrix();
  }, [camera]);

  const { targetPos, targetLookAt } = useMemo(() => {
    const L = shipConfig.lengthOverall;
    const B = shipConfig.beam;
    const H = shipConfig.hullHeight;

    const lookAt = new THREE.Vector3(0, 0, H / 2);
    const pos = new THREE.Vector3();

    // 1. Determine base target from InspectionTarget
    let targetL = L; // Length of the target region
    const targetB = B; // Beam of the target region
    let targetH = H; // Height of the target region

    switch (targetPreset) {
      case 'Whole Ship':
        lookAt.set(0, 0, H / 2);
        targetL = L;
        break;
      case 'Bow':
        lookAt.set(0, L / 2 - 15, H / 2);
        targetL = 30; // approx bow region length
        break;
      case 'Midship':
        lookAt.set(0, 0, H / 2);
        targetL = 40;
        break;
      case 'Stern':
        lookAt.set(0, -L / 2 + 15, H / 2);
        targetL = 30;
        break;
      case 'Keel':
        lookAt.set(0, 0, 0);
        targetH = 5;
        targetL = 40;
        break;
    }

    // 2. Mathematically calculate framing distances based on camera FOV
    const isPerspective = (camera as any as THREE.PerspectiveCamera).isPerspectiveCamera;
    let distForLength = L;
    let distForBeam = B;
    let distForHeight = H;

    if (isPerspective) {
      const pCam = camera as any as THREE.PerspectiveCamera;
      const vFov = (pCam.fov * Math.PI) / 180;
      const aspect = size.width / size.height || pCam.aspect;
      
      // Helper to calculate distance needed to fit width & height
      const calcDist = (w: number, h: number, pad = 1.2) => {
        const dH = h / (2 * Math.tan(vFov / 2));
        const dW = w / (2 * Math.tan(vFov / 2) * aspect);
        return Math.max(dH, dW) * pad;
      };

      // Distance if we are looking from the side (we see length horizontally, height vertically)
      distForLength = calcDist(targetL, targetH);
      
      // Distance if we are looking from front/back (we see beam horizontally, height vertically)
      distForBeam = calcDist(targetB, targetH);
      
      // Distance if looking from top/bottom (we see beam horizontally, length vertically... or vice versa depending on roll, but we force Z-up so Y is vertical on screen when looking from top? No, if we look from +Z down to -Z with UP=[0,0,1], UP is actually ambiguous. We usually want +Y to be UP on screen for a top view.)
      distForHeight = calcDist(targetB, targetL, 1.1);
    } else {
      distForLength = targetL * 1.5;
      distForBeam = targetB * 1.5;
      distForHeight = Math.max(targetL, targetB) * 1.5;
    }

    // 3. Determine camera position from CameraPreset
    switch (preset) {
      case 'RESET':
        // A comfortable 3/4 view
        pos.set(distForLength * 0.7, distForLength * 0.7, targetH + distForLength * 0.5);
        lookAt.set(0, 0, H / 2);
        break;
      case 'FRONT':
        // Looking aft (-Y) from forward (+Y)
        pos.set(lookAt.x, lookAt.y + distForBeam, lookAt.z);
        break;
      case 'REAR':
        // Looking forward (+Y) from aft (-Y)
        pos.set(lookAt.x, lookAt.y - distForBeam, lookAt.z);
        break;
      case 'STARBOARD':
        // Looking port (-X) from starboard (+X)
        pos.set(lookAt.x + distForLength, lookAt.y, lookAt.z);
        break;
      case 'PORT':
        // Looking starboard (+X) from port (-X)
        pos.set(lookAt.x - distForLength, lookAt.y, lookAt.z);
        break;
      case 'TOP':
        // Looking down (-Z) from above (+Z)
        // Note: For top view, OrbitControls with Z-up might get gimbal lock if camera looks exactly down -Z.
        // We offset Y by a tiny amount to preserve the up vector cleanly.
        pos.set(lookAt.x, lookAt.y - 0.1, lookAt.z + distForHeight);
        break;
      case 'BOTTOM':
        // Looking up (+Z) from below (-Z)
        pos.set(lookAt.x, lookAt.y - 0.1, lookAt.z - distForHeight);
        break;
      case 'ISOMETRIC':
        pos.set(lookAt.x + distForLength * 0.7, lookAt.y + distForLength * 0.7, lookAt.z + distForHeight * 0.7);
        break;
    }

    return { targetPos: pos, targetLookAt: lookAt };
  }, [preset, targetPreset, camera, size]);

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
      maxDistance={shipConfig.lengthOverall * 4}
      maxPolarAngle={Math.PI} // Allow going underneath
      onStart={() => setIsAnimating(false)} // User interaction stops auto-animation
    />
  );
}


