import React, { useState, useEffect } from 'react';
import { RobotModel as OriginalRobotModel } from '../DigitalTwin/RobotModel';
import { RobotAssembly as NewRobotAssembly } from './RobotAssembly';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function CameraUpdater({ preset }: { preset: string }) {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    let pos = new THREE.Vector3(2, 2, 2);
    let target = new THREE.Vector3(0, 1.5, 0); // Focus on new assembly

    switch (preset) {
      case 'LEFT': pos.set(0, -3, 1.5); break;
      case 'RIGHT': pos.set(0, 3, 1.5); break;
      case 'FRONT': pos.set(3, 0, 1.5); break;
      case 'REAR': pos.set(-3, 0, 1.5); break;
      case 'TOP': pos.set(0, 0, 4); target.set(0, 1.5, 0); break;
      case '3/4': pos.set(2, -2, 2); break;
    }

    camera.position.copy(pos);
    if (controls && (controls as any).target) {
      (controls as any).target.copy(target);
      (controls as any).update();
    } else {
      camera.lookAt(target);
    }
  }, [preset, camera, controls]);

  return null;
}

export function RobotModelLab({ preset = '3/4' }: { preset?: string }) {
  return (
    <group>
      {/* Original Baseline Reference */}
      <group position={[0, -1, 0]}>
        {/* We wrap original in a group. Original moves based on robotStore. 
            For the lab, it might be tied to store (which is at origin if no mission). 
            We rotate original -90 deg on Z to make it point along X, matching new convention.
        */}
        <group rotation={[0, 0, -Math.PI / 2]}>
          <OriginalRobotModel showAxes={true} />
        </group>
        <Text position={[0, -0.6, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.1} color="white">
          CURRENT DIGITAL TWIN BASELINE
        </Text>
      </group>

      {/* New Component Architecture Assembly */}
      <group position={[0, 1.5, 0]}>
        <NewRobotAssembly />
        <Text position={[0, -0.6, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.1} color="#44ffaa">
          ROBOT MODEL LAB (NEW ARCHITECTURE)
        </Text>
        <Text position={[0, -0.8, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.06} color="#cccccc">
          6 TRANSMISSION CRAWLER
        </Text>
        <Text position={[0, -0.9, 0.5]} rotation={[Math.PI/2, Math.PI, 0]} fontSize={0.05} color="#cccccc">
          3 LEFT / 3 RIGHT
        </Text>
      </group>
      <CameraUpdater preset={preset} />
    </group>
  );
}

// In the page.tsx, we can't easily put HTML buttons here unless we wrap it in Html from drei, 
// but we can export the buttons from a separate component or just lift state up.
// Actually, let's render the buttons using Html from @react-three/drei.
export function LabUI({ setPreset }: { setPreset: (p: string) => void }) {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
      {['LEFT', 'RIGHT', 'FRONT', 'REAR', 'TOP', '3/4'].map(p => (
        <button 
          key={p} 
          onClick={() => setPreset(p)}
          style={{ padding: '8px 12px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
        >
          {p} SIDE
        </button>
      ))}
    </div>
  );
}
