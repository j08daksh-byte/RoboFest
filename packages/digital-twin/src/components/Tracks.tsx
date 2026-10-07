// @ts-nocheck
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';
import { IndustrialMaterial } from './IndustrialMaterial';

function CrawlerTrack({ side, offsetX }: { side: 'left' | 'right'; offsetX: number }) {
  const { trackWidthX, trackLengthY, trackHeightZ } = robotConfig;
  const { trackOffset } = useTwinState();
  
  // Track proportions
  const wheelRadius = trackHeightZ / 2;
  const straightLength = trackLengthY - (wheelRadius * 2);
  const halfStraight = straightLength / 2;
  const circumference = (2 * straightLength) + (2 * Math.PI * wheelRadius);
  
  const treadCount = 36; 
  const treads = useMemo(() => {
    const arr = [];
    for (let i = 0; i < treadCount; i++) {
      const baseDist = (i / treadCount) * circumference;
      // We subtract trackOffset so if the robot moves UP (+Y), the track offset increases, 
      // which means the belt material goes DOWN (-Y) relative to the chassis.
      // Wait, moving UP means the belt goes DOWN relative to the robot.
      let distance = (baseDist - trackOffset) % circumference;
      if (distance < 0) distance += circumference;
      
      let y = 0;
      let z = 0;
      let angle = 0;

      if (distance < straightLength) {
        y = -halfStraight + distance;
        z = -wheelRadius;
        angle = 0; 
      } else if (distance < straightLength + Math.PI * wheelRadius) {
        const curveDist = distance - straightLength;
        const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI; // 0 to PI
        y = halfStraight + Math.sin(theta) * wheelRadius;
        z = -wheelRadius + (1 - Math.cos(theta)) * wheelRadius;
        angle = theta;
      } else if (distance < 2 * straightLength + Math.PI * wheelRadius) {
        const topDist = distance - (straightLength + Math.PI * wheelRadius);
        y = halfStraight - topDist;
        z = wheelRadius;
        angle = Math.PI;
      } else {
        const curveDist = distance - (2 * straightLength + Math.PI * wheelRadius);
        const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI; // 0 to PI
        y = -halfStraight - Math.sin(theta) * wheelRadius;
        z = wheelRadius - (1 - Math.cos(theta)) * wheelRadius;
        angle = Math.PI + theta;
      }

      arr.push({ position: new THREE.Vector3(0, y, z), rotation: new THREE.Euler(angle, 0, 0) });
    }
    return arr;
  }, [circumference, straightLength, halfStraight, wheelRadius, trackOffset]);

  const magnetRowsCount = 36; // Increased to match tread count so they cover the entire belt
  const magnets = useMemo(() => {
    const arr = [];
    for (let i = 0; i < magnetRowsCount; i++) {
      const baseDist = (i / magnetRowsCount) * circumference;
      let distance = (baseDist - trackOffset) % circumference;
      if (distance < 0) distance += circumference;
      
      let y = 0;
      let z = 0;
      let angle = 0;

      if (distance < straightLength) {
        y = -halfStraight + distance;
        z = -wheelRadius;
        angle = 0; 
      } else if (distance < straightLength + Math.PI * wheelRadius) {
        const curveDist = distance - straightLength;
        const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI;
        y = halfStraight + Math.sin(theta) * wheelRadius;
        z = -wheelRadius + (1 - Math.cos(theta)) * wheelRadius;
        angle = theta;
      } else if (distance < 2 * straightLength + Math.PI * wheelRadius) {
        const topDist = distance - (straightLength + Math.PI * wheelRadius);
        y = halfStraight - topDist;
        z = wheelRadius;
        angle = Math.PI;
      } else {
        const curveDist = distance - (2 * straightLength + Math.PI * wheelRadius);
        const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI;
        y = -halfStraight - Math.sin(theta) * wheelRadius;
        z = wheelRadius - (1 - Math.cos(theta)) * wheelRadius;
        angle = Math.PI + theta;
      }
      
      // Two magnets per row (Left and Right relative to the track width)
      arr.push({
        position: new THREE.Vector3(0, y, z),
        rotation: new THREE.Euler(angle, 0, 0)
      });
    }
    return arr;
  }, [circumference, straightLength, halfStraight, wheelRadius, trackOffset]);

  // Shiny Circular Magnet with countersunk center
  const CircularMagnet = () => (
    <group position={[0, 0, -0.022]}>
      {/* Main metallic disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.008, 32]} />
        <IndustrialMaterial color="#f0f0f0" metalness={1.0} roughness={0.2} bumpScale={0.001} />
      </mesh>
      
      {/* Countersink bevel (slightly darker/tilted) */}
      <mesh position={[0, 0, -0.003]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.012, 0.003, 32]} />
        <IndustrialMaterial color="#999999" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Central hole */}
      <mesh position={[0, 0, -0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.009, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );

  // Aluminum Wheel component matching physical reference
  const renderWheel = (posY: number) => (
    <group position={[0, posY, 0]} rotation={[0, 0, Math.PI / 2]}>
      {/* Main aluminum body */}
      <mesh castShadow>
        <cylinderGeometry args={[wheelRadius * 0.9, wheelRadius * 0.9, trackWidthX * 0.8, 32]} />
        <IndustrialMaterial color="#cccccc" metalness={0.9} roughness={0.3} bumpScale={0.002} />
      </mesh>
      
      {/* Outer face inscribed circle (Outer) */}
      <mesh position={[0, (trackWidthX * 0.8) / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[wheelRadius * 0.55, wheelRadius * 0.58, 32]} />
        <IndustrialMaterial color="#999999" metalness={0.8} roughness={0.5} />
      </mesh>
      
      {/* Inner face inscribed circle (Inside) */}
      <mesh position={[0, -(trackWidthX * 0.8) / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[wheelRadius * 0.55, wheelRadius * 0.58, 32]} />
        <IndustrialMaterial color="#999999" metalness={0.8} roughness={0.5} />
      </mesh>

      {/* Central bore hole (simulated) */}
      <mesh>
        <cylinderGeometry args={[wheelRadius * 0.15, wheelRadius * 0.15, trackWidthX * 0.81, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );

  return (
    <group position={[offsetX, 0, trackHeightZ / 2]}>
      
      {/* 3 Wheels: Front, Center, Rear */}
      {renderWheel(halfStraight)}
      {renderWheel(0)}
      {renderWheel(-halfStraight)}

      {/* Internal Support Frame (adjusted to sit behind the wheels) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[trackWidthX * 0.4, straightLength, wheelRadius * 1.5]} />
        <IndustrialMaterial color="#222222" metalness={0.7} roughness={0.5} bumpScale={0.004} />
      </mesh>

      {/* Track Treads */}
      {treads.map((t, idx) => (
        <group key={`tread-${idx}`} position={t.position as any} rotation={t.rotation as any}>
          <mesh position={[0, 0, -0.01]} castShadow>
            {/* Belt link */}
            <boxGeometry args={[trackWidthX, 0.04, 0.015]} />
            <IndustrialMaterial color="#1a1a1a" metalness={0.3} roughness={0.9} bumpScale={0.005} />
          </mesh>
        </group>
      ))}

      {/* Magnets */}
      {magnets.map((m, idx) => (
        <group key={`magrow-${idx}`} position={m.position as any} rotation={m.rotation as any}>
          {/* Left Circular Magnet */}
          <group position={[-trackWidthX * 0.25, 0, 0]}>
             <CircularMagnet />
          </group>
          {/* Right Circular Magnet */}
          <group position={[trackWidthX * 0.25, 0, 0]}>
             <CircularMagnet />
          </group>
        </group>
      ))}

    </group>
  );
}

export function Tracks() {
  const { trackWidthX, bodyWidthX } = robotConfig;
  const trackOffsetX = bodyWidthX / 2 + trackWidthX / 2;

  return (
    <group>
      <CrawlerTrack side="left" offsetX={-trackOffsetX} />
      <CrawlerTrack side="right" offsetX={trackOffsetX} />
    </group>
  );
}


