import React from 'react';
import * as THREE from 'three';
import { useRobotStore } from '@/lib/robotState';
import { robotConfig } from '@/lib/robotConfig';

export function CatenaryCable({ start, end, sag, color = "#666", thickness = 0.005 }: { start: THREE.Vector3, end: THREE.Vector3, sag: number, color?: string, thickness?: number }) {
  const midPoint = new THREE.Vector3(
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    (start.z + end.z) / 2 - sag
  );

  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 32, thickness, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
    </mesh>
  );
}

function AnchorBracket({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* Heavy wall mounting plate */}
      <mesh position={[0, 0, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[0.2, 0.2, 0.04]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* Eyelet / Shackle base */}
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.06]} />
        <meshStandardMaterial color="#555" metalness={0.9} />
      </mesh>
      {/* Ring */}
      <mesh position={[0, -0.05, 0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.03, 0.01, 8, 16]} />
        <meshStandardMaterial color="#888" metalness={0.9} />
      </mesh>
    </group>
  );
}

export function PulleySystem({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* Heavy Pulley Mount Bracket */}
      <mesh position={[0, 0, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 0.4, 0.04]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* Pulley Housing Arm */}
      <mesh position={[0, -0.1, 0.08]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.2]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      {/* Pulley Wheel */}
      <mesh position={[0, -0.2, 0.12]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function SafetyCables() {
  const { position } = useRobotStore();
  const { bodyWidthX, bodyLengthY, trackHeightZ, bodyHeightZ } = robotConfig;
  
  // Robot base coordinates
  const rx = position.x;
  const ry = position.y;
  const rz = position.z;

  const chassisTopZ = rz + trackHeightZ / 2 + bodyHeightZ;
  
  // Robot Anchor Points (4 corners of chassis)
  const rTopLeft = new THREE.Vector3(rx - bodyWidthX / 2 + 0.02, ry + bodyLengthY / 2 - 0.02, chassisTopZ);
  const rTopRight = new THREE.Vector3(rx + bodyWidthX / 2 - 0.02, ry + bodyLengthY / 2 - 0.02, chassisTopZ);
  const rBottomLeft = new THREE.Vector3(rx - bodyWidthX / 2 + 0.02, ry - bodyLengthY / 2 + 0.02, chassisTopZ);
  const rBottomRight = new THREE.Vector3(rx + bodyWidthX / 2 - 0.02, ry - bodyLengthY / 2 + 0.02, chassisTopZ);
  
  // Safety Tower Anchor Points (Independent tower beside the ship)
  const mastX = -12;
  const mastZ = 12;
  const mastYBase = -30;
  const mastYTop = 8;
  const mastHeight = mastYTop - mastYBase;
  const towerBase = new THREE.Vector3(mastX, mastYBase, mastZ);
  
  const anchorTL = new THREE.Vector3(mastX, 6, mastZ);
  const anchorTR = new THREE.Vector3(mastX, 7, mastZ);
  const anchorBL = new THREE.Vector3(mastX, 5, mastZ);
  const anchorBR = new THREE.Vector3(mastX, 4, mastZ);

  return (
    <group>
      {/* Industrial Safety Mast */}
      <group position={towerBase}>
        {/* Main Vertical Structural Column (Square tube) */}
        <mesh position={[0, mastHeight / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, mastHeight, 0.4]} />
          <meshStandardMaterial color="#1a1c1e" metalness={0.8} roughness={0.6} />
        </mesh>
        
        {/* Mast Base Plate */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.5, 0.2, 1.5]} />
          <meshStandardMaterial color="#111" metalness={0.7} roughness={0.8} />
        </mesh>
        {/* Base Gussets / Reinforcements */}
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rot, i) => (
          <mesh key={`gusset-${i}`} position={[Math.cos(rot)*0.4, 0.6, Math.sin(rot)*0.4]} rotation={[0, rot, 0]} castShadow>
             <boxGeometry args={[0.6, 1.0, 0.05]} />
             <meshStandardMaterial color="#1a1c1e" />
          </mesh>
        ))}

        {/* Top Anchor Bracket / Cap */}
        <mesh position={[0, mastHeight, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#cc4400" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>

      {/* 4 Fall Arrest Safety Cables (Industrial Steel) */}
      <CatenaryCable start={anchorTL} end={rTopLeft} sag={1.5} color="#888" thickness={0.008} />
      <CatenaryCable start={anchorTR} end={rTopRight} sag={1.5} color="#888" thickness={0.008} />
      <CatenaryCable start={anchorBL} end={rBottomLeft} sag={2.5} color="#888" thickness={0.008} />
      <CatenaryCable start={anchorBR} end={rBottomRight} sag={2.5} color="#888" thickness={0.008} />
      
      {/* Visual hardware at robot attachments */}
      {[rTopLeft, rTopRight, rBottomLeft, rBottomRight].map((pos, idx) => (
        <group key={`rob-anch-${idx}`} position={pos}>
          {/* U-Bolt / bracket on robot */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.02, 0.008, 8, 16]} />
            <meshStandardMaterial color="#666" metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
