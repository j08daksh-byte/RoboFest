import React, { createContext, useContext } from 'react';
import { TwinState } from './types';

const TwinContext = createContext<TwinState | null>(null);
const AssetContext = createContext<string>('');

export interface TwinProviderProps {
  state: TwinState;
  assetBaseUrl?: string;
  children: React.ReactNode;
}

/**
 * TwinProvider establishes the generic read-only state boundary for the 3D Digital Twin.
 * The underlying 3D components will consume this context instead of Zustand or Redux,
 * allowing the Twin to be hosted by either the RoboFest operational engine or the
 * Senior real-time presentation shell.
 */
export function TwinProvider({ state, assetBaseUrl = '', children }: TwinProviderProps) {
  return (
    <AssetContext.Provider value={assetBaseUrl}>
      <TwinContext.Provider value={state}>
        {children}
      </TwinContext.Provider>
    </AssetContext.Provider>
  );
}

export function useTwinState(): TwinState {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error('useTwinState must be used within a TwinProvider');
  }
  return context;
}

export function useAssetBaseUrl(): string {
  return useContext(AssetContext);
}
