// @ts-nocheck
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ProceduralShipSurface } from '../lib/geometry/ProceduralShipSurface';
import { shipConfig } from '../lib/geometry/shipConfig';

export function HullSurfaceDetails({ surface }: { surface: ProceduralShipSurface }) {
  // 1. Plate Seams (Weld Lines)
  const seamLines = useMemo(() => {
    const lines: number[] = [];
    const uPanels = 30; // Number of vertical plate seams
    const vPanels = 8;  // Number of horizontal plate seams

    // Vertical seams
    for (let i = 0; i <= uPanels; i++) {
      const u = i / uPanels;
      for (let j = 0; j < 40; j++) {
        const v1 = (j / 40) * 2 - 1;
        const v2 = ((j + 1) / 40) * 2 - 1;
        const p1 = surface.evaluatePosition(u, v1);
        const p2 = surface.evaluatePosition(u, v2);
        // Slightly offset outward to prevent Z-fighting
        const n1 = surface.querySurfacePoint(u, v1).normal.multiplyScalar(0.02);
        const n2 = surface.querySurfacePoint(u, v2).normal.multiplyScalar(0.02);
        lines.push(p1.x + n1.x, p1.y + n1.y, p1.z + n1.z);
        lines.push(p2.x + n2.x, p2.y + n2.y, p2.z + n2.z);
      }
    }

    // Horizontal seams
    for (let j = 0; j <= vPanels; j++) {
      const v = (j / vPanels) * 2 - 1;
      for (let i = 0; i < 120; i++) {
        const u1 = i / 120;
        const u2 = (i + 1) / 120;
        const p1 = surface.evaluatePosition(u1, v);
        const p2 = surface.evaluatePosition(u2, v);
        const n1 = surface.querySurfacePoint(u1, v).normal.multiplyScalar(0.02);
        const n2 = surface.querySurfacePoint(u2, v).normal.multiplyScalar(0.02);
        lines.push(p1.x + n1.x, p1.y + n1.y, p1.z + n1.z);
        lines.push(p2.x + n2.x, p2.y + n2.y, p2.z + n2.z);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return geo;
  }, [surface]);

  // 2. Draft Markings (Simple white lines at bow/stern at 1m Z increments)
  const draftMarks = useMemo(() => {
    const lines: number[] = [];
    const maxZ = 12;
    // Bow marks (u = 0.95)
    for (let z = 1; z <= maxZ; z++) {
      for (const sign of [-1, 1]) {
        // Find v that matches Z approx (simplified by just drawing a horizontal line on the hull)
        // Since we don't have an inverse function easily, we just draw a small line segment
        // We know Z at side is roughly proportional, but simpler to just draw absolute coords near the stem
        lines.push(sign * 0.1, shipConfig.lengthOverall / 2 - 2, z);
        lines.push(sign * 1.5, shipConfig.lengthOverall / 2 - 3, z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return geo;
  }, []);

  // 3. Waterline transition band (black)
  const waterlineMesh = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const idxs: number[] = [];
    const uSegments = 120;
    
    // We want a strip from Z = draft - 0.2 to Z = draft + 0.2
    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      // Evaluate starboard side
      const ptStbd = surface.evaluatePosition(u, 0.8); // Side wall
      const nStbd = surface.querySurfacePoint(u, 0.8).normal.multiplyScalar(0.03);
      // Project to waterline
      verts.push(ptStbd.x + nStbd.x, ptStbd.y + nStbd.y, shipConfig.draft - 0.2);
      verts.push(ptStbd.x + nStbd.x, ptStbd.y + nStbd.y, shipConfig.draft + 0.2);
      
      // Evaluate port side
      const ptPort = surface.evaluatePosition(u, -0.8);
      const nPort = surface.querySurfacePoint(u, -0.8).normal.multiplyScalar(0.03);
      verts.push(ptPort.x + nPort.x, ptPort.y + nPort.y, shipConfig.draft - 0.2);
      verts.push(ptPort.x + nPort.x, ptPort.y + nPort.y, shipConfig.draft + 0.2);
    }
    
    // Simplistic strip generation (not perfect manifold, just visual)
    for (let i = 0; i < uSegments; i++) {
      const bStbd = i * 4;
      const tStbd = i * 4 + 1;
      const nbStbd = (i + 1) * 4;
      const ntStbd = (i + 1) * 4 + 1;
      idxs.push(bStbd, tStbd, ntStbd, bStbd, ntStbd, nbStbd);
      
      const bPort = i * 4 + 2;
      const tPort = i * 4 + 3;
      const nbPort = (i + 1) * 4 + 2;
      const ntPort = (i + 1) * 4 + 3;
      // Port side winding reversed
      idxs.push(bPort, ntPort, tPort, bPort, nbPort, ntPort);
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }, [surface]);

  return (
    <group>
      {/* Weld lines */}
      <lineSegments geometry={seamLines}>
        <lineBasicMaterial color="#1a202c" transparent opacity={0.3} />
      </lineSegments>

      {/* Draft marks */}
      <lineSegments geometry={draftMarks}>
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </lineSegments>

      {/* Waterline transition band */}
      <mesh geometry={waterlineMesh}>
        <meshStandardMaterial color="#111111" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

