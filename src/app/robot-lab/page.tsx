'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { RobotModelLab } from '@/components/RobotModelLab';

export default function RobotLabPage() {
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
          Red: X (Lateral in old config, intended as Longitudinal)
          Green: Y (Vertical / Up) in Three.js, but our system uses Z=Vertical. Wait. Three.js uses Y=Up.
          We need to rotate our assembly if Z=Up.
        */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <RobotModelLab />
        </group>

        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
