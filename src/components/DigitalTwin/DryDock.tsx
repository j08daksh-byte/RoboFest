import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, useTexture } from '@react-three/drei';
import { shipConfig } from '@/lib/geometry/shipConfig';

// -------------------------------------------------------------------------------------------------
// ASSETS & MATERIALS
// -------------------------------------------------------------------------------------------------

function GLTFModel({ path, position, rotation, scale }: { path: string; position: number[]; rotation: number[]; scale: number }) {
  const { scene } = useGLTF(path) as { scene: THREE.Group };
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((node: THREE.Object3D) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

function GroundPlanes() {
  // Load textures
  const dirtDiff = useTexture('/textures/dirty_concrete/dirty_concrete_diff_2k.jpg');
  const dirtRough = useTexture('/textures/dirty_concrete/dirty_concrete_rough_2k.jpg');
  const dirtNor = useTexture('/textures/dirty_concrete/dirty_concrete_nor_gl_2k.jpg');

  const sandDiff = useTexture('/textures/coast_sand_01/coast_sand_01_diff_2k.jpg');
  const sandRough = useTexture('/textures/coast_sand_01/coast_sand_01_rough_2k.jpg');
  const sandNor = useTexture('/textures/coast_sand_01/coast_sand_01_nor_gl_2k.jpg');

  const textures = useMemo(() => {
    const dDiff = dirtDiff ? dirtDiff.clone() : null;
    const dRough = dirtRough ? dirtRough.clone() : null;
    const dNor = dirtNor ? dirtNor.clone() : null;
    const sDiff = sandDiff ? sandDiff.clone() : null;
    const sRough = sandRough ? sandRough.clone() : null;
    const sNor = sandNor ? sandNor.clone() : null;

    [dDiff, dRough, dNor].forEach(t => {
      if(t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(30, 30);
        t.needsUpdate = true;
      }
    });

    [sDiff, sRough, sNor].forEach(t => {
      if(t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(50, 50);
        t.needsUpdate = true;
      }
    });

    return { dDiff, dRough, dNor, sDiff, sRough, sNor };
  }, [dirtDiff, dirtRough, dirtNor, sandDiff, sandRough, sandNor]);

  return (
    <group>
      {/* Huge Outer Sand/Dirt Yard */}
      <mesh position={[0, 0, -2.1]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial 
          map={textures.sDiff} 
          roughnessMap={textures.sRough} 
          normalMap={textures.sNor}
          roughness={1}
        />
      </mesh>

      {/* Concrete Dry Dock / Working Area */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[100, 300]} />
        <meshStandardMaterial 
          map={textures.dDiff} 
          roughnessMap={textures.dRough} 
          normalMap={textures.dNor}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------------------------------------------
// COMPONENTS
// -------------------------------------------------------------------------------------------------

function KeelBlocks() {
  const L = shipConfig.lengthOverall;
  const blockCount = Math.floor(L / 2) + 20; // Block every 2 meters, some extra for side blocks
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#444b4d',
    roughness: 0.95,
  }), []);

  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      
      // Central Keel line
      for (let y = -L/2 + 5; y <= L/2 - 5; y += 2) {
        dummy.position.set(0, y, -1); // Centered under keel, Z=-1 (middle of 2m high block)
        dummy.scale.set(1.5, 1, 2);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }

      // Bilge support blocks
      for (let y = -L/2 + 20; y <= L/2 - 20; y += 10) {
        // Port
        dummy.position.set(-6, y, -0.5);
        dummy.scale.set(1.5, 1.5, 3);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
        // Stbd
        dummy.position.set(6, y, -0.5);
        dummy.scale.set(1.5, 1.5, 3);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [L]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, blockCount]} castShadow receiveShadow material={concreteMat}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

function IndustrialScaffolding() {
  const steelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#34495e',
    roughness: 0.8,
    metalness: 0.6,
  }), []);

  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8e6a45',
    roughness: 0.9,
  }), []);

  const sections = 12; // 4m sections
  const levels = 4;
  const poleCount = sections * levels * 5;
  const scaffoldRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (scaffoldRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      const startY = 10; // Midship area, starboard side
      
      for (let s = 0; s < sections; s++) {
        const y = startY + s * 4;
        for (let l = 0; l < levels; l++) {
          const z = -2 + l * 2.5 + 1.25;
          
          // Inner pole
          dummy.position.set(10.5, y, z);
          dummy.scale.set(0.1, 0.1, 2.5);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Outer pole
          dummy.position.set(12.5, y, z);
          dummy.scale.set(0.1, 0.1, 2.5);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Horizontal brace
          dummy.position.set(11.5, y, z);
          dummy.scale.set(2, 0.1, 0.1);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Longitudinal braces
          if (s < sections - 1) {
            dummy.position.set(12.5, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
            
            dummy.position.set(10.5, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      scaffoldRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [sections]);

  return (
    <group>
      <instancedMesh ref={scaffoldRef} args={[undefined, undefined, poleCount]} castShadow receiveShadow material={steelMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      
      {/* Wooden working platforms */}
      {[0, 1, 2, 3].map(l => (
        <mesh key={l} position={[11.5, 10 + (sections * 4) / 2 - 2, -2 + l * 2.5 + 2.5]} castShadow receiveShadow material={woodMaterial}>
          <boxGeometry args={[1.8, sections * 4, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function RealWorldAssets() {
  return (
    <group>
      {/* Shipyard Crane - Starboard Aft */}
      <GLTFModel path="/models/overhead_crane/overhead_crane.gltf" position={[20, -40, -2]} rotation={[Math.PI/2, 0, Math.PI/4]} scale={5} />
      
      {/* Shipyard Crane - Port Forward */}
      <GLTFModel path="/models/overhead_crane/overhead_crane.gltf" position={[-25, 30, -2]} rotation={[Math.PI/2, 0, -Math.PI/4]} scale={5} />

      {/* Tool Cabinets */}
      <GLTFModel path="/models/metal_tool_chest/metal_tool_chest.gltf" position={[15, 5, -2]} rotation={[Math.PI/2, 0, 0]} scale={1.5} />
      <GLTFModel path="/models/metal_tool_chest/metal_tool_chest.gltf" position={[16, -10, -2]} rotation={[Math.PI/2, 0, Math.PI/2]} scale={1.5} />
      
      {/* Storage Racks */}
      <GLTFModel path="/models/worn_metal_rack/worn_metal_rack.gltf" position={[18, 20, -2]} rotation={[Math.PI/2, 0, 0]} scale={1.2} />
      <GLTFModel path="/models/worn_metal_rack/worn_metal_rack.gltf" position={[-18, 0, -2]} rotation={[Math.PI/2, 0, Math.PI]} scale={1.2} />

      {/* Storage Carts */}
      <GLTFModel path="/models/industrial_storage_cart/industrial_storage_cart.gltf" position={[12, -25, -2]} rotation={[Math.PI/2, 0, 0.4]} scale={1.5} />
      <GLTFModel path="/models/industrial_storage_cart/industrial_storage_cart.gltf" position={[-14, 15, -2]} rotation={[Math.PI/2, 0, -0.2]} scale={1.5} />

      {/* Jerrycans */}
      <GLTFModel path="/models/metal_jerrycan/metal_jerrycan.gltf" position={[14, 6, -2]} rotation={[Math.PI/2, 0, 0.1]} scale={1.5} />
      <GLTFModel path="/models/metal_jerrycan/metal_jerrycan.gltf" position={[14.5, 6.2, -2]} rotation={[Math.PI/2, 0, -0.3]} scale={1.5} />
    </group>
  );
}

export function DryDock() {
  return (
    <group>
      {/* Expansive photorealistic ground */}
      <React.Suspense fallback={null}>
        <GroundPlanes />
      </React.Suspense>

      {/* Engineered keel blocks supporting the vessel */}
      <KeelBlocks />

      {/* Modular scaffolding along the hull for safe access */}
      <IndustrialScaffolding />

      {/* High quality GLTF external assets */}
      <React.Suspense fallback={null}>
        <RealWorldAssets />
      </React.Suspense>
    </group>
  );
}

// Preload the assets
useGLTF.preload('/models/overhead_crane/overhead_crane.gltf');
useGLTF.preload('/models/metal_tool_chest/metal_tool_chest.gltf');
useGLTF.preload('/models/worn_metal_rack/worn_metal_rack.gltf');
useGLTF.preload('/models/industrial_storage_cart/industrial_storage_cart.gltf');
useGLTF.preload('/models/metal_jerrycan/metal_jerrycan.gltf');
