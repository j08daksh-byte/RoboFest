import React, { useMemo } from 'react';
import * as THREE from 'three';
import { robotConfig } from '@/lib/robotConfig';
import { useRobotStore } from '@/lib/robotState';

function CrawlerTrack({ side, offsetX }: { side: 'left' | 'right'; offsetX: number }) {
  const { trackWidthX, trackLengthY, trackHeightZ } = robotConfig;
  const trackOffset = useRobotStore(state => state.trackOffset);
  
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

  const magnetRowsCount = 14; 
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
      const xOffsetMag = trackWidthX * 0.25;

      arr.push({
        positionLeft: new THREE.Vector3(-xOffsetMag, y, z),
        positionRight: new THREE.Vector3(xOffsetMag, y, z),
        rotation: new THREE.Euler(angle, 0, 0)
      });
    }
    return arr;
  }, [circumference, straightLength, halfStraight, wheelRadius, trackWidthX, trackOffset]);

  return (
    <group position={[offsetX, 0, trackHeightZ / 2]}>
      
      {/* Drive Wheel (Front / +Y) */}
      <mesh position={[0, halfStraight, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[wheelRadius * 0.9, wheelRadius * 0.9, trackWidthX * 0.8, 24]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      
      {/* Idler Wheel (Rear / -Y) */}
      <mesh position={[0, -halfStraight, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[wheelRadius * 0.9, wheelRadius * 0.9, trackWidthX * 0.8, 24]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Internal Support Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[trackWidthX * 0.7, straightLength, wheelRadius * 1.5]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Track Treads */}
      {treads.map((t, idx) => (
        <group key={`tread-${idx}`} position={t.position} rotation={t.rotation}>
          <mesh position={[0, 0, -0.01]} castShadow>
            {/* Belt link */}
            <boxGeometry args={[trackWidthX, 0.04, 0.015]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, -0.02]} castShadow>
            {/* Outer grip ridge */}
            <boxGeometry args={[trackWidthX * 0.9, 0.015, 0.01]} />
            <meshStandardMaterial color="#050505" roughness={1.0} />
          </mesh>
        </group>
      ))}

      {/* Magnets */}
      {magnets.map((m, idx) => (
        <group key={`magrow-${idx}`} rotation={m.rotation}>
          {/* Left Magnet in this row */}
          <group position={m.positionLeft}>
             <mesh position={[0, 0, -0.025]} castShadow>
                {/* Rectangular metallic base */}
                <boxGeometry args={[0.04, 0.05, 0.015]} />
                <meshStandardMaterial color="#555" metalness={0.9} roughness={0.4} />
             </mesh>
             <mesh position={[0, 0, -0.035]} castShadow>
                {/* Dark magnetic core block */}
                <boxGeometry args={[0.03, 0.04, 0.005]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
             </mesh>
          </group>
          {/* Right Magnet in this row */}
          <group position={m.positionRight}>
             <mesh position={[0, 0, -0.025]} castShadow>
                <boxGeometry args={[0.04, 0.05, 0.015]} />
                <meshStandardMaterial color="#555" metalness={0.9} roughness={0.4} />
             </mesh>
             <mesh position={[0, 0, -0.035]} castShadow>
                <boxGeometry args={[0.03, 0.04, 0.005]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
             </mesh>
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
