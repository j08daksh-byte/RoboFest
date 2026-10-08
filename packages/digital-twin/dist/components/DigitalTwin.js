import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function DigitalTwin({ children }) {
    const { uiMode } = useTwinState();
    return (_jsxs(Canvas, { shadows: true, dpr: [1, 2], children: [_jsx("color", { attach: "background", args: ['#10151a'] }), _jsx("fog", { attach: "fog", args: ['#10151a', 200, 800] }), _jsx(CameraController, {}), _jsx("ambientLight", { intensity: 0.4, color: "#a0b0c0" }), _jsx("directionalLight", { position: [40, 50, 40], intensity: 1.5, castShadow: true, color: "#fff0dd", "shadow-mapSize": [2048, 2048], "shadow-bias": -0.0005 }), _jsx("directionalLight", { position: [-40, 30, -40], intensity: 0.4, color: "#90b0d0" }), _jsxs("group", { position: [50.25, 0, 37.5], rotation: [0, Math.PI / 2, 0], children: [_jsx("group", { scale: [5, 5, 5], children: _jsx(ShipHull, {}) }), children, _jsx(RobotModel, { showAxes: uiMode === 'debug' })] }), _jsx("group", { scale: [5, 5, 5], children: _jsx(ShipAssembly, {}) }), _jsx(DryDock, {}), _jsx(SupplySystem, {}), _jsx(SafetyCables, {}), _jsx(HoseSystem, {}), _jsx(ContactShadows, { resolution: 2048, scale: 1000, blur: 2.5, opacity: 0.6, far: 2, position: [0, -29.9, 0] }), uiMode === 'debug' && _jsx(Grid, { position: [0, -29.9, 0], args: [1000, 1000], cellColor: "#666", sectionColor: "#333", fadeDistance: 400 })] }));
}
