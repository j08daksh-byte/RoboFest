import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { robotConfig } from '../lib/robotConfig';
export function Magnets({ trackLengthY, position }) {
    const { magnetCountPerTrack, magnetRadius, magnetThickness } = robotConfig;
    const magnets = [];
    const startY = -trackLengthY / 2 + 0.05;
    const endY = trackLengthY / 2 - 0.05;
    const step = (endY - startY) / (magnetCountPerTrack - 1);
    for (let i = 0; i < magnetCountPerTrack; i++) {
        const y = startY + i * step;
        magnets.push(_jsxs("group", { position: [0, y, -magnetThickness / 2], rotation: [Math.PI / 2, 0, 0], children: [_jsxs("mesh", { receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [magnetRadius, magnetRadius, magnetThickness, 24] }), _jsx("meshStandardMaterial", { color: "#888", metalness: 0.9, roughness: 0.3 })] }), _jsxs("mesh", { position: [0, magnetThickness / 2 + 0.001, 0], children: [_jsx("cylinderGeometry", { args: [magnetRadius * 0.6, magnetRadius * 0.6, 0.002, 16] }), _jsx("meshStandardMaterial", { color: "#222", metalness: 0.6, roughness: 0.8 })] })] }, i));
    }
    return (_jsx("group", { position: position, children: magnets }));
}
