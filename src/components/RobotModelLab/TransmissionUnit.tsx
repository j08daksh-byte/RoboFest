'use client';
import React from 'react';
import { labRobotConfig } from './config';

export function TransmissionUnit(props: any) {
  const {
    transmissionOuterRadius,
    transmissionThickness,
    outerFlangeThickness,
    recessDepth,
    centralBoreRadius
  } = labRobotConfig;

  // We are designing this to be placed on the side. 
  // By default cylinder axis is Y in ThreeJS if we rotate it, or Y is up.
  // We want the transmission axis to face laterally (along Y axis).
  // So we rotate the cylinder 90 degrees around X or Z.
  // Let's create the shapes along Z locally and then the assembly will rotate it to face Y.

  const innerBodyRadius = transmissionOuterRadius * 0.85;
  const mainBodyThickness = transmissionThickness - outerFlangeThickness;
  
  return (
    <group {...props}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Outer Flange */}
        <mesh position={[0, transmissionThickness / 2 - outerFlangeThickness / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[transmissionOuterRadius, transmissionOuterRadius, outerFlangeThickness, 32]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Main Cylindrical Body (recessed outer diameter) */}
        <mesh position={[0, -outerFlangeThickness / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[innerBodyRadius, innerBodyRadius, mainBodyThickness, 32]} />
          <meshStandardMaterial color="#666" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Central Hub/Shaft face inside the recess */}
        {/* We place a small hub sticking out inside the flange, with a bore */}
        <mesh position={[0, transmissionThickness / 2 - outerFlangeThickness - recessDepth / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[innerBodyRadius * 0.4, innerBodyRadius * 0.4, recessDepth, 32]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.5} />
        </mesh>

        {/* Central Bore (Hole) */}
        {/* To make a visible open bore without complex CSG, we can draw a black cylinder slightly thicker than the hub, 
            or a tube. Since we need a realistic bore, we'll use a TubeGeometry or just a dark cylinder to simulate depth,
            or an actual ring geometry. Let's use a Tube or just an open cylinder.
        */}
        <mesh position={[0, transmissionThickness / 2 - outerFlangeThickness + 0.001, 0]}>
          <circleGeometry args={[centralBoreRadius, 32]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
        <mesh position={[0, -transmissionThickness / 2 - 0.001, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[centralBoreRadius, 32]} />
          <meshBasicMaterial color="#050505" />
        </mesh>
      </group>
    </group>
  );
}
