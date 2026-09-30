import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ProceduralShipSurface } from '@/lib/geometry/ProceduralShipSurface';
import { computeRobotOrientation } from '@/lib/geometry/HullSurfaceQuery';
import { shipConfig } from '@/lib/geometry/shipConfig';

export function ShipHullPrototype() {
  const surface = useMemo(() => new ProceduralShipSurface(), []);

  // 1. Generate Main Hull Mesh
  const { hullGeometry, frameLinesGeometry, deckGeometry } = useMemo(() => {
    const uSegments = 80;
    const vSegments = 40;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Vertices
    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      for (let j = 0; j <= vSegments; j++) {
        // v from -1 (port) to 1 (starboard)
        const v = (j / vSegments) * 2 - 1;
        const pt = surface.evaluatePosition(u, v);
        vertices.push(pt.x, pt.y, pt.z);
        uvs.push(u, (v + 1) / 2);
      }
    }

    // Indices
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + (j + 1);
        const b = i * (vSegments + 1) + j;
        const c = (i + 1) * (vSegments + 1) + j;
        const d = (i + 1) * (vSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Structural frames (transverse ribs and longitudinal stringers)
    const lineVertices: number[] = [];
    // Transverse frames every 10 meters roughly (u steps)
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      for (let j = 0; j < vSegments; j++) {
        const v1 = (j / vSegments) * 2 - 1;
        const v2 = ((j + 1) / vSegments) * 2 - 1;
        const p1 = surface.evaluatePosition(u, v1);
        const p2 = surface.evaluatePosition(u, v2);
        lineVertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    // Longitudinal stringers (waterlines/seams)
    for (let j = 0; j <= 8; j++) {
      const v = (j / 8) * 2 - 1;
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

    // Simple flat deck
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

    return { hullGeometry: geometry, frameLinesGeometry: framesGeo, deckGeometry: deckGeo };
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
        <meshStandardMaterial color="#8B0000" side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      
      {/* Structural Frames */}
      <lineSegments geometry={frameLinesGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </lineSegments>

      {/* Deck */}
      <mesh geometry={deckGeometry}>
        <meshStandardMaterial color="#2c3e50" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>

      {/* Waterline visual boundary */}
      <mesh position={[0, 0, shipConfig.draft]}>
        <planeGeometry args={[shipConfig.beam * 2, shipConfig.lengthOverall * 1.2]} />
        <meshStandardMaterial color="#3498db" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Robot Proxies */}
      {proxies.map((proxy, idx) => (
        <group key={idx} position={proxy.query.position} quaternion={proxy.quat}>
          {/* Box representing robot body (sitting slightly off the hull by half its thickness) */}
          <mesh position={[0, 0, shipConfig.robotSize / 2]}>
            <boxGeometry args={[shipConfig.robotSize, shipConfig.robotSize * 1.2, shipConfig.robotSize]} />
            <meshStandardMaterial color="#f1c40f" />
          </mesh>
          
          {/* Normal Vector (Green, Z-axis) */}
          <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2, 0x00ff00]} />
          
          {/* Tangent Vector (Blue, Y-axis) */}
          <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2, 0x0000ff]} />
        </group>
      ))}
    </group>
  );
}
