'use client';
import React from 'react';
import { labRobotConfig } from './config';
import { TransmissionUnit } from './TransmissionUnit';

export function CrawlerAssembly({ isLeft }: { isLeft: boolean }) {
  const {
    frontRearSpacingX,
    transmissionOuterRadius,
    crawlerWidthY,
    treadWidthY,
    treadThicknessZ,
    treadLengthX,
    treadGapX
  } = labRobotConfig;

  // The 3 transmissions: Front, Center, Rear
  // Center is aligned vertically with front/rear.
  const transmissions = [
    { id: 'front', x: frontRearSpacingX },
    { id: 'center', x: 0 },
    { id: 'rear', x: -frontRearSpacingX },
  ];

  // Path dimensions
  const R = transmissionOuterRadius;
  const straightLen = 2 * frontRearSpacingX;
  const curveLen = Math.PI * R;
  const totalLen = 2 * straightLen + 2 * curveLen;
  
  const treadStep = treadLengthX + treadGapX;
  const numTreads = Math.floor(totalLen / treadStep);
  const actualStep = totalLen / numTreads; // Adjust slightly to close the loop

  const treads = [];
  for (let i = 0; i < numTreads; i++) {
    const t = i * actualStep;
    let x = 0;
    let z = 0;
    let angle = 0;

    if (t < straightLen) {
      // Top straight (moving back to front)
      x = -frontRearSpacingX + t;
      z = R;
      angle = 0;
    } else if (t < straightLen + curveLen) {
      // Front curve (top to bottom)
      const ct = t - straightLen;
      const theta = Math.PI / 2 - (ct / curveLen) * Math.PI; // from PI/2 down to -PI/2
      x = frontRearSpacingX + R * Math.cos(theta);
      z = R * Math.sin(theta);
      angle = -(Math.PI / 2 - theta);
    } else if (t < 2 * straightLen + curveLen) {
      // Bottom straight (moving front to back)
      const ct = t - (straightLen + curveLen);
      x = frontRearSpacingX - ct;
      z = -R;
      angle = Math.PI;
    } else {
      // Rear curve (bottom to top)
      const ct = t - (2 * straightLen + curveLen);
      const theta = -Math.PI / 2 - (ct / curveLen) * Math.PI; // from -PI/2 down to -3PI/2 (or PI/2)
      x = -frontRearSpacingX + R * Math.cos(theta);
      z = R * Math.sin(theta);
      angle = -(Math.PI / 2 - theta);
    }

    // Offset the link center outward by half its thickness so it sits ON the transmission, not IN it
    const offsetX = Math.sin(-angle) * (treadThicknessZ / 2);
    const offsetZ = Math.cos(-angle) * (treadThicknessZ / 2);

    treads.push(
      <mesh key={`tread-${i}`} position={[x + offsetX, 0, z + offsetZ]} rotation={[0, angle, 0]} castShadow receiveShadow>
        <boxGeometry args={[treadLengthX, treadWidthY, treadThicknessZ]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
    );
  }
  
  return (
    <group>
      {/* 3 Transmission Units */}
      {transmissions.map((t) => (
        <TransmissionUnit key={t.id} position={[t.x, 0, 0]} />
      ))}

      {/* Individual Tread Links following the envelope */}
      <group>
        {treads}
      </group>
    </group>
  );
}
