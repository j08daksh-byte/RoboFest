import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text, Billboard } from '@react-three/drei';
import { useTwinState } from '../TwinProvider';
export function CoordinateAxes() {
    const { uiMode } = useTwinState();
    if (uiMode === 'presentation')
        return null;
    return (_jsxs("group", { position: [0, 0, 0], children: [_jsxs("mesh", { position: [0.5, 0, 0], children: [_jsx("boxGeometry", { args: [1, 0.01, 0.01] }), _jsx("meshBasicMaterial", { color: "#ff4444" })] }), _jsx(Billboard, { position: [1.1, 0, 0], children: _jsx(Text, { color: "#ff8888", fontSize: 0.08, outlineWidth: 0.005, outlineColor: "#000", children: "+X (ARM EXTENSION)" }) }), _jsxs("mesh", { position: [0, 0.5, 0], children: [_jsx("boxGeometry", { args: [0.01, 1, 0.01] }), _jsx("meshBasicMaterial", { color: "#44ff44" })] }), _jsx(Billboard, { position: [0, 1.1, 0], children: _jsx(Text, { color: "#88ff88", fontSize: 0.08, outlineWidth: 0.005, outlineColor: "#000", children: "+Y (VERTICAL / UP)" }) }), _jsxs("mesh", { position: [0, 0, 0.5], children: [_jsx("boxGeometry", { args: [0.01, 0.01, 1] }), _jsx("meshBasicMaterial", { color: "#4444ff" })] }), _jsx(Billboard, { position: [0, 0, 1.1], children: _jsx(Text, { color: "#8888ff", fontSize: 0.08, outlineWidth: 0.005, outlineColor: "#000", children: "+Z (OUTWARD)" }) }), _jsx(Billboard, { position: [0, 0, -0.5], children: _jsx(Text, { color: "#44ffff", fontSize: 0.08, outlineWidth: 0.005, outlineColor: "#000", children: "-Z (TOWARD HULL / TORCH)" }) })] }));
}
