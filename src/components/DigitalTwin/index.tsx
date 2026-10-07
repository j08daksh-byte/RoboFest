'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, ContactShadows } from '@react-three/drei';
import { RobotModel } from './RobotModel';
import { ShipAssembly } from './ShipAssembly';
import { DryDock } from './DryDock';
import { SupplySystem } from './SupplySystem';
import { SafetyCables } from './SafetyCables';
import { HoseSystem } from './HoseSystem';
import { ShipHull } from './ShipHull';
import { CameraController } from './CameraController';
import { SimulationController } from './SimulationController';
import { useRobotStore } from '@/lib/robotState';
import { useTestShipStore } from '@/lib/state/testShipStore';
import { TwinProvider, TwinState } from '../../../packages/digital-twin/src';
export function DigitalTwin() {
  const store = useRobotStore();
  const testShipStore = useTestShipStore();
  
  const twinState: TwinState = {
    position: store.position,
    arm: {
      yPosition: store.arm.yPosition,
      xExtension: store.arm.xExtension
    },
    torch: {
      enabled: store.torch.enabled
    },
    electromagnet: {
      enabled: store.electromagnet.enabled
    },
    trackOffset: store.trackOffset,
    fifthCableLength: store.fifthCableLength,
    cameraTarget: store.cameraTarget,
    cameraFocusTrigger: store.cameraFocusTrigger,
    followMode: store.followMode,
    uiMode: store.uiMode,
    xRayMode: store.xRayMode,
    activeCutPath: store.activeCutPath,
    completedCuts: store.completedCuts.map(cut => ({
      id: cut.id,
      timestamp: typeof cut.timestamp === 'string' ? new Date(cut.timestamp).getTime() : cut.timestamp,
      path: cut.path,
      isClosed: cut.isClosed
    })),
    testShipVisibility: {
      showStructuralLines: testShipStore.showStructuralLines,
      showSurfaceDebug: testShipStore.showSurfaceDebug,
      showSurfaceNormals: testShipStore.showSurfaceNormals,
      showSurfaceTangents: testShipStore.showSurfaceTangents,
      showRobotProxies: testShipStore.showRobotProxies
    }
  };

  return (
    <div className="digital-twin-container">
      <TwinProvider state={twinState}>
        <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#10151a']} />
        <fog attach="fog" args={['#10151a', 200, 800]} />
        
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
        
        
        {/* Robot Integration Layer: Scene-level transform for the unmodified robot */}
        <group position={[50.25, 0, 37.5]} rotation={[0, Math.PI / 2, 0]}>
          <group scale={[5, 5, 5]}>
            <ShipHull />
          </group>
          <SimulationController />
          <RobotModel showAxes={store.uiMode === 'debug'} />
        </group>
        
        {/* Procedural Ship and Industrial Environment */}
        <group scale={[5, 5, 5]}>
          <ShipAssembly />
        </group>
        <DryDock />
        
        {/* Support Infrastructure (using world coordinates) */}
        <SupplySystem />
        <SafetyCables />
        <HoseSystem />
        
        <ContactShadows resolution={2048} scale={1000} blur={2.5} opacity={0.6} far={2} position={[0, -29.9, 0]} />

        {store.uiMode === 'debug' && <Grid position={[0, -29.9, 0]} args={[1000, 1000]} cellColor="#666" sectionColor="#333" fadeDistance={400} />}
      </Canvas>
      </TwinProvider>
    </div>
  );
}
