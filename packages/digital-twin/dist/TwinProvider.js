import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const TwinContext = createContext(null);
const AssetContext = createContext('');
/**
 * TwinProvider establishes the generic read-only state boundary for the 3D Digital Twin.
 * The underlying 3D components will consume this context instead of Zustand or Redux,
 * allowing the Twin to be hosted by either the RoboFest operational engine or the
 * Senior real-time presentation shell.
 */
export function TwinProvider({ state, assetBaseUrl = '', children }) {
    return (_jsx(AssetContext.Provider, { value: assetBaseUrl, children: _jsx(TwinContext.Provider, { value: state, children: children }) }));
}
export function useTwinState() {
    const context = useContext(TwinContext);
    if (!context) {
        throw new Error('useTwinState must be used within a TwinProvider');
    }
    return context;
}
export function useAssetBaseUrl() {
    return useContext(AssetContext);
}
