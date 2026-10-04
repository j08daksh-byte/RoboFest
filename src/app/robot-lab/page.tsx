'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { RobotModelLab, LabUI } from '@/components/RobotModelLab';

export default function RobotLabPage() {
  const [preset, setPreset] = React.useState('3/4');
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        color: 'white',
        fontFamily: 'sans-serif',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '8px'
      }}>
        <h2>ROBOT MODEL LAB</h2>
        <p style={{ fontSize: '14px', color: '#ccc' }}>Protected Environment for Visual & Mechanical Refinement</p>
      </div>

      <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        
        {/* Basic Studio Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        
        {/* Infinite Grid for scale reference */}
        <Grid infiniteGrid fadeDistance={10} cellColor="#555" sectionColor="#888" sectionSize={1} cellSize={0.1} position={[0, -0.01, 0]} />

        {/* 
          Coordinate Axes: 
          Red: X (Longitudinal in our new system)
          Green: Y (Lateral)
          Blue: Z (Vertical)
        */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <RobotModelLab preset={preset} />
        </group>

        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
      <LabUI setPreset={setPreset} />
    </div>
  );
}
