import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTwinState } from '../TwinProvider';
import { getRobotWorldPosition } from './SafetyCables';
export function SupplySystem() {
    const { position } = useTwinState();
    const worldPos = getRobotWorldPosition(position);
    // Gas cylinders beside the mast
    const mastX = 95; // Match SafetyCables mast
    const mastZBase = -2;
    const rackX = mastX + 1.2;
    const rackY = worldPos.y - 1.5;
    const rackZ = mastZBase;
    // Removed 5th cable coordinates
    // 5th cable mechanism removed
    return (_jsx("group", { children: _jsxs("group", { position: [rackX, rackY, rackZ], children: [_jsxs("mesh", { position: [0, 0, 0.1], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [1.2, 0.8, 0.2] }), _jsx("meshStandardMaterial", { color: "#2d333b", metalness: 0.8, roughness: 0.3 })] }), _jsxs("mesh", { position: [0, -0.3, 0.8], castShadow: true, children: [_jsx("boxGeometry", { args: [1.2, 0.05, 1.6] }), _jsx("meshStandardMaterial", { color: "#555", metalness: 0.6 })] }), _jsxs("mesh", { position: [0, 0.3, 0.8], castShadow: true, children: [_jsx("boxGeometry", { args: [1.2, 0.05, 1.6] }), _jsx("meshStandardMaterial", { color: "#555", metalness: 0.6 })] }), _jsxs("group", { position: [-0.3, 0, 0.2], rotation: [Math.PI / 2, 0, 0], children: [_jsxs("mesh", { castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.2, 0.2, 1.8, 32] }), _jsx("meshStandardMaterial", { color: "#005500", metalness: 0.5, roughness: 0.6 })] }), _jsxs("mesh", { position: [0, 0.9, 0], castShadow: true, children: [_jsx("sphereGeometry", { args: [0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2] }), _jsx("meshStandardMaterial", { color: "#005500", metalness: 0.5, roughness: 0.6 })] }), _jsxs("mesh", { position: [0, 1.1, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.04, 0.04, 0.08] }), _jsx("meshStandardMaterial", { color: "#b5a642", metalness: 0.9, roughness: 0.2 })] })] }), _jsxs("group", { position: [0.3, 0, 0.2], rotation: [Math.PI / 2, 0, 0], children: [_jsxs("mesh", { castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.2, 0.2, 1.6, 32] }), _jsx("meshStandardMaterial", { color: "#b30000", metalness: 0.5, roughness: 0.6 })] }), _jsxs("mesh", { position: [0, 0.8, 0], castShadow: true, children: [_jsx("sphereGeometry", { args: [0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2] }), _jsx("meshStandardMaterial", { color: "#b30000", metalness: 0.5, roughness: 0.6 })] }), _jsxs("mesh", { position: [0, 0.95, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.04, 0.04, 0.08] }), _jsx("meshStandardMaterial", { color: "#b5a642", metalness: 0.9, roughness: 0.2 })] })] })] }) }));
}
