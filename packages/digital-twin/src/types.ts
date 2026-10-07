export interface TwinState {
  position: { x: number; y: number; z: number };
  arm: {
    yPosition: number;
    xExtension: number;
  };
  torch: {
    enabled: boolean;
  };
  electromagnet: {
    enabled: boolean;
  };
  trackOffset: number;
  fifthCableLength: number;
  cameraTarget: 'robot' | 'cut' | 'ship' | 'free' | 'starboard' | 'port' | 'front' | 'rear';
  cameraFocusTrigger: number;
  followMode: boolean;
  uiMode: 'debug' | 'presentation';
  xRayMode: boolean;
  activeCutPath: Array<{ x: number; y: number }>;
  completedCuts: Array<{
    id: string;
    timestamp: number;
    path: Array<{ x: number; y: number }>;
    isClosed: boolean;
  }>;
  testShipVisibility: {
    showStructuralLines: boolean;
    showSurfaceDebug: boolean;
    showSurfaceNormals: boolean;
    showSurfaceTangents: boolean;
    showRobotProxies: boolean;
  };
}
