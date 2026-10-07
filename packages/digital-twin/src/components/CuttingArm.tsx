// @ts-nocheck
import React from 'react';
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';
import { Torch } from './Torch';
import { IndustrialMaterial } from './IndustrialMaterial';

export function CuttingArm() {
  const { 
    structureHeightZ,
    structureWidthX,
    bodyWidthX, 
    armThickness, 
    torchOffsetZ,
    trackHeightZ
  } = robotConfig;
  
  const { arm: { yPosition, xExtension } } = useTwinState();
  
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
        <IndustrialMaterial color="#707070" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Carriage detailing */}
      <mesh position={[structureWidthX / 2 - 0.08, 0, 0.12]} receiveShadow>
         <boxGeometry args={[0.18, 0.15, 0.02]} />
         <IndustrialMaterial color="#999999" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* X-Axis Extension Arm */}
      <group position={[structureWidthX / 2 + xExtension / 2, 0, 0.06]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[xExtension + 0.2, armThickness, armThickness]} />
          <IndustrialMaterial color="#ffcc00" metalness={0.3} roughness={0.3} bumpScale={0.002} />
        </mesh>
        
        {/* Rack and pinion or linear rail visual on the arm */}
        <mesh position={[0, armThickness / 2 + 0.005, 0]} receiveShadow>
           <boxGeometry args={[xExtension + 0.15, 0.01, armThickness * 0.4]} />
           <IndustrialMaterial color="#444444" metalness={0.8} roughness={0.5} />
        </mesh>
      </group>

      {/* Torch Mounting Bracket */}
      <group position={[structureWidthX / 2 + xExtension, 0, 0.06]}>
        <mesh position={[0, 0, -dynamicTorchOffset / 2]} castShadow receiveShadow>
           <boxGeometry args={[0.1, 0.15, dynamicTorchOffset]} />
           <IndustrialMaterial color="#ffcc00" metalness={0.3} roughness={0.3} bumpScale={0.002} />
        </mesh>
        
        <Torch position={[0, 0, -dynamicTorchOffset]} />
      </group>
    </group>
  );
}

