import React, { createContext, useContext } from 'react';
import { TwinState } from './types';

const TwinContext = createContext<TwinState | null>(null);

export interface TwinProviderProps {
  state: TwinState;
  children: React.ReactNode;
}

/**
 * TwinProvider establishes the generic read-only state boundary for the 3D Digital Twin.
 * The underlying 3D components will consume this context instead of Zustand or Redux,
 * allowing the Twin to be hosted by either the RoboFest operational engine or the
 * Senior real-time presentation shell.
 */
export function TwinProvider({ state, children }: TwinProviderProps) {
  return (
    <TwinContext.Provider value={state}>
      {children}
    </TwinContext.Provider>
  );
}

export function useTwinState(): TwinState {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error('useTwinState must be used within a TwinProvider');
  }
  return context;
}
