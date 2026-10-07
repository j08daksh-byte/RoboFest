// @ts-nocheck
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ProceduralShipSurface } from '../lib/geometry/ProceduralShipSurface';
import { computeRobotOrientation } from '../lib/geometry/HullSurfaceQuery';
import { shipConfig } from '../lib/geometry/shipConfig';
import { useTwinState } from '../TwinProvider';
import { useShipMaterials } from '../lib/materials/useShipMaterials';
import { HullSurfaceDetails } from './HullSurfaceDetails';
import { DeckDetails, BridgeDetails } from './DeckDetails';

// ----------------------------------------------------------------------
// ENGINEERING HULL
// ----------------------------------------------------------------------
function EngineeringHull({ surface, materials }: { surface: ProceduralShipSurface, materials: ReturnType<typeof useShipMaterials> }) {
  const { testShipVisibility: { showStructuralLines, showSurfaceDebug, showSurfaceNormals, showSurfaceTangents, showRobotProxies } } = useTwinState();

  const { hullGeometry, frameLinesGeometry, sternGeometry, bowGeometry } = useMemo(() => {
    const uSegments = 120;
    const vSegments = 40;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const groups: { start: number; count: number; materialIndex: number }[] = [];

    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1;
        const pt = surface.evaluatePosition(u, v);
        vertices.push(pt.x, pt.y, pt.z);
        uvs.push(u, (v + 1) / 2);
      }
    }

    let currentIndex = 0;
    let currentMaterial = -1;
    let groupStart = 0;
    let indexCount = 0;
    const draft = shipConfig.draft;

    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + (j + 1);
        const b = i * (vSegments + 1) + j;
        const c = (i + 1) * (vSegments + 1) + j;
        const d = (i + 1) * (vSegments + 1) + (j + 1);

        const za = vertices[a * 3 + 2];
        const zb = vertices[b * 3 + 2];
        const zc = vertices[c * 3 + 2];
        const zd = vertices[d * 3 + 2];
        const avgZ = (za + zb + zc + zd) / 4;
        const ya = vertices[a * 3 + 1];
        const yb = vertices[b * 3 + 1];
        const yc = vertices[c * 3 + 1];
        const yd = vertices[d * 3 + 1];
        const avgY = (ya + yb + yc + yd) / 4;

        // Skip triangles that fall under the CutPanel (Starboard side, Y from -30 to 30)
        // v > 0 means Starboard side.
        const vCenter = ((j + 0.5) / vSegments) * 2 - 1;
        if (vCenter > 0.02 && avgY >= -30 && avgY <= 30) {
          continue;
        }

        const matIdx = avgZ < draft ? 1 : 0;

        if (matIdx !== currentMaterial) {
          if (indexCount > 0) groups.push({ start: groupStart, count: indexCount, materialIndex: currentMaterial });
          currentMaterial = matIdx;
          groupStart = currentIndex;
          indexCount = 0;
        }

        indices.push(a, b, d, b, c, d);
        currentIndex += 6;
        indexCount += 6;
      }
    }
    if (indexCount > 0) groups.push({ start: groupStart, count: indexCount, materialIndex: currentMaterial });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    for (const group of groups) geometry.addGroup(group.start, group.count, group.materialIndex);

    const createCap = (uIndex: number, isBow: boolean) => {
      const capVerts: number[] = [];
      const capIndices: number[] = [];
      const u = uIndex / uSegments;
      const center = surface.evaluatePosition(u, 0);
      center.z = shipConfig.hullHeight / 2;
      capVerts.push(center.x, center.y, center.z);
      for (let j = 0; j <= vSegments; j++) {
        const pt = surface.evaluatePosition(u, (j / vSegments) * 2 - 1);
        capVerts.push(pt.x, pt.y, pt.z);
        if (j < vSegments) {
          if (isBow) capIndices.push(0, j + 2, j + 1);
          else capIndices.push(0, j + 1, j + 2);
        }
      }
      if (isBow) capIndices.push(0, 1, vSegments + 1);
      else capIndices.push(0, vSegments + 1, 1);
      const capGeo = new THREE.BufferGeometry();
      capGeo.setAttribute('position', new THREE.Float32BufferAttribute(capVerts, 3));
      capGeo.setIndex(capIndices);
      capGeo.computeVertexNormals();
      return capGeo;
    };

    const lineVertices: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      for (let j = 0; j < vSegments; j++) {
        const v1 = (j / vSegments) * 2 - 1;
        const v2 = ((j + 1) / vSegments) * 2 - 1;
        const p1 = surface.evaluatePosition(u, v1);
        const p2 = surface.evaluatePosition(u, v2);
        lineVertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    for (let j = 0; j <= 16; j++) {
      const v = (j / 16) * 2 - 1;
      for (let i = 0; i < uSegments; i++) {
        const u1 = i / uSegments;
        const u2 = (i + 1) / uSegments;
        const p1 = surface.evaluatePosition(u1, v);
        const p2 = surface.evaluatePosition(u2, v);
        lineVertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    const framesGeo = new THREE.BufferGeometry();
    framesGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

    return { hullGeometry: geometry, frameLinesGeometry: framesGeo, sternGeometry: createCap(0, false), bowGeometry: createCap(uSegments, true) };
  }, [surface]);

  const proxies = useMemo(() => {
    return [
      { u: 0.85, v: 0.6, label: 'Bow Starboard' },
      { u: 0.5, v: -0.5, label: 'Midship Port' },
      { u: 0.15, v: 0.8, label: 'Aft Starboard Upper' },
      { u: 0.5, v: 0.0, label: 'Midship Keel' },
    ].map(loc => {
      const q = surface.querySurfacePoint(loc.u, loc.v);
      return { ...loc, query: q, quat: computeRobotOrientation(q.normal, q.tangent) };
    });
  }, [surface]);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={hullGeometry as any as any} material={showSurfaceDebug ? new THREE.MeshStandardMaterial({ color: '#8B0000', transparent: true, opacity: 0.4, side: THREE.DoubleSide }) : [materials.hullPaint, materials.hullAntiFouling] as THREE.Material[]} />
      
      <mesh castShadow receiveShadow geometry={sternGeometry as any as any} material={showSurfaceDebug ? new THREE.MeshStandardMaterial({ color: '#8B0000', transparent: true, opacity: 0.4, side: THREE.DoubleSide }) : materials.hullPaint} />

      <mesh castShadow receiveShadow geometry={bowGeometry as any as any} material={showSurfaceDebug ? new THREE.MeshStandardMaterial({ color: '#8B0000', transparent: true, opacity: 0.4, side: THREE.DoubleSide }) : materials.hullPaint} />
      
      {showStructuralLines && (
        <lineSegments geometry={frameLinesGeometry as any as any}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </lineSegments>
      )}

      {/* Surface details (welds, draft marks, waterline) */}
      {!showSurfaceDebug && <HullSurfaceDetails surface={surface} />}

      {/* Robot Proxies */}
      {showRobotProxies && proxies.map((proxy, idx) => (
        <group key={idx} position={proxy.query.position} quaternion={proxy.quat}>
          <mesh position={[0, 0, shipConfig.robotSize / 2]}>
            <boxGeometry args={[shipConfig.robotSize, shipConfig.robotSize * 1.2, shipConfig.robotSize]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          {(showSurfaceNormals || showSurfaceDebug) && (
            <arrowHelper args={[new THREE.Vector3(0, 0, 1) as any, new THREE.Vector3(0, 0, 0) as any, 2, 0x00ff00]} />
          )}
          {(showSurfaceTangents || showSurfaceDebug) && (
            <arrowHelper args={[new THREE.Vector3(0, 1, 0) as any, new THREE.Vector3(0, 0, 0) as any, 2, 0x0000ff]} />
          )}
        </group>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------
// MAIN DECK
// ----------------------------------------------------------------------
function MainDeck({ surface, materials }: { surface: ProceduralShipSurface, materials: ReturnType<typeof useShipMaterials> }) {
  const deckGeometry = useMemo(() => {
    const uSegments = 120;
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const idxs: number[] = [];
    const uvs: number[] = [];
    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      const port = surface.evaluatePosition(u, -1);
      const stbd = surface.evaluatePosition(u, 1);
      verts.push(port.x, port.y, port.z, stbd.x, stbd.y, stbd.z);
      uvs.push(0, u, 1, u);
      if (i < uSegments) {
        const p1 = i * 2, s1 = i * 2 + 1, p2 = (i + 1) * 2, s2 = (i + 1) * 2 + 1;
        idxs.push(p1, s1, s2, p1, s2, p2);
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }, [surface]);

  return (
    <mesh castShadow receiveShadow geometry={deckGeometry as any as any} material={materials.deckMaterial as any} />
  );
}

// ----------------------------------------------------------------------
// SUPERSTRUCTURE & BRIDGE
// ----------------------------------------------------------------------
function Superstructure({ materials }: { materials: ReturnType<typeof useShipMaterials> }) {
  const deckZ = 15.1; // Base deck height in aft region
  return (
    <group position={[0, -25, deckZ]}>
      {/* Lower accommodation block */}
      <mesh position={[0, 0, 2]} material={materials.superstructurePaint as any} castShadow receiveShadow>
        <boxGeometry args={[18, 16, 4]} />
      </mesh>
      {/* Mid accommodation block */}
      <mesh position={[0, -1, 6]} material={materials.superstructurePaint as any} castShadow receiveShadow>
        <boxGeometry args={[16, 12, 4]} />
      </mesh>
      {/* Bridge block */}
      <mesh position={[0, -2, 10]} material={materials.superstructurePaint as any} castShadow receiveShadow>
        <boxGeometry args={[14, 8, 4]} />
      </mesh>
      {/* Bridge Wings */}
      <mesh position={[0, 0, 10]} material={materials.superstructurePaint as any} castShadow receiveShadow>
        <boxGeometry args={[22, 3, 3]} />
      </mesh>
      {/* Bridge Windows */}
      <mesh position={[0, 1.6, 10]} material={materials.glass as any}>
        <boxGeometry args={[22.2, 0.2, 1.8]} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------
// FUNNEL & MAST
// ----------------------------------------------------------------------
function FunnelAndMast({ materials }: { materials: ReturnType<typeof useShipMaterials> }) {
  const deckZ = 15.1;
  return (
    <group>
      {/* Funnel */}
      <group position={[0, -42, deckZ]}>
        <mesh position={[0, 0, 4]} rotation={[0.1, 0, 0]} material={materials.funnelMaterial as any} castShadow>
          <cylinderGeometry args={[2, 2.5, 8, 16]} />
        </mesh>
        {/* Exhaust pipe */}
        <mesh position={[0, 0.4, 8.2]} rotation={[0.1, 0, 0]} material={materials.equipmentMetal as any} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 2, 8]} />
        </mesh>
      </group>
      
      {/* Mast */}
      <group position={[0, -27, deckZ + 12]}>
        <mesh position={[0, 0, 5]} rotation={[Math.PI / 2, 0, 0]} material={materials.superstructurePaint as any}>
          <cylinderGeometry args={[0.3, 0.5, 10, 8]} />
        </mesh>
        {/* Radar crossbar */}
        <mesh position={[0, 0, 8]} material={materials.equipmentMetal as any}>
          <boxGeometry args={[6, 0.5, 0.5]} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------
// CARGO HATCHES
// ----------------------------------------------------------------------
function CargoHatches({ materials }: { materials: ReturnType<typeof useShipMaterials> }) {
  const hatches = [
    { y: 35, width: 14, length: 12, height: 1.5, z: 15.3 }, // Bow-most (slight sheer rise)
    { y: 18, width: 16, length: 16, height: 1.5, z: 15.1 },
    { y: -1, width: 16, length: 16, height: 1.5, z: 15.0 },
  ];

  return (
    <group>
      {hatches.map((h, i) => (
        <mesh key={i} position={[0, h.y, h.z]} material={materials.hatchMetal as any} castShadow receiveShadow>
          <boxGeometry args={[h.width, h.length, h.height]} />
          {/* Subtle panel outline */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(h.width, h.length, h.height)]} />
            <lineBasicMaterial color="#1e293b" />
          </lineSegments>
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------------------------
// DECK EQUIPMENT & RAILINGS
// ----------------------------------------------------------------------
function DeckEquipment({ materials }: { materials: ReturnType<typeof useShipMaterials> }) {
  return (
    <group>
      {/* Forecastle equipment (Winches/Windlass) */}
      <mesh position={[0, 52, 16.5]} material={materials.equipmentMetal as any} castShadow>
        <boxGeometry args={[3, 2, 1.5]} />
      </mesh>
      <mesh position={[-2, 54, 16.8]} rotation={[0, 0, Math.PI/2]} material={materials.equipmentMetal as any} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5]} />
      </mesh>
      <mesh position={[2, 54, 16.8]} rotation={[0, 0, Math.PI/2]} material={materials.equipmentMetal as any} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5]} />
      </mesh>

      {/* Aft mooring equipment */}
      <mesh position={[0, -55, 15.5]} material={materials.equipmentMetal as any} castShadow>
        <boxGeometry args={[4, 2, 1]} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------
// SHIP MARKINGS
// ----------------------------------------------------------------------
function ShipMarkings() {
  return (
    <group>
      {/* Warning markings near equipment */}
      <mesh position={[0, -53, 15.11]}>
        <planeGeometry args={[5, 1]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.8} />
      </mesh>
    </group>
  )
}




// ----------------------------------------------------------------------
// SHIP ASSEMBLY MAIN COMPONENT
// ----------------------------------------------------------------------
export function ShipAssembly() {
  const surface = useMemo(() => new ProceduralShipSurface(), []);
  const { xRayMode } = useTwinState();
  const materials = useShipMaterials(xRayMode);

  return (
    <group>
      <EngineeringHull surface={surface} materials={materials} />
      <MainDeck surface={surface} materials={materials} />
      <CargoHatches materials={materials} />
      <Superstructure materials={materials} />
      <FunnelAndMast materials={materials} />
      <DeckEquipment materials={materials} />
      <ShipMarkings />
      <DeckDetails surface={surface} materials={materials} />
      <BridgeDetails materials={materials} />
      
      {/* Ship Navigation Lighting */}
      <pointLight position={[11.5, -25, 25]} color="#2ecc71" intensity={0.8} distance={15} /> {/* Starboard green */}
      <pointLight position={[-11.5, -25, 25]} color="#e74c3c" intensity={0.8} distance={15} /> {/* Port red */}
      <pointLight position={[0, -27, 35]} color="#ffffff" intensity={1.5} distance={30} /> {/* Mast white */}
    </group>
  );
}



