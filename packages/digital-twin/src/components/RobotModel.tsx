// @ts-nocheck
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { robotConfig } from '../lib/robotConfig';
import { Tracks } from './Tracks';
import { Electromagnet } from './Electromagnet';
import { CuttingArm } from './CuttingArm';
import { CoordinateAxes } from './CoordinateAxes';
import { useTwinState } from '../TwinProvider';
import { Text } from '@react-three/drei';
import { IndustrialMaterial } from './IndustrialMaterial';

export function RobotModel({ showAxes = true }: { showAxes?: boolean }) {
  const { bodyWidthX, bodyLengthY, bodyHeightZ, trackHeightZ, structureHeightZ, structureWidthX, structureLengthY, hullRadius } = robotConfig;
  const { arm: { xExtension }, position } = useTwinState();
  const torchX = bodyWidthX / 2 + xExtension;

  // Calculate rotation to match hull curvature
  const theta = Math.asin(position.x / hullRadius);

  // Create a tank-like hull shape (side profile)
  // X maps to Length (Y), Y maps to Height (Z)
  const hullShape = useMemo(() => {
    const shape = new THREE.Shape();
    const l = bodyLengthY;
    const h = bodyHeightZ;
    shape.moveTo(-l/2 + l*0.1, h/2);    // Top rear
    shape.lineTo(l/2 - l*0.15, h/2);    // Top front
    shape.lineTo(l/2 + l*0.05, h*0.1);  // Upper nose
    shape.lineTo(l/2, -h/2);            // Bottom front (sloped glacis)
    shape.lineTo(-l/2, -h/2);           // Bottom rear
    shape.lineTo(-l/2 - l*0.05, h*0.1); // Rear bulge
    shape.lineTo(-l/2 + l*0.1, h/2);    // Back to top rear
    return shape;
  }, [bodyLengthY, bodyHeightZ]);

  const extrudeSettings = useMemo(() => ({
    depth: bodyWidthX,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  }), [bodyWidthX]);

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, -theta, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Robot Base Chassis */}
        <group position={[0, 0, trackHeightZ / 2]}>
        
        {/* Main Tank Hull */}
        {/* The shape is drawn in XY. Extrudes along Z.
            We want Shape X -> Robot Y. Shape Y -> Robot Z. Extrude Z -> Robot X. 
            Standard rotation to map (X->Y, Y->Z, Z->X) is rotation={[Math.PI/2, Math.PI/2, 0]}
            Let's use a group hierarchy to make it trivial without math: */}
        <group rotation={[0, 0, Math.PI / 2]}> {/* Rotates local X to world Y, local Y to world -X */}
          <group rotation={[Math.PI / 2, 0, 0]}> {/* Rotates local Y (now world -X) to world Z, local Z to world X */}
             <mesh position={[0, 0, -bodyWidthX / 2]} castShadow receiveShadow>
               <extrudeGeometry args={[hullShape, extrudeSettings]} />
               <IndustrialMaterial color="#8a8d8f" metalness={0.5} roughness={0.5} bumpScale={0.003} />
             </mesh>
          </group>
        </group>
        
        {/* Chassis cross-members / bracing */}
        <mesh position={[0, bodyLengthY / 3, bodyHeightZ / 2 + 0.01]} receiveShadow castShadow>
          <boxGeometry args={[bodyWidthX * 1.05, 0.05, 0.02]} />
          <IndustrialMaterial color="#666666" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, -bodyLengthY / 3, bodyHeightZ / 2 + 0.01]} receiveShadow castShadow>
          <boxGeometry args={[bodyWidthX * 1.05, 0.05, 0.02]} />
          <IndustrialMaterial color="#666666" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Side mounting plates connecting tracks */}
        <mesh position={[(bodyWidthX + 0.02) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1]} />
          <IndustrialMaterial color="#999999" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-(bodyWidthX + 0.02) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1]} />
          <IndustrialMaterial color="#999999" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      <Tracks />
      <Electromagnet />

      {/* Upper Structure - Support Frame */}
      <group position={[0, 0, trackHeightZ + structureHeightZ / 2]}>
        {/* Vertical standoff pillars from chassis to upper deck */}
        <mesh position={[structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <IndustrialMaterial color="#b0b0b0" metalness={0.6} />
        </mesh>
        <mesh position={[-structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <IndustrialMaterial color="#b0b0b0" metalness={0.6} />
        </mesh>
        <mesh position={[structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <IndustrialMaterial color="#b0b0b0" metalness={0.6} />
        </mesh>
        <mesh position={[-structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <IndustrialMaterial color="#b0b0b0" metalness={0.6} />
        </mesh>

        {/* The Upper Deck Plate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[structureWidthX, structureLengthY, 0.04]} />
          <IndustrialMaterial color="#a0a4a8" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      <CuttingArm />

      {/* Vertical Cut Path Visualization */}
      <group position={[torchX, 0, 0]}>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.005, 3, 0.005]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
        </mesh>
        {showAxes && (
          <Text position={[0.05, 1.2, 0.05]} color="#ffaa00" fontSize={0.05}>
            VERTICAL CUT PATH
          </Text>
        )}
      </group>

      {showAxes && <CoordinateAxes />}
      </group>
    </group>
  );
}

