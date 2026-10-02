import React from 'react';
import { robotConfig } from '@/lib/robotConfig';
import { useRobotStore } from '@/lib/robotState';
import { Torch } from './Torch';

export function CuttingArm() {
  const { 
    structureHeightZ,
    structureWidthX,
    bodyWidthX, 
    armThickness, 
    torchOffsetZ,
    trackHeightZ
  } = robotConfig;
  
  const { yPosition, xExtension } = useRobotStore((state) => state.arm);
  
  // The arm is mounted on top of the upper structure.
  const armZ = trackHeightZ + structureHeightZ + 0.04; // 0.04 is the deck thickness
  
  // Rail mounted on top of the upper structure
  
  // Calculate dynamic torch offset to keep the torch touching the curved hull
  const torchLocalX = structureWidthX / 2 + xExtension;
  const { hullRadius } = robotConfig;
  const curvatureDrop = hullRadius - hullRadius * Math.cos(torchLocalX / hullRadius);
  const dynamicTorchOffset = torchOffsetZ + curvatureDrop;

  return (
    <group position={[0, yPosition, armZ]}>
      {/* Y-Axis Linear Carriage (moves up and down) */}
      <mesh position={[structureWidthX / 2 - 0.08, 0, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.25, 0.12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.4} />
      </mesh>
      
      {/* Carriage detailing (Industrial warning stripe) */}
      <mesh position={[structureWidthX / 2 - 0.08, 0, 0.121]} receiveShadow>
         <boxGeometry args={[0.18, 0.05, 0.02]} />
         <meshStandardMaterial color="#fca311" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* X-Axis Extension Arm */}
      <group position={[structureWidthX / 2 + xExtension / 2, 0, 0.06]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[xExtension + 0.2, armThickness, armThickness]} />
          <meshStandardMaterial color="#4a5056" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Rack and pinion or linear rail visual on the arm */}
        <mesh position={[0, armThickness / 2 + 0.005, 0]} receiveShadow>
           <boxGeometry args={[xExtension + 0.15, 0.01, armThickness * 0.4]} />
           <meshStandardMaterial color="#222" metalness={0.9} roughness={0.5} />
        </mesh>
      </group>

      {/* Torch Mounting Bracket */}
      <group position={[structureWidthX / 2 + xExtension, 0, 0.06]}>
        <mesh position={[0, 0, -dynamicTorchOffset / 2]} castShadow receiveShadow>
           <boxGeometry args={[0.1, 0.15, dynamicTorchOffset]} />
           <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
        </mesh>
        
        <Torch position={[0, 0, -dynamicTorchOffset]} />
      </group>
    </group>
  );
}
