// @ts-nocheck
import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTwinState } from '../TwinProvider';

const HULL_RADIUS = 25;
const HULL_CENTER_Z = -HULL_RADIUS - 0.05; // so at x=0, z=-0.05

function InternalShipStructure() {
  const ribs = Array.from({ length: 120 }).map((_, i) => i * 0.3 - 18.0);
  const stringers = Array.from({ length: 40 }).map((_, i) => i * 0.9 - 18.0);
  
  const ribGeo = useMemo(() => {
    const geom = new THREE.BoxGeometry(40, 0.08, 0.1, 64, 1, 1);
    geom.translate(0, 0, -0.3);
    curveGeometry(geom);
    return geom;
  }, []);

  const { xRayMode } = useTwinState();

  return (
    <group position={[0, 0, 0]}>
      
      {/* Transverse ribs (horizontal) */}
      {ribs.map((y, idx) => (
        <mesh key={`int-rib-${idx}`} geometry={ribGeo as any} position={[0, y, 0]} receiveShadow>
          <meshStandardMaterial 
            color="#1a1c1e" 
            metalness={0.6} 
            roughness={0.8}
            transparent={xRayMode}
            opacity={xRayMode ? 0.2 : 1.0}
            depthWrite={!xRayMode}
          />
        </mesh>
      ))}
      
      {/* Longitudinal stringers (vertical) */}
      {stringers.map((x, idx) => {
        const theta = x / HULL_RADIUS;
        const newZ = HULL_RADIUS * Math.cos(theta) - HULL_RADIUS - 0.3;
        const newX = HULL_RADIUS * Math.sin(theta);
        return (
          <mesh key={`int-str-${idx}`} position={[newX, 0, newZ]} rotation={[0, -theta, 0]} receiveShadow>
            <boxGeometry args={[0.1, 40, 0.15]} />
            <meshStandardMaterial 
              color="#222528" 
              metalness={0.6} 
              roughness={0.8}
              transparent={xRayMode}
              opacity={xRayMode ? 0.2 : 1.0}
              depthWrite={!xRayMode}
            />
          </mesh>
        );
      })}
    </group>
  );
}

import { ProceduralShipSurface } from '../lib/geometry/ProceduralShipSurface';
import { shipConfig } from '../lib/geometry/shipConfig';
import { useShipMaterials } from '../lib/materials/useShipMaterials';

const patchSize = 4.0;
const proceduralSurface = new ProceduralShipSurface();

function curveGeometry(geom: THREE.BufferGeometry) {
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    // CutPanel local coords:
    // x maps to World Z (7.5 - x)
    // y maps to World Y
    const localX = pos.getX(i);
    const localY = pos.getY(i);
    const localZ = pos.getZ(i);
    
    const worldY = localY;
    const worldZ = 7.5 - localX;
    
    // Reverse map to u, v
    const L = shipConfig.lengthOverall;
    const u = worldY / L + 0.5;
    
    // Find v iteratively or just use a fixed v for the starboard side given Z
    let bestV = 0.5;
    let minErr = Infinity;
    for(let v = 0; v <= 1; v += 0.05) {
      const p = proceduralSurface.evaluatePosition(u, v);
      const err = Math.abs(p.z - worldZ);
      if (err < minErr) { minErr = err; bestV = v; }
    }
    const pt = proceduralSurface.evaluatePosition(u, bestV);
    
    // Update UVs to exactly match the surrounding ShipAssembly
    const uvAttr = geom.attributes.uv;
    if (uvAttr) {
      // uvAttr.setXY(i, u, (bestV + 1) / 2); // Commented out so alphaTexture matches local CutPanel UVs
    }
    
    // Convert back to local space. Apply localZ as an offset along the normal.
    // For now, we approximate the normal by offsetting along local Z axis (which maps to world X).
    // The surface normal points roughly in the +X direction on the starboard side.
    pos.setXYZ(i, 7.5 - pt.z, pt.y, pt.x - 10.05 + localZ);
  }
  geom.computeVertexNormals();
}

// CurvedPlane removed as it belonged to the old ship extensions

import { Line } from '@react-three/drei';


const DetachedPanel = React.memo(function DetachedPanel({ cutRecord, allCuts, idx }: { cutRecord: { id: string; timestamp: number; path: Array<{ x: number; y: number }>; isClosed: boolean; }, allCuts: Array<{ id: string; timestamp: number; path: Array<{ x: number; y: number }>; isClosed: boolean; }>, idx: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const { fallingGeo, cutLinePoints, startPos } = useMemo(() => {
    if (!cutRecord.isClosed || cutRecord.path.length < 3) return { fallingGeo: null, cutLinePoints: [], startPos: new THREE.Vector3() };
    
    // 1. Create Shape in 2D ship local coords
    const shape = new THREE.Shape();
    cutRecord.path.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.y);
      else shape.lineTo(p.x, p.y);
    });
    
    // Add holes for any previous overlapping cuts
    const previousCuts = allCuts.slice(0, idx);
    previousCuts.forEach(prev => {
      if (!prev.isClosed || prev.id === cutRecord.id) return;
      const hole = new THREE.Path();
      prev.path.forEach((p, i) => {
        if (i === 0) hole.moveTo(p.x, p.y);
        else hole.lineTo(p.x, p.y);
      });
      shape.holes.push(hole);
    });
    
    // Create ShapeGeometry. This triangulates the polygon.
    const fallingGeo = new THREE.ShapeGeometry(shape);
    
    // Curve it along the hull mathematically
    curveGeometry(fallingGeo);
    
    // Center it so physics behaves cleanly (rotation around its own center)
    fallingGeo.computeBoundingBox();
    const startPos = new THREE.Vector3();
    fallingGeo.boundingBox!.getCenter(startPos);
    fallingGeo.translate(-startPos.x, -startPos.y, -startPos.z);
    
    // 3. Cut line points (flattened for the glowing edge)
    const linePts = cutRecord.path.map(p => {
      // Translate to local space of the group
      return new THREE.Vector3(p.x - startPos.x, p.y - startPos.y, 0.005 - startPos.z);
    });
    
    return { fallingGeo, cutLinePoints: linePts, startPos };
  }, [cutRecord, allCuts, idx]);

  const [initialAngularVelocity] = useState(() => new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5));
  
  const physicsRef = useRef({
    velocity: new THREE.Vector3(0, 0, 0.3), // Outward push (local Z is outward)
    angularVelocity: initialAngularVelocity,
    position: new THREE.Vector3(),
    initialized: false,
    landed: false
  });

  if (!physicsRef.current.initialized && fallingGeo) {
    physicsRef.current.position.copy(startPos);
    physicsRef.current.initialized = true;
  }

  useFrame((state, delta) => {
    if (!groupRef.current || !fallingGeo || physicsRef.current.landed) return;
    
    // Gravity is scaled down by 5 because local space is scaled by 5
    const gravity = new THREE.Vector3(0, -9.81 / 5, 0); 
    physicsRef.current.velocity.addScaledVector(gravity, delta);
    
    physicsRef.current.position.addScaledVector(physicsRef.current.velocity, delta);
    groupRef.current.position.copy(physicsRef.current.position);
    
    groupRef.current.rotation.x += physicsRef.current.angularVelocity.x * delta;
    groupRef.current.rotation.y += physicsRef.current.angularVelocity.y * delta;
    groupRef.current.rotation.z += physicsRef.current.angularVelocity.z * delta;
    
    // Ground collision: World floor is at Y = -30, so local floor is Y = -6
    const GROUND_Y = -6;
    if (!fallingGeo.boundingSphere) fallingGeo.computeBoundingSphere();
    const radius = fallingGeo.boundingSphere ? fallingGeo.boundingSphere.radius : 1.0;
    const worldBottom = groupRef.current.position.y - radius;

    if (worldBottom <= GROUND_Y) {
      physicsRef.current.position.y = GROUND_Y + radius;
      groupRef.current.position.copy(physicsRef.current.position);
      
      physicsRef.current.velocity.y *= -0.4;
      physicsRef.current.velocity.x *= 0.5;
      physicsRef.current.velocity.z *= 0.5;
      physicsRef.current.angularVelocity.multiplyScalar(0.5);
      
      if (Math.abs(physicsRef.current.velocity.y) < 0.2 && physicsRef.current.angularVelocity.length() < 0.2) {
        physicsRef.current.velocity.set(0, 0, 0);
        physicsRef.current.angularVelocity.set(0, 0, 0);
        physicsRef.current.landed = true;
      }
    }
  });

  if (!fallingGeo) return null;

  return (
    <group ref={groupRef}>
      {/* Outer face */}
      <mesh geometry={fallingGeo as any} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#3a4750" metalness={0.3} roughness={0.65} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      {/* Inner face for thickness */}
      <mesh geometry={fallingGeo as any} position={[0, 0, -0.04]} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#1a1c1e" metalness={0.6} roughness={0.7} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      <Line points={cutLinePoints as any} color="#ff4400" lineWidth={2} />
    </group>
  );
});

function CutPanel() {
  const { activeCutPath: rawActiveCutPath, completedCuts: rawCompletedCuts } = useTwinState();

  // Scale down the paths by 5 because ShipHull is rendered inside a group with scale=[5, 5, 5]
  // but the torch coordinates are recorded in the robot's 1:1 world scale.
  const activeCutPath = useMemo(() => rawActiveCutPath.map(p => ({ x: p.x / 5, y: p.y / 5 })), [rawActiveCutPath]);
  const completedCuts = useMemo(() => rawCompletedCuts.map(cut => ({
    ...cut,
    path: cut.path.map(p => ({ x: p.x / 5, y: p.y / 5 }))
  })), [rawCompletedCuts]);
  
  const hullWidth = 60;
  const hullHeight = 60;

  const basePlaneGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(hullWidth, hullHeight, 128, 128);
    curveGeometry(geo);
    
    // Assign material groups based on Draft
    // Local coords: World Z = 7.5 - localX
    // Draft is World Z = 5.0
    // localX = 2.5
    // Above draft (Grey): localX < 2.5
    // Below draft (Red): localX >= 2.5
    const pos = geo.attributes.position;
    const groups: { start: number; count: number; materialIndex: number }[] = [];
    let currentMaterial = -1;
    let groupStart = 0;
    
    for (let i = 0; i < geo.index!.count; i += 3) {
      const a = geo.index!.getX(i);
      const b = geo.index!.getX(i + 1);
      const c = geo.index!.getX(i + 2);
      
      const xa = pos.getX(a);
      const xb = pos.getX(b);
      const xc = pos.getX(c);
      const avgX = (xa + xb + xc) / 3;
      
      const matIdx = avgX < 2.5 ? 0 : 1;
      
      if (matIdx !== currentMaterial) {
        if (i > 0) groups.push({ start: groupStart, count: i - groupStart, materialIndex: currentMaterial });
        currentMaterial = matIdx;
        groupStart = i;
      }
    }
    if (geo.index!.count - groupStart > 0) {
      groups.push({ start: groupStart, count: geo.index!.count - groupStart, materialIndex: currentMaterial });
    }
    
    for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);
    
    return geo;
  }, []);

  const alphaTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#000000';
      completedCuts.forEach(cut => {
        if (!cut.isClosed || cut.path.length < 3) return;
        ctx.beginPath();
        cut.path.forEach((p, i) => {
          const cx = ((p.x + hullWidth / 2) / hullWidth) * canvas.width;
          const cy = (1.0 - (p.y + hullHeight / 2) / hullHeight) * canvas.height;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.closePath();
        ctx.fill();
      });
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, [completedCuts]);

  // Calculate curved points for the active tracking line
  const trackingLinePts = useMemo(() => {
    return activeCutPath.map(p => {
      return new THREE.Vector3(p.x, p.y, 0.005);
    });
  }, [activeCutPath.length, activeCutPath]);

  const { xRayMode } = useTwinState();
  const materials = useShipMaterials(xRayMode);
  
  const paintMat = useMemo(() => materials.hullPaint.clone(), [materials]);
  const antiFoulingMat = useMemo(() => materials.hullAntiFouling.clone(), [materials]);
  
  useEffect(() => {
    [paintMat, antiFoulingMat].forEach(mat => {
      mat.transparent = xRayMode;
      mat.alphaMap = alphaTexture;
      mat.alphaTest = xRayMode ? 0.01 : 0.5;
      mat.opacity = xRayMode ? 0.25 : 1.0;
      mat.depthWrite = !xRayMode;
      mat.side = THREE.DoubleSide;
      if (xRayMode) {
        mat.color.setHex(0x2a4b5c);
      } else {
        // Reset to original colors
        if (mat === paintMat) mat.color.setHex(0x3a4750);
        else mat.color.setHex(0x8b2929);
      }
      mat.needsUpdate = true;
    });
  }, [xRayMode, completedCuts.length, alphaTexture, paintMat, antiFoulingMat]);

  const isActive = true;

  if (!isActive) return null;

  return (
    <group position={[0, 0, 0.02]}>
      {/* 1. The solid remaining hull (always rendered, with holes driven by alpha map) */}
      <mesh geometry={basePlaneGeo as any} receiveShadow castShadow={!xRayMode} material={[paintMat, antiFoulingMat] as any}>
      </mesh>

      {/* 2. The glowing cut path while actively tracing */}
      {trackingLinePts.length > 0 && (
        <Line 
          points={trackingLinePts as any}
          color="#ffaa00"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      )}
      
      {/* 3. Render all detached panels */}
      {completedCuts.map((cut, idx) => (
        <DetachedPanel key={cut.id} cutRecord={cut} allCuts={completedCuts} idx={idx} />
      ))}
      
      {/* 4. Glowing edges on the remaining holes */}
      {completedCuts.map(cut => {
        const linePts = cut.path.map(p => {
          return new THREE.Vector3(p.x, p.y, 0.005);
        });
        return (
          <Line 
            key={`hole-line-${cut.id}`}
            points={linePts as any}
            color="#ff4400"
            lineWidth={2}
          />
        );
      })}
    </group>
  );
}

export function ShipHull() {
  const { xRayMode, completedCuts } = useTwinState();
  
  const hasClosedCuts = completedCuts.some(cut => cut.isClosed);
  const showInternal = xRayMode || hasClosedCuts;
  
  return (
    <group>
      {showInternal && <InternalShipStructure />}
      <CutPanel />
    </group>
  );
}




