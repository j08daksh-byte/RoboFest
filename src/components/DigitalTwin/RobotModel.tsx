import React from 'react';
import { robotConfig } from '@/lib/robotConfig';
import { Tracks } from './Tracks';
import { Electromagnet } from './Electromagnet';
import { CuttingArm } from './CuttingArm';
import { CoordinateAxes } from './CoordinateAxes';
import { useRobotStore } from '@/lib/robotState';
import { Text } from '@react-three/drei';

export function RobotModel({ showAxes = true }: { showAxes?: boolean }) {
  const { bodyWidthX, bodyLengthY, bodyHeightZ, trackHeightZ, structureHeightZ, structureWidthX, structureLengthY, hullRadius } = robotConfig;
  const xExtension = useRobotStore((state) => state.arm.xExtension);
  const position = useRobotStore((state) => state.position);
  const torchX = bodyWidthX / 2 + xExtension;

  // Calculate rotation to match hull curvature
  const theta = Math.asin(position.x / hullRadius);

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, -theta, 0]}>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Robot Base Chassis */}
        <group position={[0, 0, trackHeightZ / 2]}>
        {/* Main central block */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[bodyWidthX, bodyLengthY, bodyHeightZ]} />
          <meshStandardMaterial color="#fca311" metalness={0.6} roughness={0.4} /> {/* Industrial Safety Orange */}
        </mesh>
        
        {/* Chassis cross-members / bracing */}
        <mesh position={[0, bodyLengthY / 3, bodyHeightZ / 2 + 0.01]} receiveShadow castShadow>
          <boxGeometry args={[bodyWidthX * 1.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#1f2329" metalness={0.8} roughness={0.5} />
        </mesh>
        <mesh position={[0, -bodyLengthY / 3, bodyHeightZ / 2 + 0.01]} receiveShadow castShadow>
          <boxGeometry args={[bodyWidthX * 1.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#1f2329" metalness={0.8} roughness={0.5} />
        </mesh>

        {/* Side mounting plates connecting tracks */}
        <mesh position={[(bodyWidthX + 0.02) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-(bodyWidthX + 0.02) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Decorative caution stripes on the side plates */}
        <mesh position={[(bodyWidthX + 0.04) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.005, bodyLengthY * 0.6, bodyHeightZ * 0.2]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        <mesh position={[-(bodyWidthX + 0.04) / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[0.005, bodyLengthY * 0.6, bodyHeightZ * 0.2]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      </group>

      <Tracks />
      <Electromagnet />

      {/* Upper Structure - Support Frame */}
      <group position={[0, 0, trackHeightZ + structureHeightZ / 2]}>
        {/* Vertical standoff pillars from chassis to upper deck */}
        <mesh position={[structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>
        <mesh position={[-structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>
        <mesh position={[structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>
        <mesh position={[-structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
           <cylinderGeometry args={[0.02, 0.03, structureHeightZ, 12]} />
           <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>

        {/* The Upper Deck Plate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[structureWidthX, structureLengthY, 0.04]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Top cover housing */}
        <mesh position={[0, -0.05, 0.04]} castShadow receiveShadow>
          <boxGeometry args={[structureWidthX * 0.8, structureLengthY * 0.6, 0.06]} />
          <meshStandardMaterial color="#14213d" metalness={0.7} roughness={0.3} /> {/* Industrial Blue casing */}
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
