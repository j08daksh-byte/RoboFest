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
  uiMode: 'debug' | 'presentation';
  xRayMode: boolean;
  activeCutPath: Array<{ x: number; y: number }>;
  completedCuts: Array<{
    path: Array<{ x: number; y: number }>;
    isClosed: boolean;
  }>;
}
