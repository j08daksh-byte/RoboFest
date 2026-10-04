'use client';
import React from 'react';
import { labRobotConfig } from './config';
import { TransmissionUnit } from './TransmissionUnit';

export function CrawlerAssembly({ isLeft }: { isLeft: boolean }) {
  const {
    frontRearSpacingX,
    transmissionOuterRadius,
    crawlerWidthY,
    beltThickness,
  } = labRobotConfig;

  // The 3 transmissions: Front, Center, Rear
  const transmissions = [
    { id: 'front', x: frontRearSpacingX },
    { id: 'center', x: 0 },
    { id: 'rear', x: -frontRearSpacingX },
  ];

  // Belt geometry wrapper
  // Length is 2 * frontRearSpacingX (distance from front to rear axis)
  // Height is 2 * transmissionOuterRadius
  const beltLength = 2 * frontRearSpacingX;
  const beltHeight = 2 * transmissionOuterRadius;
  
  // Belt width is slightly wider than crawlerWidthY? Or matches it.
  const beltW = crawlerWidthY;
  
  return (
    <group>
      {/* 3 Transmission Units */}
      {transmissions.map((t) => (
        <TransmissionUnit key={t.id} position={[t.x, 0, 0]} />
      ))}

      {/* Continuous Crawler Belt */}
      <group>
        {/* Top Run */}
        <mesh position={[0, 0, transmissionOuterRadius + beltThickness / 2]} castShadow receiveShadow>
          <boxGeometry args={[beltLength, beltW, beltThickness]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        {/* Bottom Run */}
        <mesh position={[0, 0, -transmissionOuterRadius - beltThickness / 2]} castShadow receiveShadow>
          <boxGeometry args={[beltLength, beltW, beltThickness]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        
        {/* Front Curved Transition */}
        {/* A half-cylinder wrapper */}
        <mesh position={[frontRearSpacingX, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[transmissionOuterRadius + beltThickness, transmissionOuterRadius + beltThickness, beltW, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} side={2} /> {/* side=DoubleSide equivalent if 2 */}
        </mesh>

        {/* Rear Curved Transition */}
        <mesh position={[-frontRearSpacingX, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI]} castShadow receiveShadow>
          <cylinderGeometry args={[transmissionOuterRadius + beltThickness, transmissionOuterRadius + beltThickness, beltW, 32, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} side={2} />
        </mesh>
      </group>
    </group>
  );
}
