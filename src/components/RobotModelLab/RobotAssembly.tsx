'use client';
import React from 'react';
import { labRobotConfig } from './config';

export function RobotAssembly() {
  const {
    chassisLengthX, chassisWidthY, chassisHeightZ, chassisZOffset,
    trackLengthX, trackWidthY, trackHeightZ, trackSpacingY,
    structureLengthX, structureWidthY, structureHeightZ
  } = labRobotConfig;

  return (
    <group>
      {/* 
        NEW Detailed Robot Architecture Stub 
        Uses X = Longitudinal, Y = Lateral, Z = Vertical
      */}

      {/* Chassis placeholder */}
      <mesh position={[0, 0, chassisZOffset + chassisHeightZ / 2]} castShadow receiveShadow>
        <boxGeometry args={[chassisLengthX, chassisWidthY, chassisHeightZ]} />
        <meshStandardMaterial color="#3a4048" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Left Track Assembly placeholder */}
      <mesh position={[0, trackSpacingY / 2, trackHeightZ / 2]} castShadow receiveShadow>
        <boxGeometry args={[trackLengthX, trackWidthY, trackHeightZ]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>

      {/* Right Track Assembly placeholder */}
      <mesh position={[0, -trackSpacingY / 2, trackHeightZ / 2]} castShadow receiveShadow>
        <boxGeometry args={[trackLengthX, trackWidthY, trackHeightZ]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>

      {/* Upper Deck placeholder */}
      <mesh position={[0, 0, chassisZOffset + chassisHeightZ + structureHeightZ / 2]} castShadow receiveShadow>
        <boxGeometry args={[structureLengthX, structureWidthY, 0.04]} />
        <meshStandardMaterial color="#4a5056" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Arm & Torch placeholders would go here */}

    </group>
  );
}
