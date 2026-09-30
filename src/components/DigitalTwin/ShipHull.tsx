import React, { useRef, useMemo } from 'react';
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

const patchSize = 4.0;

function curveGeometry(geom: THREE.BufferGeometry) {
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const theta = x / HULL_RADIUS;
    const newZ = pos.getZ(i) + HULL_RADIUS * Math.cos(theta) - HULL_RADIUS;
    const newX = HULL_RADIUS * Math.sin(theta);
    pos.setXYZ(i, newX, pos.getY(i), newZ);
  }
  geom.computeVertexNormals();
}

function CurvedPlane({ width, height, xOffset, yOffset }: { width: number, height: number, xOffset: number, yOffset: number }) {
  const xRayMode = useRobotStore(state => state.xRayMode);

  const geo = useMemo(() => {
    const wSegs = Math.max(1, Math.floor(width / 2));
    const hSegs = 1;
    const geom = new THREE.PlaneGeometry(width, height, wSegs, hSegs);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + xOffset;
      const y = pos.getY(i) + yOffset;
      const z = pos.getZ(i);
      
      const theta = x / HULL_RADIUS;
      const newZ = z + HULL_RADIUS * Math.cos(theta) - HULL_RADIUS;
      const newX = HULL_RADIUS * Math.sin(theta);
      
      pos.setXYZ(i, newX - xOffset, y - yOffset, newZ);
    }
    geom.computeVertexNormals();
    return geom;
  }, [width, height, xOffset, yOffset]);

  return (
    <mesh geometry={geo} position={[xOffset, yOffset, 0]} receiveShadow castShadow={!xRayMode}>
       <meshStandardMaterial 
          color={xRayMode ? "#2a4b5c" : "#1e2226"} 
          metalness={0.5} 
          roughness={0.8} 
          side={THREE.DoubleSide} 
          transparent={xRayMode}
          opacity={xRayMode ? 0.25 : 1.0}
          depthWrite={!xRayMode}
       />
    </mesh>
  );
}

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
    
    // 3. Cut line points
    const linePts = cutRecord.path.map(p => {
      const theta = p.x / HULL_RADIUS;
      const newZ = 0.005 + HULL_RADIUS * Math.cos(theta) - HULL_RADIUS;
      const newX = HULL_RADIUS * Math.sin(theta);
      // Translate to local space of the group
      return new THREE.Vector3(newX - startPos.x, p.y - startPos.y, newZ - startPos.z);
    });
    
    return { fallingGeo, cutLinePoints: linePts, alphaTexture: tex, startPos };
  }, [cutRecord, previousCuts]);

  const physicsRef = useRef({
    velocity: new THREE.Vector3(0, 0, 1.5),
    angularVelocity: new THREE.Vector3(Math.random() * 1.5, Math.random() * 1.5, Math.random() * 1.5),
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
  const activeCutPath = useRobotStore(state => state.activeCutPath);
  const completedCuts = useRobotStore(state => state.completedCuts);
  
  const hullWidth = 60;
  const hullHeight = 60;

  const basePlaneGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(hullWidth, hullHeight, 128, 128);
    curveGeometry(geo);
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
      const theta = p.x / HULL_RADIUS;
      const newZ = 0.005 + HULL_RADIUS * Math.cos(theta) - HULL_RADIUS;
      const newX = HULL_RADIUS * Math.sin(theta);
      return new THREE.Vector3(newX, p.y, newZ);
    });
  }, [activeCutPath.length]);

  const xRayMode = useRobotStore(state => state.xRayMode);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. The solid remaining hull (always rendered, with holes driven by alpha map) */}
      <mesh geometry={basePlaneGeo} receiveShadow castShadow={!xRayMode}>
        <meshStandardMaterial 
          color={xRayMode ? "#2a4b5c" : "#2c3036"} 
          metalness={0.6} 
          roughness={0.7} 
          transparent={xRayMode || completedCuts.length > 0}
          alphaMap={alphaTexture}
          alphaTest={xRayMode ? 0.01 : 0.5}
          opacity={xRayMode ? 0.25 : 1.0}
          depthWrite={!xRayMode}
          side={THREE.DoubleSide}
        />
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
          const theta = p.x / HULL_RADIUS;
          const newZ = 0.005 + HULL_RADIUS * Math.cos(theta) - HULL_RADIUS;
          const newX = HULL_RADIUS * Math.sin(theta);
          return new THREE.Vector3(newX, p.y, newZ);
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
  
  return (
    <group>
      <InternalShipStructure />
      <CutPanel />

      {/* Massive Top Hull Extension (Y=30 to Y=110) */}
      <CurvedPlane width={157.08} height={80} xOffset={0} yOffset={70} />
      
      {/* Left Hull Extension (X=-30 to X=-78.5) */}
      <CurvedPlane width={48.54} height={60} xOffset={-54.27} yOffset={0} />
      
      {/* Right Hull Extension (X=30 to X=78.5) */}
      <CurvedPlane width={48.54} height={60} xOffset={54.27} yOffset={0} />

      {/* Upper Deck Edge / Railing Area */}
      <mesh position={[0, 110, HULL_CENTER_Z + HULL_RADIUS - 1.5]} receiveShadow>
         <boxGeometry args={[157, 1, 3]} />
         <meshStandardMaterial 
            color={xRayMode ? "#2a4b5c" : "#1a1e22"} 
            metalness={0.7} roughness={0.6} 
            transparent={xRayMode}
            opacity={xRayMode ? 0.25 : 1.0}
            depthWrite={!xRayMode}
         />
      </mesh>

      {/* Industrial External Stringers / Weld Seams (Visual Details) */}
      {Array.from({ length: 32 }).map((_, i) => {
        const arcX = (i - 16) * 4.9; // Arc length along the hull
        const theta = arcX / HULL_RADIUS;
        
        const worldX = HULL_RADIUS * Math.sin(theta);
        const z = HULL_CENTER_Z + HULL_RADIUS * Math.cos(theta);
        return (
          <group key={`ext-st-${i}`}>
            {/* Lower stringers (avoiding CutPanel operational area if possible, or just thin seams) */}
            <mesh position={[worldX, 70, z]} rotation={[0, -theta, 0]} receiveShadow castShadow={!xRayMode}>
               <boxGeometry args={[0.05, 80, 0.15]} />
               <meshStandardMaterial 
                 color="#1a1e22" 
                 metalness={0.6} 
                 roughness={0.8} 
                 transparent={xRayMode}
                 opacity={xRayMode ? 0.25 : 1.0}
                 depthWrite={!xRayMode}
               />
            </mesh>
            {/* Horizontal weld lines / panel seams */}
            <mesh position={[worldX, 30, z]} rotation={[0, -theta, 0]} receiveShadow castShadow={!xRayMode}>
               <boxGeometry args={[4.9, 0.05, 0.05]} />
               <meshStandardMaterial 
                 color="#111518" 
                 metalness={0.8} 
                 roughness={0.9} 
                 transparent={xRayMode}
                 opacity={xRayMode ? 0.25 : 1.0}
                 depthWrite={!xRayMode}
               />
            </mesh>
            <mesh position={[worldX, 70, z]} rotation={[0, -theta, 0]} receiveShadow castShadow={!xRayMode}>
               <boxGeometry args={[4.9, 0.05, 0.05]} />
               <meshStandardMaterial 
                 color="#111518" 
                 metalness={0.8} 
                 roughness={0.9} 
                 transparent={xRayMode}
                 opacity={xRayMode ? 0.25 : 1.0}
                 depthWrite={!xRayMode}
               />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
