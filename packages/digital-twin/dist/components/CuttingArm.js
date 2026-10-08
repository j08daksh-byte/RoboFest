import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';
import { Torch } from './Torch';
import { IndustrialMaterial } from './IndustrialMaterial';
export function CuttingArm() {
    const { structureHeightZ, structureWidthX, bodyWidthX, armThickness, torchOffsetZ, trackHeightZ } = robotConfig;
    const { arm: { yPosition, xExtension } } = useTwinState();
    // The arm is mounted on top of the upper structure.
    const armZ = trackHeightZ + structureHeightZ + 0.04; // 0.04 is the deck thickness
    // Rail mounted on top of the upper structure
    // Calculate dynamic torch offset to keep the torch touching the curved hull
    const torchLocalX = structureWidthX / 2 + xExtension;
    const { hullRadius } = robotConfig;
    const curvatureDrop = hullRadius - hullRadius * Math.cos(torchLocalX / hullRadius);
    const dynamicTorchOffset = torchOffsetZ + curvatureDrop;
    return (_jsxs("group", { position: [0, yPosition, armZ], children: [_jsxs("mesh", { position: [structureWidthX / 2 - 0.08, 0, 0.06], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.16, 0.25, 0.12] }), _jsx(IndustrialMaterial, { color: "#707070", metalness: 0.6, roughness: 0.4 })] }), _jsxs("mesh", { position: [structureWidthX / 2 - 0.08, 0, 0.12], receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.18, 0.15, 0.02] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.7, roughness: 0.3 })] }), _jsxs("group", { position: [structureWidthX / 2 + xExtension / 2, 0, 0.06], children: [_jsxs("mesh", { castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [xExtension + 0.2, armThickness, armThickness] }), _jsx(IndustrialMaterial, { color: "#ffcc00", metalness: 0.3, roughness: 0.3, bumpScale: 0.002 })] }), _jsxs("mesh", { position: [0, armThickness / 2 + 0.005, 0], receiveShadow: true, children: [_jsx("boxGeometry", { args: [xExtension + 0.15, 0.01, armThickness * 0.4] }), _jsx(IndustrialMaterial, { color: "#444444", metalness: 0.8, roughness: 0.5 })] })] }), _jsxs("group", { position: [structureWidthX / 2 + xExtension, 0, 0.06], children: [_jsxs("mesh", { position: [0, 0, -dynamicTorchOffset / 2], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.1, 0.15, dynamicTorchOffset] }), _jsx(IndustrialMaterial, { color: "#ffcc00", metalness: 0.3, roughness: 0.3, bumpScale: 0.002 })] }), _jsx(Torch, { position: [0, 0, -dynamicTorchOffset] })] })] }));
}
