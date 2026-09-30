import { create } from 'zustand';

export interface TestShipState {
  showSurfaceDebug: boolean;
  showStructuralLines: boolean;
  showSurfaceNormals: boolean;
  showSurfaceTangents: boolean;
  showRobotProxies: boolean;

  setToggles: (toggles: Partial<TestShipState>) => void;
}

export const useTestShipStore = create<TestShipState>((set) => ({
  showSurfaceDebug: false,
  showStructuralLines: true,
  showSurfaceNormals: false,
  showSurfaceTangents: false,
  showRobotProxies: true,

  setToggles: (toggles) => set((state) => ({ ...state, ...toggles })),
}));
