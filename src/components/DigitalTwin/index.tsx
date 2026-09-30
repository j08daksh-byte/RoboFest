'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Grid, ContactShadows } from '@react-three/drei';
import { RobotModel } from './RobotModel';
import { ShipHull } from './ShipHull';
import { SupplySystem } from './SupplySystem';
import { SafetyCables } from './SafetyCables';
import { HoseSystem } from './HoseSystem';
import { CameraController } from './CameraController';
import { SimulationController } from './SimulationController';
import { useRobotStore } from '@/lib/robotState';

import { ShipyardEnvironment } from './ShipyardEnvironment';

export function DigitalTwin() {
  const [cameraView, setCameraView] = React.useState<'overview' | 'isometric' | 'presentation' | 'hull' | 'side' | 'bottom' | 'closeupTrack' | 'closeupArm' | 'closeupTorch' | 'cutting' | 'robot' | 'cut' | 'ship'>('presentation');
  const uiMode = useRobotStore((state) => state.uiMode);

  return (
    <div className="digital-twin-container">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#10151a']} />
        <fog attach="fog" args={['#10151a', 50, 250]} />
        
        <SimulationController />
        <CameraController />
        
        {/* Adjusted atmospheric lighting */}
        <ambientLight intensity={0.4} color="#a0b0c0" />
        <directionalLight 
          position={[40, 50, 40]} 
          intensity={1.5} 
          castShadow 
          color="#fff0dd"
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0005}
        />
        {/* Soft fill light from opposite side */}
        <directionalLight 
          position={[-40, 30, -40]} 
          intensity={0.4} 
          color="#90b0d0" 
        />
        
        <RobotModel showAxes={uiMode === 'debug'} />
        <ShipHull />
        <ShipyardEnvironment />
        <SupplySystem />
        <SafetyCables />
        <HoseSystem />
        
        <ContactShadows resolution={2048} scale={100} blur={2.5} opacity={0.6} far={2} position={[0, -29.9, 0]} />

        {uiMode === 'debug' && <Grid position={[0, -29.9, 0]} args={[100, 100]} cellColor="#666" sectionColor="#333" fadeDistance={100} />}
        
        <Environment preset="warehouse" background={false} environmentIntensity={0.5} />
      </Canvas>
    </div>
  );
}
