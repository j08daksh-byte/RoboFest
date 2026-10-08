import React from 'react';
import { TwinState } from './types';
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
export declare function TwinProvider({ state, assetBaseUrl, children }: TwinProviderProps): React.JSX.Element;
export declare function useTwinState(): TwinState;
export declare function useAssetBaseUrl(): string;
