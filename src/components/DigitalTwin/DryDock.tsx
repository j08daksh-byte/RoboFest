import React from 'react';
import * as THREE from 'three';

export function DryDock() {
  const dockLength = 250;
  const dockWidth = 60;
  const dockDepth = 20; // 5m below Z=0, 15m above

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: '#6c7a89',
    roughness: 0.9,
    metalness: 0.1,
  });

  const hazardMaterial = new THREE.MeshStandardMaterial({
    color: '#f1c40f',
    roughness: 0.8,
  });

  return (
    <group position={[0, 0, -dockDepth / 2 + 5]}>
      {/* Dock Floor */}
      <mesh position={[0, 0, -dockDepth/2]} receiveShadow>
        <boxGeometry args={[dockWidth, dockLength, 1]} />
        <meshStandardMaterial color="#555555" roughness={1.0} />
      </mesh>

      {/* Port Wall */}
      <mesh position={[-dockWidth/2 - 2, 0, 0]} receiveShadow>
        <boxGeometry args={[4, dockLength, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>
      
      {/* Starboard Wall */}
      <mesh position={[dockWidth/2 + 2, 0, 0]} receiveShadow>
        <boxGeometry args={[4, dockLength, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>

      {/* Bow Wall (Front) */}
      <mesh position={[0, dockLength/2 + 2, 0]} receiveShadow>
        <boxGeometry args={[dockWidth + 8, 4, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>

      {/* Stern Gate (Back) */}
      <mesh position={[0, -dockLength/2 - 2, 0]} receiveShadow>
        <boxGeometry args={[dockWidth + 8, 4, dockDepth]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.7} metalness={0.6} />
      </mesh>

      {/* Crane Rails (Yellow) */}
      <mesh position={[-dockWidth/2 - 1, 0, dockDepth/2 + 0.1]} receiveShadow>
        <boxGeometry args={[1, dockLength, 0.2]} />
        <primitive object={hazardMaterial} />
      </mesh>
      <mesh position={[dockWidth/2 + 1, 0, dockDepth/2 + 0.1]} receiveShadow>
        <boxGeometry args={[1, dockLength, 0.2]} />
        <primitive object={hazardMaterial} />
      </mesh>

      {/* Simplified Gantry Crane */}
      <group position={[0, -20, dockDepth/2 + 10]}>
        {/* Crane Legs */}
        <mesh position={[-dockWidth/2 - 1, 0, -5]} castShadow receiveShadow>
          <boxGeometry args={[2, 4, 10]} />
          <meshStandardMaterial color="#e67e22" roughness={0.7} />
        </mesh>
        <mesh position={[dockWidth/2 + 1, 0, -5]} castShadow receiveShadow>
          <boxGeometry args={[2, 4, 10]} />
          <meshStandardMaterial color="#e67e22" roughness={0.7} />
        </mesh>
        {/* Crane Crossbeam */}
        <mesh position={[0, 0, 1]} castShadow receiveShadow>
          <boxGeometry args={[dockWidth + 6, 3, 2]} />
          <meshStandardMaterial color="#e67e22" roughness={0.7} />
        </mesh>
        {/* Hoist Trolley */}
        <mesh position={[10, 0, -0.5]} castShadow receiveShadow>
          <boxGeometry args={[3, 4, 2]} />
          <meshStandardMaterial color="#34495e" roughness={0.8} />
        </mesh>
        {/* Hoist Cable */}
        <mesh position={[10, 0, -6]}>
          <cylinderGeometry args={[0.05, 0.05, 10]} />
          <meshStandardMaterial color="#bdc3c7" />
        </mesh>
        {/* Hook/Block */}
        <mesh position={[10, 0, -11]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f1c40f" />
        </mesh>
      </group>
    </group>
  );
}
