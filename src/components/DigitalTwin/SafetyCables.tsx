import React from 'react';
import * as THREE from 'three';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';

export function getRobotWorldPosition(localPos: {x: number, y: number, z: number}) {
  return new THREE.Vector3(
    10.05 + localPos.z,
    localPos.y,
    7.5 - localPos.x
  );
}

export function CatenaryCable({ start, end, sag, color = "#222", thickness = 0.02 }: { start: THREE.Vector3, end: THREE.Vector3, sag: number, color?: string, thickness?: number }) {
  const midPoint = new THREE.Vector3(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    (start.z + end.z) / 2 - Math.abs(sag)
  );
  if (sag < 0) {
     midPoint.z = Math.min(start.z, end.z) + sag;
  }
  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 32, thickness, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.7} />
    </mesh>
  );
}

export function PulleySystem({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 0.4, 0.04]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.1, 0.08]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.2]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      <mesh position={[0, -0.2, 0.12]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function SafetyCables() {
  const { position } = useRobotStore();
  const worldPos = getRobotWorldPosition(position);

  const mastX = 14;
  const mastZBase = -2;
  const mastZTop = 20; 
  const mastHeight = mastZTop - mastZBase;
  const mastY = worldPos.y; // Mast moves along rail to track robot

  const boomEndX = mastX - 5.5; // X = 8.5
  const boomEndZ = mastZTop - 0.8;
  
  const boomPoint1 = new THREE.Vector3(boomEndX, mastY - 0.2, boomEndZ);
  const boomPoint2 = new THREE.Vector3(boomEndX, mastY + 0.2, boomEndZ);
  const boomPoint3 = new THREE.Vector3(boomEndX + 0.3, mastY, boomEndZ);
  
  // Cable 4 (Lateral Support Cable) originates from a distinct lateral mounting arm
  const lateralBoomPoint = new THREE.Vector3(boomEndX - 1.0, mastY, boomEndZ + 0.5);

  const rWidth = robotConfig.bodyWidthX; 
  const rLen = robotConfig.bodyLengthY;  
  const rHeight = robotConfig.trackHeightZ + robotConfig.bodyHeightZ;
  
  const corner1 = getRobotWorldPosition({ x: position.x - rWidth/2, y: position.y - rLen/2, z: position.z + rHeight });
  const corner2 = getRobotWorldPosition({ x: position.x + rWidth/2, y: position.y - rLen/2, z: position.z + rHeight });
  const corner3 = getRobotWorldPosition({ x: position.x - rWidth/2, y: position.y + rLen/2, z: position.z + rHeight });
  const corner4 = getRobotWorldPosition({ x: position.x + rWidth/2, y: position.y + rLen/2, z: position.z + rHeight });

  return (
    <group>
      {/* Heavy Industrial Support Mast */}
      <group position={[mastX, mastY, mastZBase]}>
        {/* Main Column */}
        <mesh position={[0, 0, mastHeight / 2]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, mastHeight]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 0.4]} />
          <meshStandardMaterial color="#1a1c1e" metalness={0.9} roughness={0.6} />
        </mesh>
        {/* Base Bracing */}
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rot, i) => (
          <mesh key={i} position={[Math.cos(rot)*0.7, Math.sin(rot)*0.7, 1.5]} rotation={[0, 0, rot]} castShadow>
            <mesh position={[0, 0, 0]} rotation={[0, -Math.PI/6, 0]}>
              <boxGeometry args={[0.2, 0.2, 3]} />
              <meshStandardMaterial color="#e67e22" metalness={0.7} />
            </mesh>
          </mesh>
        ))}
        {/* Boom */}
        <mesh position={[-3, 0, mastHeight - 0.4]} castShadow receiveShadow>
          <boxGeometry args={[6.8, 0.6, 0.8]} />
          <meshStandardMaterial color="#f39c12" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Sheaves */}
        <group position={[-5.5, 0, mastHeight - 0.8]}>
          <mesh rotation={[Math.PI/2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
            <meshStandardMaterial color="#111" roughness={0.8} />
          </mesh>
          {/* Lateral support arm for Cable 4 */}
          <mesh position={[-0.5, 0, 1.0]} castShadow>
            <boxGeometry args={[1.5, 0.2, 0.2]} />
            <meshStandardMaterial color="#f39c12" metalness={0.7} />
          </mesh>
        </group>
      </group>

      {/* 4 Support Cables */}
      <CatenaryCable start={boomPoint1} end={corner1} sag={0.2} color="#333" thickness={0.015} />
      <CatenaryCable start={boomPoint2} end={corner2} sag={0.2} color="#333" thickness={0.015} />
      <CatenaryCable start={boomPoint3} end={corner3} sag={0.15} color="#444" thickness={0.012} />
      
      {/* Cable 4: Lateral Positioning Cable */}
      <CatenaryCable start={lateralBoomPoint} end={corner4} sag={0.05} color="#e67e22" thickness={0.025} />
    </group>
  );
}
