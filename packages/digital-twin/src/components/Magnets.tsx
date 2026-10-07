// @ts-nocheck
import React from 'react';
import { robotConfig } from '../lib/robotConfig';

export function Magnets({ trackLengthY, position }: { trackLengthY: number; position: [number, number, number] }) {
  const { magnetCountPerTrack, magnetRadius, magnetThickness } = robotConfig;
  const magnets = [];
  const startY = -trackLengthY / 2 + 0.05;
  const endY = trackLengthY / 2 - 0.05;
  const step = (endY - startY) / (magnetCountPerTrack - 1);

  for (let i = 0; i < magnetCountPerTrack; i++) {
    const y = startY + i * step;
    magnets.push(
      <group key={i} position={[0, y, -magnetThickness / 2]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Outer magnet casing */}
        <mesh receiveShadow>
          <cylinderGeometry args={[magnetRadius, magnetRadius, magnetThickness, 24]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Inner magnetic core (countersunk look) */}
        <mesh position={[0, magnetThickness / 2 + 0.001, 0]}>
          <cylinderGeometry args={[magnetRadius * 0.6, magnetRadius * 0.6, 0.002, 16]} />
          <meshStandardMaterial color="#222" metalness={0.6} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position}>
      {magnets}
    </group>
  );
}

