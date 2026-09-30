import React from 'react';
import { robotConfig } from '@/lib/robotConfig';
import { useRobotStore } from '@/lib/robotState';

export function Electromagnet() {
  const { electromagnetRadius, electromagnetHeightZ } = robotConfig;
  const enabled = useRobotStore((state) => state.electromagnet.enabled);

  return (
    <group position={[0, 0, electromagnetHeightZ / 2]}>
      {/* Main Core */}
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[electromagnetRadius, electromagnetRadius, electromagnetHeightZ, 32]} />
        <meshStandardMaterial 
          color={enabled ? "#333" : "#222"} 
          metalness={0.9} 
          roughness={0.3} 
        />
      </mesh>

      {/* Active Indicator Ring */}
      {enabled && (
        <mesh position={[0, 0, -electromagnetHeightZ / 2 + 0.002]}>
          <ringGeometry args={[electromagnetRadius * 0.7, electromagnetRadius * 0.9, 32]} />
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
