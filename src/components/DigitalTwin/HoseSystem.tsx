import React from 'react';
import * as THREE from 'three';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';
import { SUPPLY_BASE_Y, SUPPLY_BASE_Z } from './SupplySystem';

export function HoseSystem() {
  const { position, arm } = useRobotStore();
  const { structureWidthX, trackHeightZ, structureHeightZ, torchOffsetZ } = robotConfig;
  
  // 1. Ground Cylinders
  const cylinderBaseX = -10;
  const cylinderBaseY = -29;
  const cylinderBaseZ = 10;
  
  const startPointRed = new THREE.Vector3(cylinderBaseX + 0.4, cylinderBaseY + 1.6, cylinderBaseZ); // Acetylene
  const startPointBlue = new THREE.Vector3(cylinderBaseX - 0.4, cylinderBaseY + 1.8, cylinderBaseZ); // Oxygen
  
  // 2. Safety Pole Top Routing
  const poleTopX = -12;
  const poleTopY = 8;
  const poleTopZ = 12;
  const poleRed = new THREE.Vector3(poleTopX, poleTopY + 0.1, poleTopZ);
  const poleBlue = new THREE.Vector3(poleTopX, poleTopY + 0.2, poleTopZ);
  
  // 3. Midpoint Routing (Sagging catenary along the 4-wire corridor)
  const midX = (poleTopX + position.x) / 2;
  const midY = (poleTopY + position.y) / 2;
  const midZ = (poleTopZ + position.z) / 2 - 2.0; // natural sag
  const sagMidRed = new THREE.Vector3(midX, midY, midZ - 0.2);
  const sagMidBlue = new THREE.Vector3(midX, midY, midZ + 0.2);

  // 4. End at the torch connectors in World Space
  const torchWorldX = position.x + structureWidthX / 2 + arm.xExtension;
  const torchWorldY = position.y + arm.yPosition;
  const torchWorldZ = position.z + trackHeightZ + structureHeightZ + 0.04 + 0.06 - torchOffsetZ + 0.05; 
  
  const endPointRed = new THREE.Vector3(torchWorldX - 0.015, torchWorldY, torchWorldZ);
  const endPointBlue = new THREE.Vector3(torchWorldX + 0.015, torchWorldY, torchWorldZ);

  // Generate Splines
  const curveRed = new THREE.CatmullRomCurve3([
    startPointRed,
    new THREE.Vector3(startPointRed.x, startPointRed.y + 1.0, startPointRed.z), // Up from cylinder
    poleRed, // Over the pole
    sagMidRed, // Sag along corridor
    new THREE.Vector3(position.x + 0.1, position.y + 0.5, position.z + 0.5), // near robot top
    new THREE.Vector3(endPointRed.x, endPointRed.y + 0.3, endPointRed.z + 0.2), // strain relief loop above arm
    endPointRed
  ]);

  const curveBlue = new THREE.CatmullRomCurve3([
    startPointBlue,
    new THREE.Vector3(startPointBlue.x, startPointBlue.y + 1.0, startPointBlue.z),
    poleBlue,
    sagMidBlue,
    new THREE.Vector3(position.x - 0.1, position.y + 0.5, position.z + 0.5),
    new THREE.Vector3(endPointBlue.x, endPointBlue.y + 0.35, endPointBlue.z + 0.25),
    endPointBlue
  ]);

  return (
    <group>
      {/* Red Hose */}
      <mesh castShadow>
        <tubeGeometry args={[curveRed, 128, 0.008, 12, false]} />
        <meshStandardMaterial color="#b30000" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Blue Hose */}
      <mesh castShadow>
        <tubeGeometry args={[curveBlue, 128, 0.008, 12, false]} />
        <meshStandardMaterial color="#0033cc" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}
