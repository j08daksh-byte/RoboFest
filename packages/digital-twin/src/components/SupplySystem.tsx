// @ts-nocheck
import React from 'react';
import * as THREE from 'three';
import { useTwinState } from '../TwinProvider';
import { robotConfig } from '../lib/robotConfig';
import { getRobotWorldPosition } from './SafetyCables';

export function SupplySystem() {
  const { position } = useTwinState();
  const worldPos = getRobotWorldPosition(position);

  // Gas cylinders beside the mast
  const mastX = 95; // Match SafetyCables mast
  const mastZBase = -2;
  const rackX = mastX + 1.2;
  const rackY = worldPos.y - 1.5;
  const rackZ = mastZBase;

  // Removed 5th cable coordinates

  // 5th cable mechanism removed

  return (
    <group>
      {/* 5th Cable Mechanism Removed As Requested */}

      {/* ============================================================ */}
      {/* GROUND GAS CYLINDER SYSTEM */}
      {/* ============================================================ */}
      <group position={[rackX, rackY, rackZ]}>
        {/* Heavy industrial rack/base on the ground */}
        <mesh position={[0, 0, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.8, 0.2]} />
          <meshStandardMaterial color="#2d333b" metalness={0.8} roughness={0.3} />
        </mesh>
        
        {/* Support cage framework */}
        <mesh position={[0, -0.3, 0.8]} castShadow>
          <boxGeometry args={[1.2, 0.05, 1.6]} />
          <meshStandardMaterial color="#555" metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.3, 0.8]} castShadow>
          <boxGeometry args={[1.2, 0.05, 1.6]} />
          <meshStandardMaterial color="#555" metalness={0.6} />
        </mesh>

        {/* Oxygen Cylinder (Green) */}
        <group position={[-0.3, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 1.8, 32]} />
            <meshStandardMaterial color="#005500" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#005500" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08]} />
            <meshStandardMaterial color="#b5a642" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Acetylene Cylinder (Red) */}
        <group position={[0.3, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 32]} />
            <meshStandardMaterial color="#b30000" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#b30000" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08]} />
            <meshStandardMaterial color="#b5a642" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

