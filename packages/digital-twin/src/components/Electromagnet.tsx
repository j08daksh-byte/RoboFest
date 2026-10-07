// @ts-nocheck
import React from 'react';
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';

export function Electromagnet() {
  const { electromagnetRadius, electromagnetHeightZ } = robotConfig;
  const { electromagnet: { enabled } } = useTwinState();

  return (
    <group position={[0, 0, electromagnetHeightZ / 2]}>
      {/* Main Outer Body (Silver) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[electromagnetRadius, electromagnetRadius, electromagnetHeightZ, 32]} />
        <meshStandardMaterial 
          color="#cccccc" 
          metalness={0.9} 
          roughness={0.3} 
        />
      </mesh>

      {/* Dark Inner Pot (Bottom Face) */}
      <mesh position={[0, 0, -electromagnetHeightZ / 2 - 0.001]} rotation={[Math.PI, 0, 0]} receiveShadow>
        <circleGeometry args={[electromagnetRadius * 0.9, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Center Metallic Circle (Bottom Face) */}
      <mesh position={[0, 0, -electromagnetHeightZ / 2 - 0.002]} rotation={[Math.PI, 0, 0]} receiveShadow>
        <circleGeometry args={[electromagnetRadius * 0.45, 32]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Active Indicator Ring */}
      {enabled && (
        <mesh position={[0, 0, -electromagnetHeightZ / 2 - 0.003]} rotation={[Math.PI, 0, 0]}>
          <ringGeometry args={[electromagnetRadius * 0.9, electromagnetRadius * 0.95, 32]} />
          <meshBasicMaterial color="#ffaa00" />
        </mesh>
      )}
      
      {/* Subtle glow when active */}
      {enabled && (
        <pointLight position={[0, 0, -0.05]} intensity={0.5} distance={0.5} color="#ffaa00" />
      )}
    </group>
  );
}

