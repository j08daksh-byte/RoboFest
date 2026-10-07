// @ts-nocheck
import React from 'react';
import * as THREE from 'three';
import { useTwinState } from '../TwinProvider';
import { robotConfig } from '../lib/robotConfig';
import { getRobotWorldPosition } from './SafetyCables';

export function HoseSystem() {
  const { position } = useTwinState();
  const worldPos = getRobotWorldPosition(position);

  // Cylinders are at ground near the mast
  const mastX = 95; // Matched with SafetyCables
  const mastZBase = -2;
  const mastZTop = 45; 
  
  const cylX = mastX + 1.2;
  const cylY = 0 - 1.5;
  const cylZ = mastZBase + 1.8; // Top of cylinders

  // Route 1: From cylinders to strain relief on the lower mast
  const relief1 = new THREE.Vector3(mastX, 0 - 0.4, mastZBase + 3);
  
  // Route 2: Up the mast to the boom
  const relief2 = new THREE.Vector3(mastX - 0.5, 0 - 0.2, mastZTop - 1.0);
  
  // Route 3: To the robot (torch connection)
  // The unrotated robot has X as right, Y as forward.
  // After rotating +90 around Z, New X = -Y (Forward), New Y = X (Right).
  // Torch assembly is on the Right side.
  const { arm: { xExtension } } = useTwinState();
  const torchLocalX = position.x; // Central forward/back on the body
  const torchLocalY = position.y + (robotConfig.bodyWidthX / 2 + xExtension); // Right side
  const torchLocalZ = position.z + robotConfig.trackHeightZ + robotConfig.structureHeightZ + 0.2;
  const torchWorld = getRobotWorldPosition({ x: torchLocalX, y: torchLocalY, z: torchLocalZ });

  const startRed = new THREE.Vector3(cylX + 0.3, cylY, cylZ - 0.2);
  const startBlue = new THREE.Vector3(cylX - 0.3, cylY, cylZ);

  // Red Hose
  const curveRed = new THREE.CatmullRomCurve3([
    startRed,
    relief1,
    relief2,
    new THREE.Vector3((relief2.x + torchWorld.x)/2, (relief2.y + torchWorld.y)/2, (relief2.z + torchWorld.z)/2 - 1.5), 
    torchWorld
  ]);

  // Blue Hose
  const torchWorldBlue = new THREE.Vector3(torchWorld.x, torchWorld.y + 0.05, torchWorld.z);
  const curveBlue = new THREE.CatmullRomCurve3([
    startBlue,
    new THREE.Vector3(relief1.x, relief1.y + 0.05, relief1.z),
    new THREE.Vector3(relief2.x, relief2.y + 0.05, relief2.z),
    new THREE.Vector3((relief2.x + torchWorld.x)/2, (relief2.y + torchWorld.y)/2 + 0.05, (relief2.z + torchWorld.z)/2 - 1.4),
    torchWorldBlue
  ]);

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curveRed, 64, 0.02, 8, false]} />
        <meshStandardMaterial color="#b30000" roughness={0.7} />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[curveBlue, 64, 0.02, 8, false]} />
        <meshStandardMaterial color="#0033cc" roughness={0.7} />
      </mesh>
    </group>
  );
}

