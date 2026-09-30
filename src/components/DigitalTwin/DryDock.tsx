import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { shipConfig } from '@/lib/geometry/shipConfig';

// -------------------------------------------------------------------------------------------------
// MATERIALS & TEXTURES
// -------------------------------------------------------------------------------------------------

function createConcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  
  // Base concrete
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Noise and variation
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.03)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Expansion joints
  ctx.fillStyle = '#2c3e50';
  for (let i = 0; i < 1024; i += 128) {
    ctx.fillRect(i, 0, 4, 1024);
    ctx.fillRect(0, i, 1024, 4);
  }

  // Grime / Water stains
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 1024, Math.random() * 1024, 50 + Math.random() * 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 20); // Repeat across dock
  return texture;
}

const concreteMaterial = new THREE.MeshStandardMaterial({
  color: '#8b9396',
  roughness: 0.95,
  metalness: 0.1,
});

const darkConcreteMaterial = new THREE.MeshStandardMaterial({
  color: '#555b5e',
  roughness: 1.0,
});

const steelMaterial = new THREE.MeshStandardMaterial({
  color: '#4a5568',
  roughness: 0.8,
  metalness: 0.6,
});

const safetyMaterial = new THREE.MeshStandardMaterial({
  color: '#d35400', // Industrial orange/yellow
  roughness: 0.7,
  metalness: 0.2,
});

const equipmentBlue = new THREE.MeshStandardMaterial({
  color: '#2980b9',
  roughness: 0.6,
  metalness: 0.4,
});

// -------------------------------------------------------------------------------------------------
// COMPONENTS
// -------------------------------------------------------------------------------------------------

function KeelBlocks() {
  const L = shipConfig.lengthOverall;
  const blockCount = Math.floor(L / 2); // Block every 2 meters
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      for (let y = -L/2 + 5; y <= L/2 - 5; y += 2) {
        dummy.position.set(0, y, -1); // Centered under keel, Z=-1 (middle of 2m high block)
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [L]);

  return (
    <group>
      {/* Central Keel Blocks: 2m wide, 1m deep, 2m high */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, blockCount]} castShadow receiveShadow material={darkConcreteMaterial}>
        <boxGeometry args={[2, 1, 2]} />
      </instancedMesh>
    </group>
  );
}

function Scaffolding() {
  // Modular scaffolding running along the starboard side of the hull
  const L = shipConfig.lengthOverall;
  const sections = Math.floor(L / 4) - 4; // 4m sections
  const levels = 4;
  const scaffoldRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (scaffoldRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      
      const startY = -L/2 + 10;
      
      // Vertical Poles
      for (let s = 0; s < sections; s++) {
        const y = startY + s * 4;
        for (let l = 0; l < levels; l++) {
          const z = -2 + l * 3 + 1.5; // Starts at dock floor (Z=-2), each level is 3m
          
          // Inner pole
          dummy.position.set(11, y, z);
          dummy.scale.set(0.1, 0.1, 3);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Outer pole
          dummy.position.set(13, y, z);
          dummy.scale.set(0.1, 0.1, 3);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Horizontal brace
          dummy.position.set(12, y, z);
          dummy.scale.set(2, 0.1, 0.1);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Longitudinal brace
          if (s < sections - 1) {
            dummy.position.set(13, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
            
            dummy.position.set(11, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      scaffoldRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [L, sections]);

  return (
    <group>
      {/* Scaffolding structure */}
      <instancedMesh ref={scaffoldRef} args={[undefined, undefined, sections * levels * 5]} castShadow receiveShadow material={steelMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      
      {/* Working platforms (wooden planks) */}
      <mesh position={[12, 0, -2 + 3]} castShadow receiveShadow>
        <boxGeometry args={[2, sections * 4, 0.1]} />
        <meshStandardMaterial color="#8e6a45" roughness={0.9} />
      </mesh>
      <mesh position={[12, 0, -2 + 6]} castShadow receiveShadow>
        <boxGeometry args={[2, sections * 4, 0.1]} />
        <meshStandardMaterial color="#8e6a45" roughness={0.9} />
      </mesh>
      <mesh position={[12, 0, -2 + 9]} castShadow receiveShadow>
        <boxGeometry args={[2, sections * 4, 0.1]} />
        <meshStandardMaterial color="#8e6a45" roughness={0.9} />
      </mesh>
    </group>
  );
}

function IndustrialEquipment() {
  // Gas cylinders (Instanced)
  const cylinderRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (cylinderRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      // Rack 1
      for (let x=0; x<4; x++) {
        for (let y=0; y<2; y++) {
          dummy.position.set(20 + x*0.4, 10 + y*0.4, -1.5);
          dummy.updateMatrix();
          cylinderRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      // Rack 2
      for (let x=0; x<4; x++) {
        for (let y=0; y<2; y++) {
          dummy.position.set(20 + x*0.4, -20 + y*0.4, -1.5);
          dummy.updateMatrix();
          cylinderRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      cylinderRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={cylinderRef} args={[undefined, undefined, 16]} castShadow receiveShadow material={safetyMaterial}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
      </instancedMesh>
      
      {/* Welding Generator 1 */}
      <mesh position={[18, 12, -1.5]} castShadow receiveShadow material={equipmentBlue}>
        <boxGeometry args={[1.5, 2, 1.2]} />
      </mesh>
      
      {/* Welding Generator 2 */}
      <mesh position={[18, -18, -1.5]} castShadow receiveShadow material={equipmentBlue}>
        <boxGeometry args={[1.5, 2, 1.2]} />
      </mesh>
      
      {/* Mobile Work Lift (Cherry Picker) */}
      <group position={[-15, 30, -2]}>
        {/* Base */}
        <mesh position={[0, 0, 0.5]} castShadow receiveShadow material={safetyMaterial}>
          <boxGeometry args={[3, 4, 1]} />
        </mesh>
        {/* Wheels */}
        <mesh position={[-1.6, 1.5, 0.4]} rotation={[0, Math.PI/2, 0]} castShadow material={darkConcreteMaterial}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
        <mesh position={[1.6, 1.5, 0.4]} rotation={[0, Math.PI/2, 0]} castShadow material={darkConcreteMaterial}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
        <mesh position={[-1.6, -1.5, 0.4]} rotation={[0, Math.PI/2, 0]} castShadow material={darkConcreteMaterial}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
        <mesh position={[1.6, -1.5, 0.4]} rotation={[0, Math.PI/2, 0]} castShadow material={darkConcreteMaterial}>
          <cylinderGeometry args={[0.4, 0.4, 0.4]} />
        </mesh>
        {/* Arm segment 1 */}
        <mesh position={[0, 0, 1.5]} rotation={[-Math.PI/4, 0, 0]} castShadow receiveShadow material={steelMaterial}>
          <boxGeometry args={[0.8, 8, 0.8]} />
        </mesh>
        {/* Platform */}
        <mesh position={[0, -5.5, 7]} castShadow receiveShadow material={safetyMaterial}>
          <boxGeometry args={[2, 1.5, 1]} />
        </mesh>
      </group>
    </group>
  );
}

function DockyardCrane() {
  const craneGroupRef = useRef<THREE.Group>(null);
  
  return (
    <group position={[-25, -20, -2]} ref={craneGroupRef}>
      {/* Rail base */}
      <mesh position={[0, 0, 1]} castShadow receiveShadow material={steelMaterial}>
        <boxGeometry args={[8, 8, 2]} />
      </mesh>
      
      {/* Main Tower */}
      <mesh position={[0, 0, 16]} castShadow receiveShadow material={safetyMaterial}>
        <boxGeometry args={[4, 4, 30]} />
      </mesh>
      
      {/* Operator Cabin */}
      <mesh position={[3, 0, 25]} castShadow receiveShadow material={equipmentBlue}>
        <boxGeometry args={[3, 3, 3]} />
      </mesh>
      
      {/* Horizontal Boom */}
      <mesh position={[25, 0, 31]} castShadow receiveShadow material={safetyMaterial}>
        <boxGeometry args={[60, 2.5, 2.5]} />
      </mesh>
      
      {/* Counterweight boom */}
      <mesh position={[-10, 0, 31]} castShadow receiveShadow material={safetyMaterial}>
        <boxGeometry args={[20, 2.5, 2.5]} />
      </mesh>
      
      {/* Cables / Ties (Simplified with thin cylinders) */}
      <mesh position={[10, 0, 35]} rotation={[0, Math.PI/2 - 0.2, 0]} castShadow material={steelMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 25]} />
      </mesh>
      <mesh position={[-5, 0, 34]} rotation={[0, -Math.PI/2 + 0.3, 0]} castShadow material={steelMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 12]} />
      </mesh>
      
      {/* Tower top point */}
      <mesh position={[0, 0, 35]} castShadow receiveShadow material={safetyMaterial}>
        <boxGeometry args={[2, 2, 6]} />
      </mesh>
      
      {/* Hoist cable dropping down */}
      <mesh position={[35, 0, 15]} castShadow material={steelMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 30]} />
      </mesh>
      
      {/* Hook block */}
      <mesh position={[35, 0, 0]} castShadow material={equipmentBlue}>
        <boxGeometry args={[1, 1.5, 1.5]} />
      </mesh>
    </group>
  );
}

export function DryDock() {
  const dockLength = 260;
  const dockWidth = 70;
  const dockDepth = 18; // Z=-2 to Z=16
  
  const concreteTex = useMemo(() => createConcreteTexture(), []);

  return (
    <group>
      {/* Dock Floor (Z = -2) */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[dockWidth, dockLength]} />
        <meshStandardMaterial map={concreteTex} roughness={0.9} />
      </mesh>

      {/* Keel Blocks to support ship (Z=-2 to Z=0) */}
      <KeelBlocks />

      {/* Port Wall */}
      <mesh position={[-dockWidth/2, 0, dockDepth/2 - 2]} receiveShadow>
        <boxGeometry args={[2, dockLength, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>
      
      {/* Starboard Wall */}
      <mesh position={[dockWidth/2, 0, dockDepth/2 - 2]} receiveShadow>
        <boxGeometry args={[2, dockLength, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>
      
      {/* Bow Gate (Front) */}
      <mesh position={[0, dockLength/2, dockDepth/2 - 2]} receiveShadow>
        <boxGeometry args={[dockWidth + 2, 2, dockDepth]} />
        <primitive object={concreteMaterial} />
      </mesh>

      {/* Stern Gate (Back) */}
      <mesh position={[0, -dockLength/2, dockDepth/2 - 2]} receiveShadow>
        <boxGeometry args={[dockWidth + 2, 2, dockDepth]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.7} metalness={0.6} />
      </mesh>

      {/* Top safety railing on dock walls */}
      <mesh position={[-dockWidth/2 + 0.8, 0, dockDepth - 2 + 0.5]} receiveShadow>
        <boxGeometry args={[0.1, dockLength, 1]} />
        <primitive object={safetyMaterial} />
      </mesh>
      <mesh position={[dockWidth/2 - 0.8, 0, dockDepth - 2 + 0.5]} receiveShadow>
        <boxGeometry args={[0.1, dockLength, 1]} />
        <primitive object={safetyMaterial} />
      </mesh>
      
      {/* Wall Pilasters (Vertical ribs for detail) */}
      {Array.from({length: 20}).map((_, i) => {
        const y = -dockLength/2 + 10 + i * 12;
        return (
          <React.Fragment key={i}>
            <mesh position={[-dockWidth/2 + 1.2, y, dockDepth/2 - 2]} receiveShadow castShadow>
              <boxGeometry args={[0.5, 1, dockDepth]} />
              <primitive object={concreteMaterial} />
            </mesh>
            <mesh position={[dockWidth/2 - 1.2, y, dockDepth/2 - 2]} receiveShadow castShadow>
              <boxGeometry args={[0.5, 1, dockDepth]} />
              <primitive object={concreteMaterial} />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* Scaffolding on Starboard side */}
      <Scaffolding />

      {/* Industrial Equipment & Platforms on floor */}
      <IndustrialEquipment />
      
      {/* Heavy Shipyard Crane */}
      <DockyardCrane />

    </group>
  );
}
