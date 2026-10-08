'use client';

import React from 'react';
import { SimulationController } from './SimulationController';
import { useRobotStore } from '@/lib/robotState';
import { useTestShipStore } from '@/lib/state/testShipStore';
import { TwinProvider, TwinState, DigitalTwin as SharedDigitalTwin } from '@titan/digital-twin';
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
    <div className="digital-twin-container w-full h-full min-h-[500px] bg-slate-900">
      <TwinProvider state={twinState}>
        <SharedDigitalTwin>
          <SimulationController />
        </SharedDigitalTwin>
      </TwinProvider>
    </div>
  );
}
