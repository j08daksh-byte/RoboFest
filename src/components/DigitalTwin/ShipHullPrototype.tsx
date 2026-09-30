import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ProceduralShipSurface } from '@/lib/geometry/ProceduralShipSurface';
import { computeRobotOrientation } from '@/lib/geometry/HullSurfaceQuery';
import { shipConfig } from '@/lib/geometry/shipConfig';
import { useTestShipStore } from '@/lib/state/testShipStore';

export function ShipHullPrototype() {
  const surface = useMemo(() => new ProceduralShipSurface(), []);
  const { showStructuralLines, showSurfaceDebug, showSurfaceNormals, showSurfaceTangents, showRobotProxies } = useTestShipStore();

  // 1. Generate Main Hull Mesh
  const { hullGeometry, frameLinesGeometry, deckGeometry, sternGeometry, bowGeometry } = useMemo(() => {
    const uSegments = 120; // Increased for smoother longitudinal curves (bow/stern)
    const vSegments = 40;  // Smooth girth
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const groups: { start: number, count: number, materialIndex: number }[] = [];

    // Vertices
    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1; // -1 to 1
        const pt = surface.evaluatePosition(u, v);
        vertices.push(pt.x, pt.y, pt.z);
        uvs.push(u, (v + 1) / 2);
      }
    }

    // Indices and Material Groups
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

        // Determine if this face is below waterline based on average Z
        const za = vertices[a * 3 + 2];
        const zb = vertices[b * 3 + 2];
        const zc = vertices[c * 3 + 2];
        const zd = vertices[d * 3 + 2];
        const avgZ = (za + zb + zc + zd) / 4;
        const matIdx = avgZ < draft ? 1 : 0; // 1 = Red antifouling, 0 = Steel upper

        if (matIdx !== currentMaterial) {
          if (indexCount > 0) {
            groups.push({ start: groupStart, count: indexCount, materialIndex: currentMaterial });
          }
          currentMaterial = matIdx;
          groupStart = currentIndex;
          indexCount = 0;
        }

        indices.push(a, b, d);
        indices.push(b, c, d);
        currentIndex += 6;
        indexCount += 6;
      }
    }
    if (indexCount > 0) {
      groups.push({ start: groupStart, count: indexCount, materialIndex: currentMaterial });
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    for (const group of groups) {
      geometry.addGroup(group.start, group.count, group.materialIndex);
    }

    // Cap Generator for Stern and Bow
    const createCap = (uIndex: number, isBow: boolean) => {
      const capVerts: number[] = [];
      const capIndices: number[] = [];
      const u = uIndex / uSegments;
      
      const center = surface.evaluatePosition(u, 0);
      center.z = shipConfig.hullHeight / 2; // Approximate center
      capVerts.push(center.x, center.y, center.z);
      
      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1;
        const pt = surface.evaluatePosition(u, v);
        capVerts.push(pt.x, pt.y, pt.z);
        
        if (j < vSegments) {
          if (isBow) {
            capIndices.push(0, j + 2, j + 1);
          } else {
            capIndices.push(0, j + 1, j + 2);
          }
        }
      }
      // Close the deck
      if (isBow) capIndices.push(0, 1, vSegments + 1);
      else capIndices.push(0, vSegments + 1, 1);

      const capGeo = new THREE.BufferGeometry();
      capGeo.setAttribute('position', new THREE.Float32BufferAttribute(capVerts, 3));
      capGeo.setIndex(capIndices);
      capGeo.computeVertexNormals();
      return capGeo;
    };

    const sternGeo = createCap(0, false);
    const bowGeo = createCap(uSegments, true);

    // Structural frames (transverse ribs and longitudinal stringers)
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

    // Simple flat deck mapping port to starboard
    const deckGeo = new THREE.BufferGeometry();
    const deckVerts: number[] = [];
    const deckIndices: number[] = [];
    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      const port = surface.evaluatePosition(u, -1);
      const stbd = surface.evaluatePosition(u, 1);
      deckVerts.push(port.x, port.y, port.z);
      deckVerts.push(stbd.x, stbd.y, stbd.z);
      
      if (i < uSegments) {
        const p1 = i * 2;
        const s1 = i * 2 + 1;
        const p2 = (i + 1) * 2;
        const s2 = (i + 1) * 2 + 1;
        deckIndices.push(p1, s1, s2);
        deckIndices.push(p1, s2, p2);
      }
    }
    deckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckVerts, 3));
    deckGeo.setIndex(deckIndices);
    deckGeo.computeVertexNormals();

    return { hullGeometry: geometry, frameLinesGeometry: framesGeo, deckGeometry: deckGeo, sternGeometry: sternGeo, bowGeometry: bowGeo };
  }, [surface]);

  // 2. Define Robot Proxy Placements
  const proxies = useMemo(() => {
    const locations = [
      { u: 0.85, v: 0.6, label: 'Bow Starboard' },
      { u: 0.5, v: -0.5, label: 'Midship Port' },
      { u: 0.15, v: 0.8, label: 'Aft Starboard Upper' },
      { u: 0.5, v: 0.0, label: 'Midship Keel' },
    ];
    
    return locations.map(loc => {
      const q = surface.querySurfacePoint(loc.u, loc.v);
      const quat = computeRobotOrientation(q.normal, q.tangent);
      return { ...loc, query: q, quat };
    });
  }, [surface]);

  return (
    <group>
      {/* Ship Shell */}
      <mesh geometry={hullGeometry}>
        {/* Material 0: Upper Hull (Industrial Steel) */}
        <meshStandardMaterial attach="material-0" color="#3a4750" side={THREE.DoubleSide} roughness={0.6} metalness={0.2} />
        {/* Material 1: Lower Hull (Anti-fouling Red) */}
        <meshStandardMaterial attach="material-1" color="#8b2929" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      
      {/* Stern Cap */}
      <mesh geometry={sternGeometry}>
        <meshStandardMaterial color="#3a4750" side={THREE.DoubleSide} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Bow Cap */}
      <mesh geometry={bowGeometry}>
        <meshStandardMaterial color="#3a4750" side={THREE.DoubleSide} roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Structural Frames */}
      {showStructuralLines && (
        <lineSegments geometry={frameLinesGeometry}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </lineSegments>
      )}

      {/* Deck */}
      <mesh geometry={deckGeometry}>
        <meshStandardMaterial color="#2d3748" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>

      {/* Waterline visual boundary */}
      <mesh position={[0, 0, shipConfig.draft]}>
        <planeGeometry args={[shipConfig.beam * 2.5, shipConfig.lengthOverall * 1.3]} />
        <meshStandardMaterial color="#3498db" transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Robot Proxies */}
      {showRobotProxies && proxies.map((proxy, idx) => (
        <group key={idx} position={proxy.query.position} quaternion={proxy.quat}>
          {/* Box representing robot body */}
          <mesh position={[0, 0, shipConfig.robotSize / 2]}>
            <boxGeometry args={[shipConfig.robotSize, shipConfig.robotSize * 1.2, shipConfig.robotSize]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
          
          {/* Normal Vector (Green, Z-axis) */}
          {(showSurfaceNormals || showSurfaceDebug) && (
            <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2, 0x00ff00]} />
          )}
          
          {/* Tangent Vector (Blue, Y-axis) */}
          {(showSurfaceTangents || showSurfaceDebug) && (
            <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2, 0x0000ff]} />
          )}
        </group>
      ))}
    </group>
  );
}
