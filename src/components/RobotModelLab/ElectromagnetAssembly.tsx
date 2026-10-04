'use client';
import React from 'react';
import { labRobotConfig } from './config';

export function ElectromagnetAssembly() {
  const {
    electromagnetOuterRadius,
    electromagnetThickness,
    electromagnetBoreRadius,
    electromagnetZOffset
  } = labRobotConfig;

  // The electromagnet sits under the chassis, flat. 
  // Normally its bottom face would stick onto the wall (Z=0 or below chassis).
  // Axis is vertical (Z).
  
  const innerRadius = electromagnetOuterRadius * 0.8;

  return (
    <group position={[0, 0, -electromagnetZOffset]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Outer Housing Ring (Metal) */}
      <mesh position={[0, electromagnetThickness / 2, 0]} castShadow receiveShadow>
        {/* We use a tube or torus or just a ring to show it's an outer housing */}
        <cylinderGeometry args={[electromagnetOuterRadius, electromagnetOuterRadius, electromagnetThickness, 32, 1, true]} />
        <meshStandardMaterial color="#666" metalness={0.9} roughness={0.3} side={2} />
      </mesh>
      
      {/* Dark Central Face (Active area) */}
      <mesh position={[0, electromagnetThickness / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[innerRadius, innerRadius, electromagnetThickness * 0.95, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Central Bore / Opening */}
      <mesh position={[0, electromagnetThickness / 2, 0]}>
        <cylinderGeometry args={[electromagnetBoreRadius, electromagnetBoreRadius, electromagnetThickness * 1.05, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Cable exiting from the side */}
      <mesh position={[electromagnetOuterRadius * 0.9, electromagnetThickness / 2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.005, 0.005, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}
