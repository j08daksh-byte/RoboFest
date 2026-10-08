import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTwinState } from '../TwinProvider';
function Crane() {
    const { xRayMode } = useTwinState();
    // A large portal crane spanning the dry dock
    return (_jsxs("group", { position: [0, -30, 40], children: [_jsxs("mesh", { position: [-60, 40, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [4, 80, 8] }), _jsx("meshStandardMaterial", { color: "#c23b22", metalness: 0.7, roughness: 0.4 })] }), _jsxs("mesh", { position: [60, 40, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [4, 80, 8] }), _jsx("meshStandardMaterial", { color: "#c23b22", metalness: 0.7, roughness: 0.4 })] }), _jsxs("mesh", { position: [0, 80, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [124, 6, 8] }), _jsx("meshStandardMaterial", { color: "#b32d18", metalness: 0.6, roughness: 0.5 })] }), _jsxs("mesh", { position: [10, 83, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [8, 4, 10] }), _jsx("meshStandardMaterial", { color: "#ffcc00", metalness: 0.8, roughness: 0.3 })] }), _jsxs("mesh", { position: [10, 41.5, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.05, 0.05, 75] }), _jsx("meshStandardMaterial", { color: "#111" })] }), _jsxs("mesh", { position: [10, 4, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [2, 3, 2] }), _jsx("meshStandardMaterial", { color: "#ffcc00" })] })] }));
}
function DryDockWalls() {
    return (_jsxs("group", { position: [0, -30, 0], children: [_jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [300, 300] }), _jsx("meshStandardMaterial", { color: "#555a5e", roughness: 0.9, metalness: 0.1 })] }), _jsxs("mesh", { position: [0, 0.05, 20], rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [120, 40] }), _jsx("meshStandardMaterial", { color: "#4a4e52", roughness: 1.0, metalness: 0.0 })] }), _jsxs("mesh", { position: [-80, 20, 0], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [4, 40, 300] }), _jsx("meshStandardMaterial", { color: "#7a7f85", roughness: 0.95 })] }), _jsxs("mesh", { position: [80, 20, 0], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [4, 40, 300] }), _jsx("meshStandardMaterial", { color: "#7a7f85", roughness: 0.95 })] }), _jsxs("mesh", { position: [0, 20, -150], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [156, 40, 4] }), _jsx("meshStandardMaterial", { color: "#7a7f85", roughness: 0.95 })] })] }));
}
function Scaffolding() {
    const { xRayMode } = useTwinState();
    const floors = 6;
    const sections = 8;
    const w = 4;
    const h = 4;
    const d = 4;
    const nodes = [];
    for (let f = 0; f < floors; f++) {
        for (let s = 0; s < sections; s++) {
            nodes.push(_jsxs("group", { position: [s * w, f * h, 0], children: [_jsxs("mesh", { position: [w / 2, h / 2, 0], receiveShadow: true, castShadow: !xRayMode, children: [_jsx("cylinderGeometry", { args: [0.05, 0.05, h] }), _jsx("meshStandardMaterial", { color: "#b3b8bc", metalness: 0.8, roughness: 0.4 })] }), _jsxs("mesh", { position: [0, h / 2, d / 2], rotation: [0, 0, Math.PI / 2], receiveShadow: true, castShadow: !xRayMode, children: [_jsx("cylinderGeometry", { args: [0.05, 0.05, w] }), _jsx("meshStandardMaterial", { color: "#b3b8bc", metalness: 0.8, roughness: 0.4 })] }), f > 0 && (_jsxs("mesh", { position: [w / 2, 0, d / 2], receiveShadow: true, castShadow: !xRayMode, children: [_jsx("boxGeometry", { args: [w, 0.1, d] }), _jsx("meshStandardMaterial", { color: "#8b5a2b", roughness: 0.9 })] }))] }, `scaff-${f}-${s}`));
        }
    }
    return (_jsx("group", { position: [-15, -30, 25], children: nodes }));
}
export function ShipyardEnvironment() {
    return (_jsxs("group", { children: [_jsx(DryDockWalls, {}), _jsx(Crane, {}), _jsx(Scaffolding, {}), _jsxs("group", { position: [40, -30, 30], children: [_jsxs("mesh", { position: [0, 1.5, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [3, 3, 6] }), _jsx("meshStandardMaterial", { color: "#1f4c73", roughness: 0.7 })] }), _jsxs("mesh", { position: [4, 1.5, 2], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [3, 3, 6] }), _jsx("meshStandardMaterial", { color: "#7a2d2d", roughness: 0.7 })] }), _jsxs("mesh", { position: [0, 4.5, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [3, 3, 6] }), _jsx("meshStandardMaterial", { color: "#c27a22", roughness: 0.7 })] })] }), _jsx("pointLight", { position: [-40, 10, 10], intensity: 1.5, distance: 100, color: "#ffebcc" }), _jsx("pointLight", { position: [40, 10, 10], intensity: 1.5, distance: 100, color: "#ffebcc" }), _jsx("pointLight", { position: [0, 50, 40], intensity: 1.0, distance: 150, color: "#e0f7fa" })] }));
}
