import React from 'react';
import * as THREE from 'three';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';
import { CatenaryCable, getRobotWorldPosition, PulleySystem } from './SafetyCables';

export function SupplySystem() {
  const { position } = useRobotStore();
  const worldPos = getRobotWorldPosition(position);

  // Gas cylinders beside the mast
  const mastX = 95; // Match SafetyCables mast
  const mastZBase = -2;
  const rackX = mastX + 1.2;
  const rackY = worldPos.y - 1.5;
  const rackZ = mastZBase;

  // The 5th Pulley/Cable Mechanism at the top of the ship
  const deckX = 50.0;
  const deckZ = 75.0; // deck edge
  const carriageY = worldPos.y;

  // Winch anchor point for 5th cable
  const winchAnchor = new THREE.Vector3(deckX - 0.2, carriageY, deckZ - 0.1); 

  // Robot attachment point for 5th cable
  const rCenterLocal = { 
    x: position.x - robotConfig.bodyLengthY / 2 + 0.1, 
    y: position.y, 
    z: position.z + robotConfig.trackHeightZ / 2 + robotConfig.bodyHeightZ 
  };
  const rCenterWorld = getRobotWorldPosition(rCenterLocal);

  return (
    <group>
      {/* ============================================================ */}
      {/* 5TH CABLE MECHANISM (TOP OF SHIP) */}
      {/* ============================================================ */}
      {/* STATIC TOP RAIL / GUIDE along the deck edge */}
      <mesh position={[deckX, 0, deckZ]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 160, 0.15]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Guide rail teeth/slots */}
      <mesh position={[deckX + 0.05, 0, deckZ + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 160, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* MOVING CARRIAGE ASSEMBLY */}
      <group position={[deckX, carriageY, deckZ]}>
        {/* Trolley / Roller Assembly */}
        <mesh position={[0, 0, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.6, 0.25]} />
          <meshStandardMaterial color="#ff6600" metalness={0.6} roughness={0.5} />
        </mesh>
        
        {/* Pulley hanging off the deck edge */}
        <group position={[-0.2, 0, -0.1]} rotation={[Math.PI/2, Math.PI/2, 0]}>
           <PulleySystem position={new THREE.Vector3(0, 0, 0)} />
        </group>
      </group>

      {/* 5th Cable (The heavy winch/umbilical dropping from the top carriage) */}
      <CatenaryCable start={winchAnchor} end={rCenterWorld} sag={0.05} color="#111" thickness={0.015} />

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
