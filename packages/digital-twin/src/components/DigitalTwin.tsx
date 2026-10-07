// @ts-nocheck
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, ContactShadows } from '@react-three/drei';
import { RobotModel } from './RobotModel';
import { ShipAssembly } from './ShipAssembly';
import { DryDock } from './DryDock';
import { SupplySystem } from './SupplySystem';
import { SafetyCables } from './SafetyCables';
import { HoseSystem } from './HoseSystem';
import { ShipHull } from './ShipHull';
import { CameraController } from './CameraController';
import { useTwinState } from '../TwinProvider';

export function DigitalTwin({ children }: { children?: React.ReactNode }) {
  const { uiMode } = useTwinState();

  return (
    <Canvas shadows dpr={[1, 2]}>
      <color attach="background" args={['#10151a']} />
      <fog attach="fog" args={['#10151a', 200, 800]} />
      
      <CameraController />
      
      <ambientLight intensity={0.4} color="#a0b0c0" />
      <directionalLight 
        position={[40, 50, 40]} 
        intensity={1.5} 
        castShadow 
        color="#fff0dd"
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0005}
      />
      <directionalLight 
        position={[-40, 30, -40]} 
        intensity={0.4} 
        color="#90b0d0" 
      />
      
      <group position={[50.25, 0, 37.5]} rotation={[0, Math.PI / 2, 0]}>
        <group scale={[5, 5, 5]}>
          <ShipHull />
        </group>
        {children}
        <RobotModel showAxes={uiMode === 'debug'} />
      </group>
      
      <group scale={[5, 5, 5]}>
        <ShipAssembly />
      </group>
      <DryDock />
      
      <SupplySystem />
      <SafetyCables />
      <HoseSystem />
      
      <ContactShadows resolution={2048} scale={1000} blur={2.5} opacity={0.6} far={2} position={[0, -29.9, 0]} />

      {uiMode === 'debug' && <Grid position={[0, -29.9, 0]} args={[1000, 1000]} cellColor="#666" sectionColor="#333" fadeDistance={400} />}
    </Canvas>
  );
}

