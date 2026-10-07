// @ts-nocheck
import React from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useTwinState } from '../TwinProvider';

export function CoordinateAxes() {
  const { uiMode } = useTwinState();

  if (uiMode === 'presentation') return null;

  return (
    <group position={[0, 0, 0]}>
      {/* X Axis - Red (Arm Extension / Right) */}
      <mesh position={[0.5, 0, 0]}>
        <boxGeometry args={[1, 0.01, 0.01]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <Billboard position={[1.1, 0, 0]}>
        <Text color="#ff8888" fontSize={0.08} outlineWidth={0.005} outlineColor="#000">
          +X (ARM EXTENSION)
        </Text>
      </Billboard>

      {/* Y Axis - Green (Vertical Movement) */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.01, 1, 0.01]} />
        <meshBasicMaterial color="#44ff44" />
      </mesh>
      <Billboard position={[0, 1.1, 0]}>
        <Text color="#88ff88" fontSize={0.08} outlineWidth={0.005} outlineColor="#000">
          +Y (VERTICAL / UP)
        </Text>
      </Billboard>

      {/* Z Axis - Blue (Away from hull) */}
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[0.01, 0.01, 1]} />
        <meshBasicMaterial color="#4444ff" />
      </mesh>
      <Billboard position={[0, 0, 1.1]}>
        <Text color="#8888ff" fontSize={0.08} outlineWidth={0.005} outlineColor="#000">
          +Z (OUTWARD)
        </Text>
      </Billboard>
      <Billboard position={[0, 0, -0.5]}>
        <Text color="#44ffff" fontSize={0.08} outlineWidth={0.005} outlineColor="#000">
          -Z (TOWARD HULL / TORCH)
        </Text>
      </Billboard>
    </group>
  );
}

