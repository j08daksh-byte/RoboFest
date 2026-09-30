import React from 'react';
import * as THREE from 'three';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';
import { PulleySystem, CatenaryCable } from './SafetyCables';

// Start base for the supply system Y and Z
export const SUPPLY_BASE_Y = 18.0;
export const SUPPLY_BASE_Z = 0.5;

export function SupplySystem() {
  const { position } = useRobotStore();
  const { trackHeightZ, bodyHeightZ, bodyLengthY } = robotConfig;

  const carriageX = position.x;
  const rz = position.z;
  const chassisTopZ = rz + trackHeightZ / 2 + bodyHeightZ;
  
  // Robot attachment point for 5th cable
  const rCenter = new THREE.Vector3(position.x, position.y + bodyLengthY / 2 - 0.1, chassisTopZ); 
  
  // The pulley is mounted on the moving carriage
  const winchAnchor = new THREE.Vector3(carriageX, SUPPLY_BASE_Y, SUPPLY_BASE_Z); 

  return (
    <group>
      {/* STATIC TOP RAIL / GUIDE */}
      <mesh position={[0, SUPPLY_BASE_Y + 0.3, SUPPLY_BASE_Z + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[30, 0.15, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Guide rail teeth/slots (visual abstraction) */}
      <mesh position={[0, SUPPLY_BASE_Y + 0.2, SUPPLY_BASE_Z + 0.15]} castShadow receiveShadow>
        <boxGeometry args={[30, 0.05, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* MOVING CARRIAGE ASSEMBLY (For the 5th cable and hose routing) */}
      <group position={[carriageX, SUPPLY_BASE_Y, SUPPLY_BASE_Z]}>
        {/* Trolley / Roller Assembly holding onto the rail */}
        <mesh position={[0, 0.3, 0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.2, 0.25]} />
          <meshStandardMaterial color="#ff6600" metalness={0.6} roughness={0.5} />
        </mesh>
        
        {/* Hose guide on trolley */}
        <mesh position={[0, 0.1, 0.3]} castShadow>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial color="#555" />
        </mesh>

        {/* 5th Cable Pulley on the carriage */}
        <PulleySystem position={new THREE.Vector3(0, 0, -0.1)} />
      </group>

      {/* GROUNDED GAS CYLINDERS */}
      <group position={[-10, -29, 10]}>
        {/* Base pallet/stand */}
        <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.1, 0.8]} />
          <meshStandardMaterial color="#2d333b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Oxygen Cylinder (Green) */}
        <group position={[-0.4, 0, 0]}>
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
          <mesh position={[0.05, 1.1, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.06]} />
            <meshStandardMaterial color="#b5a642" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Acetylene Cylinder (Red) */}
        <group position={[0.4, -0.1, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 32]} />
            <meshStandardMaterial color="#880000" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#880000" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08]} />
            <meshStandardMaterial color="#b5a642" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.05, 0.95, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.06]} />
            <meshStandardMaterial color="#b5a642" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* 5th Positioning Cable */}
      {/* Connecting from the moving winch down to the moving robot */}
      <CatenaryCable 
        start={new THREE.Vector3(winchAnchor.x, winchAnchor.y - 0.28, winchAnchor.z + 0.12)} 
        end={rCenter} 
        sag={0.05} 
        color="#444" 
        thickness={0.012} 
      />
      
      <mesh position={rCenter} castShadow>
        <boxGeometry args={[0.08, 0.1, 0.06]} />
        <meshStandardMaterial color="#ff6600" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}
