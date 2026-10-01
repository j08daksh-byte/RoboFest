import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRobotStore } from '@/lib/robotState';

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

  const bgGeo = useMemo(() => {
    const geom = new THREE.BoxGeometry(40, 40, 0.05, 64, 1, 1);
    geom.translate(0, 0, -0.4);
    curveGeometry(geom);
    return geom;
  }, []);
  
  const xRayMode = useRobotStore(state => state.xRayMode);

  return (
    <group position={[0, 0, 0]}>
      {/* Deep dark void inside ship so light doesn't shine through */}
      <mesh geometry={bgGeo} visible={!xRayMode}>
        <meshStandardMaterial color="#020202" roughness={1.0} />
      </mesh>
      
      {/* Transverse ribs (horizontal) */}
      {ribs.map((y, idx) => (
        <mesh key={`int-rib-${idx}`} geometry={ribGeo} position={[0, y, 0]} receiveShadow>
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

import { ProceduralShipSurface } from '@/lib/geometry/ProceduralShipSurface';
import { shipConfig } from '@/lib/geometry/shipConfig';
import { useShipMaterials } from '@/lib/materials/useShipMaterials';

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
      uvAttr.setXY(i, u, (bestV + 1) / 2);
    }
    
    // Convert back to local space:
    // World X = 10.05 + localZ  => localZ = World X - 10.05
    // World Y = localY          => localY = World Y
    // World Z = 7.5 - localX    => localX = 7.5 - World Z
    pos.setXYZ(i, 7.5 - pt.z, pt.y, pt.x - 10.05);
  }
  geom.computeVertexNormals();
}

// CurvedPlane removed as it belonged to the old ship extensions

import { Line } from '@react-three/drei';

import type { CutRecord } from '@/lib/robotState';

function DetachedPanel({ cutRecord, previousCuts }: { cutRecord: CutRecord, previousCuts: CutRecord[] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const { fallingGeo, cutLinePoints, alphaTexture, startPos } = useMemo(() => {
    if (!cutRecord.isClosed || cutRecord.path.length < 3) return { fallingGeo: null, cutLinePoints: [], alphaTexture: null, startPos: new THREE.Vector3() };
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    cutRecord.path.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    // Add small padding
    minX -= 0.1; maxX += 0.1; minY -= 0.1; maxY += 0.1;
    const w = maxX - minX;
    const h = maxY - minY;
    
    // 1. Create PlaneGeometry in world space
    const wSegs = Math.max(2, Math.ceil(w * 4));
    const hSegs = Math.max(2, Math.ceil(h * 4));
    const fallingGeo = new THREE.PlaneGeometry(w, h, wSegs, hSegs);
    
    // Translate to its true position on the 2D hull before curving
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    fallingGeo.translate(cx, cy, 0);
    
    // Curve it
    curveGeometry(fallingGeo);
    
    // Center it so physics behaves well
    fallingGeo.computeBoundingBox();
    const startPos = new THREE.Vector3();
    fallingGeo.boundingBox!.getCenter(startPos);
    fallingGeo.translate(-startPos.x, -startPos.y, -startPos.z);
    
    // 2. Generate AlphaMap
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background transparent
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const drawPath = (path: {x:number, y:number}[], fillStyle: string) => {
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        path.forEach((p, i) => {
          const px = ((p.x - minX) / w) * canvas.width;
          const py = (1.0 - (p.y - minY) / h) * canvas.height;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
      };
      
      // Draw this cut as opaque (white)
      drawPath(cutRecord.path, '#ffffff');
      
      // Draw previous cuts as transparent (black) to subtract overlaps!
      previousCuts.forEach(prev => {
        if (!prev.isClosed || prev.id === cutRecord.id) return;
        drawPath(prev.path, '#000000');
      });
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    
    // 3. Cut line points (flattened)
    const linePts = cutRecord.path.map(p => {
      // Translate to local space of the group
      return new THREE.Vector3(p.x - startPos.x, p.y - startPos.y, 0.005 - startPos.z);
    });
    
    return { fallingGeo, cutLinePoints: linePts, alphaTexture: tex, startPos };
  }, [cutRecord, previousCuts]);

  const [initialAngularVelocity] = useState(() => new THREE.Vector3(Math.random() * 1.5, Math.random() * 1.5, Math.random() * 1.5));
  
  const physicsRef = useRef({
    velocity: new THREE.Vector3(0, 0, 1.5),
    angularVelocity: initialAngularVelocity,
    landed: false
  });

  useFrame((state, delta) => {
    if (!groupRef.current || !fallingGeo || physicsRef.current.landed) return;
    
    const gravity = new THREE.Vector3(0, -9.81, 0); 
    physicsRef.current.velocity.addScaledVector(gravity, delta);
    
    groupRef.current.position.addScaledVector(physicsRef.current.velocity, delta);
    
    groupRef.current.rotation.x += physicsRef.current.angularVelocity.x * delta;
    groupRef.current.rotation.y += physicsRef.current.angularVelocity.y * delta;
    groupRef.current.rotation.z += physicsRef.current.angularVelocity.z * delta;
    
    // Ground collision
    const GROUND_Y = -30;
    if (!fallingGeo.boundingSphere) fallingGeo.computeBoundingSphere();
    const radius = fallingGeo.boundingSphere ? fallingGeo.boundingSphere.radius : 1.0;
    const worldBottom = groupRef.current.position.y - radius;

    if (worldBottom <= GROUND_Y) {
      groupRef.current.position.y = GROUND_Y + radius;
      
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
    <group ref={groupRef} position={[startPos.x, startPos.y, startPos.z]}>
      {/* Outer face */}
      <mesh geometry={fallingGeo} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#2c3036" metalness={0.6} roughness={0.7} 
          alphaMap={alphaTexture} alphaTest={0.5} transparent side={THREE.DoubleSide} 
        />
      </mesh>
      {/* Inner face for thickness */}
      <mesh geometry={fallingGeo} position={[0, 0, -0.04]} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#1a1c1e" metalness={0.6} roughness={0.7} 
          alphaMap={alphaTexture} alphaTest={0.5} transparent side={THREE.DoubleSide} 
        />
      </mesh>
      <Line points={cutLinePoints} color="#ff4400" lineWidth={2} />
    </group>
  );
}

function CutPanel() {
  const rawActiveCutPath = useRobotStore(state => state.activeCutPath);
  const rawCompletedCuts = useRobotStore(state => state.completedCuts);

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

  const xRayMode = useRobotStore(state => state.xRayMode);
  const materials = useShipMaterials();
  
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
      <mesh geometry={basePlaneGeo} receiveShadow castShadow={!xRayMode} material={[paintMat, antiFoulingMat]}>
      </mesh>

      {/* 2. The glowing cut path while actively tracing */}
      {trackingLinePts.length > 0 && (
        <Line 
          points={trackingLinePts}
          color="#ffaa00"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      )}
      
      {/* 3. Render all detached panels */}
      {completedCuts.map((cut, idx) => (
        <DetachedPanel key={cut.id} cutRecord={cut} previousCuts={completedCuts.slice(0, idx)} />
      ))}
      
      {/* 4. Glowing edges on the remaining holes */}
      {completedCuts.map(cut => {
        const linePts = cut.path.map(p => {
          return new THREE.Vector3(p.x, p.y, 0.005);
        });
        return (
          <Line 
            key={`hole-line-${cut.id}`}
            points={linePts}
            color="#ff4400"
            lineWidth={2}
          />
        );
      })}
    </group>
  );
}

export function ShipHull() {
  const xRayMode = useRobotStore(state => state.xRayMode);
  const completedCuts = useRobotStore(state => state.completedCuts);
  
  const showInternal = xRayMode || completedCuts.length > 0;
  
  return (
    <group>
      {showInternal && <InternalShipStructure />}
      <CutPanel />
    </group>
  );
}
