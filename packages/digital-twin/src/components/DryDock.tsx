// @ts-nocheck
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, useTexture } from '@react-three/drei';
import { shipConfig } from '../lib/geometry/shipConfig';
import { useAssetBaseUrl } from '../TwinProvider';

// -------------------------------------------------------------------------------------------------
// ASSETS & MATERIALS
// -------------------------------------------------------------------------------------------------

function GLTFModel({ path, position, rotation, scale }: { path: string; position: number[]; rotation: number[]; scale: number }) {
  const assetBaseUrl = useAssetBaseUrl();
  const { scene } = useGLTF(`${assetBaseUrl}${path}`) as { scene: THREE.Group };
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
  // Load only concrete for a clean, cohesive industrial environment
  const assetBaseUrl = useAssetBaseUrl();
  const dirtDiff = useTexture(`${assetBaseUrl}/textures/dirty_concrete/dirty_concrete_diff_2k.jpg`);
  const dirtRough = useTexture(`${assetBaseUrl}/textures/dirty_concrete/dirty_concrete_rough_2k.jpg`);
  const dirtNor = useTexture(`${assetBaseUrl}/textures/dirty_concrete/dirty_concrete_nor_gl_2k.jpg`);

  const textures = useMemo(() => {
    const dDiff = dirtDiff ? dirtDiff.clone() : null;
    const dRough = dirtRough ? dirtRough.clone() : null;
    const dNor = dirtNor ? dirtNor.clone() : null;

    [dDiff, dRough, dNor].forEach(t => {
      if(t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(100, 100);
        t.needsUpdate = true;
      }
    });

    return { dDiff, dRough, dNor };
  }, [dirtDiff, dirtRough, dirtNor]);

  return (
    <group>
      {/* Expansive Concrete Dry Dock / Working Area */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
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
  const blockCount = Math.floor(L / 4) + 12; // Block every 4 meters
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#444b4d',
    roughness: 0.95,
  }), []);

  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      
      // Central Keel line - spaced out for cleaner look
      for (let y = -L/2 + 5; y <= L/2 - 5; y += 4) {
        dummy.position.set(0, y, -1); // Centered under keel, Z=-1 (middle of 2m high block)
        dummy.scale.set(1.5, 1, 2);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }

      // Bilge support blocks - sparse and functional
      for (let y = -L/2 + 25; y <= L/2 - 25; y += 30) {
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

  const sections = 6; // Reduced from 12 to provide clean access
  const levels = 3;   // Reduced from 4
  const poleCount = sections * levels * 5;
  const scaffoldRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (scaffoldRef.current) {
      const dummy = new THREE.Object3D();
      let idx = 0;
      const startY = 5; // Midship area, starboard side
      
      for (let s = 0; s < sections; s++) {
        const y = startY + s * 4;
        for (let l = 0; l < levels; l++) {
          const z = -2 + l * 2.5 + 1.25;
          
          // Inner pole
          dummy.position.set(76.5, y, z);
          dummy.scale.set(0.1, 0.1, 2.5);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Outer pole
          dummy.position.set(80.5, y, z);
          dummy.scale.set(0.1, 0.1, 2.5);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Horizontal brace
          dummy.position.set(78.5, y, z);
          dummy.scale.set(4, 0.1, 0.1);
          dummy.updateMatrix();
          scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          
          // Longitudinal braces
          if (s < sections - 1) {
            dummy.position.set(80.5, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
            
            dummy.position.set(76.5, y + 2, z);
            dummy.scale.set(0.1, 4, 0.1);
            dummy.updateMatrix();
            scaffoldRef.current.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      scaffoldRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [sections, levels]);

  return (
    <group>
      <instancedMesh ref={scaffoldRef} args={[undefined, undefined, poleCount]} castShadow receiveShadow material={steelMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      
      {/* Wooden working platforms */}
      {[0, 1, 2].map(l => (
        <mesh key={l} position={[78.5, 5 + (sections * 4) / 2 - 2, -2 + l * 2.5 + 2.5]} castShadow receiveShadow material={woodMaterial}>
          <boxGeometry args={[3.8, sections * 4, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function RealWorldAssets() {
  // Giant mechanical hoist crane is removed completely.
  return (
    <group>
      {/* Tool Cabinets */}
      <GLTFModel path="/models/metal_tool_chest/metal_tool_chest.gltf" position={[82, 5, -2]} rotation={[Math.PI/2, 0, 0]} scale={1.5} />
      <GLTFModel path="/models/metal_tool_chest/metal_tool_chest.gltf" position={[83, -10, -2]} rotation={[Math.PI/2, 0, Math.PI/2]} scale={1.5} />
      
      {/* Storage Racks */}
      <GLTFModel path="/models/worn_metal_rack/worn_metal_rack.gltf" position={[85, 20, -2]} rotation={[Math.PI/2, 0, 0]} scale={1.2} />
      <GLTFModel path="/models/worn_metal_rack/worn_metal_rack.gltf" position={[-18, 0, -2]} rotation={[Math.PI/2, 0, Math.PI]} scale={1.2} />

      {/* Storage Carts */}
      <GLTFModel path="/models/industrial_storage_cart/industrial_storage_cart.gltf" position={[80, -25, -2]} rotation={[Math.PI/2, 0, 0.4]} scale={1.5} />
      <GLTFModel path="/models/industrial_storage_cart/industrial_storage_cart.gltf" position={[-14, 15, -2]} rotation={[Math.PI/2, 0, -0.2]} scale={1.5} />

      {/* Jerrycans */}
      <GLTFModel path="/models/metal_jerrycan/metal_jerrycan.gltf" position={[81, 6, -2]} rotation={[Math.PI/2, 0, 0.1]} scale={1.5} />
      <GLTFModel path="/models/metal_jerrycan/metal_jerrycan.gltf" position={[81.5, 6.2, -2]} rotation={[Math.PI/2, 0, -0.3]} scale={1.5} />
    </group>
  );
}

export function DryDock() {
  return (
    <group>
      {/* Clean photorealistic ground */}
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

// Preload the remaining small assets





