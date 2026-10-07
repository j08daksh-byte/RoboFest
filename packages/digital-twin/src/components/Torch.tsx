// @ts-nocheck
import React from 'react';
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';

export function Torch({ position }: { position: [number, number, number] }) {
  const { torchRadius, torchLength } = robotConfig;
  const { torch: { enabled } } = useTwinState();

  return (
    <group position={position}>
      {/* The torch points along -Z toward the hull */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Main Torch Barrel/Body (Brass) */}
        <mesh castShadow>
          <cylinderGeometry args={[torchRadius, torchRadius, torchLength * 0.7, 24]} />
          <meshStandardMaterial color="#c5b358" metalness={0.9} roughness={0.2} /> {/* Shiny brass */}
        </mesh>
        
        {/* Torch Valves / Mixing Chamber */}
        <mesh position={[0, -torchLength * 0.35, 0]} castShadow>
          <cylinderGeometry args={[torchRadius * 1.5, torchRadius * 1.5, 0.04, 24]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.5} />
        </mesh>
        {/* Hose Connectors */}
        <mesh position={[0.015, -torchLength * 0.4, 0]} castShadow>
           <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
           <meshStandardMaterial color="#b5a642" metalness={0.8} />
        </mesh>
        <mesh position={[-0.015, -torchLength * 0.4, 0]} castShadow>
           <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
           <meshStandardMaterial color="#b5a642" metalness={0.8} />
        </mesh>

        {/* Nozzle/Tip (Copper) */}
        <mesh position={[0, torchLength * 0.35 + 0.02, 0]} castShadow>
          <cylinderGeometry args={[torchRadius, torchRadius * 0.3, 0.04, 24]} />
          <meshStandardMaterial color="#b87333" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Small tip end (Heat discolored) */}
        <mesh position={[0, torchLength * 0.35 + 0.045, 0]} castShadow>
          <cylinderGeometry args={[torchRadius * 0.3, torchRadius * 0.2, 0.01, 16]} />
          <meshStandardMaterial color="#4a3b32" metalness={0.9} roughness={0.6} /> {/* Scorched metal */}
        </mesh>
      </group>

      {/* Flame visualization */}
      {enabled && (
        <group position={[0, 0, -torchLength / 2 - 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Outer Flame (Blue/transparent) */}
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.015, 0.16, 16]} />
            <meshBasicMaterial color="#0088ff" transparent opacity={0.5} />
          </mesh>
          {/* Inner intense Flame (White/Blue core) */}
          <mesh position={[0, 0.04, 0]}>
            <coneGeometry args={[0.008, 0.08, 16]} />
            <meshBasicMaterial color="#e0ffff" />
          </mesh>
          <pointLight position={[0, 0.08, 0]} intensity={1.5} distance={1} color="#00e5ff" />
        </group>
      )}
    </group>
  );
}

