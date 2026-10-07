// @ts-nocheck
import React from 'react';
import * as THREE from 'three';
import { useTwinState } from '../TwinProvider';

function Crane() {
  const { xRayMode } = useTwinState();
  // A large portal crane spanning the dry dock
  return (
    <group position={[0, -30, 40]}>
      {/* Left Leg */}
      <mesh position={[-60, 40, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 80, 8]} />
        <meshStandardMaterial color="#c23b22" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Right Leg */}
      <mesh position={[60, 40, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 80, 8]} />
        <meshStandardMaterial color="#c23b22" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Main Bridge */}
      <mesh position={[0, 80, 0]} castShadow receiveShadow>
        <boxGeometry args={[124, 6, 8]} />
        <meshStandardMaterial color="#b32d18" metalness={0.6} roughness={0.5} />
      </mesh>
      
      {/* Trolley / Hoist */}
      <mesh position={[10, 83, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 10]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Cables dropping down */}
      <mesh position={[10, 41.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 75]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* Hook block */}
      <mesh position={[10, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
    </group>
  );
}

function DryDockWalls() {
  return (
    <group position={[0, -30, 0]}>
      {/* Floor is placed at y=0 in local space, which is y=-30 in world */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#555a5e" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Concrete patches / wear on the floor */}
      <mesh position={[0, 0.05, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 40]} />
        <meshStandardMaterial color="#4a4e52" roughness={1.0} metalness={0.0} />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-80, 20, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 40, 300]} />
        <meshStandardMaterial color="#7a7f85" roughness={0.95} />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[80, 20, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 40, 300]} />
        <meshStandardMaterial color="#7a7f85" roughness={0.95} />
      </mesh>
      
      {/* Back Wall (Bow side) */}
      <mesh position={[0, 20, -150]} receiveShadow castShadow>
        <boxGeometry args={[156, 40, 4]} />
        <meshStandardMaterial color="#7a7f85" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Scaffolding() {
  const { xRayMode } = useTwinState();
  const floors = 6;
  const sections = 8;
  const w = 4;
  const h = 4;
  const d = 4;
  
  const nodes = [];
  for (let f = 0; f < floors; f++) {
    for (let s = 0; s < sections; s++) {
      nodes.push(
        <group key={`scaff-${f}-${s}`} position={[s * w, f * h, 0]}>
          <mesh position={[w/2, h/2, 0]} receiveShadow castShadow={!xRayMode}>
            <cylinderGeometry args={[0.05, 0.05, h]} />
            <meshStandardMaterial color="#b3b8bc" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0, h/2, d/2]} rotation={[0, 0, Math.PI/2]} receiveShadow castShadow={!xRayMode}>
            <cylinderGeometry args={[0.05, 0.05, w]} />
            <meshStandardMaterial color="#b3b8bc" metalness={0.8} roughness={0.4} />
          </mesh>
          {/* Walkway plank */}
          {f > 0 && (
            <mesh position={[w/2, 0, d/2]} receiveShadow castShadow={!xRayMode}>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
            </mesh>
          )}
        </group>
      );
    }
  }

  return (
    <group position={[-15, -30, 25]}>
      {nodes}
    </group>
  );
}

export function ShipyardEnvironment() {
  return (
    <group>
      <DryDockWalls />
      <Crane />
      <Scaffolding />
      
      {/* Some industrial containers scattered */}
      <group position={[40, -30, 30]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 6]} />
          <meshStandardMaterial color="#1f4c73" roughness={0.7} />
        </mesh>
        <mesh position={[4, 1.5, 2]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 6]} />
          <meshStandardMaterial color="#7a2d2d" roughness={0.7} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 6]} />
          <meshStandardMaterial color="#c27a22" roughness={0.7} />
        </mesh>
      </group>
      
      {/* Extra flood lights */}
      <pointLight position={[-40, 10, 10]} intensity={1.5} distance={100} color="#ffebcc" />
      <pointLight position={[40, 10, 10]} intensity={1.5} distance={100} color="#ffebcc" />
      <pointLight position={[0, 50, 40]} intensity={1.0} distance={150} color="#e0f7fa" />
    </group>
  );
}

