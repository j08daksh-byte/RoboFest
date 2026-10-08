import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useMemo } from 'react';
import * as THREE from 'three';
import { robotConfig } from '../lib/robotConfig';
import { Tracks } from './Tracks';
import { Electromagnet } from './Electromagnet';
import { CuttingArm } from './CuttingArm';
import { CoordinateAxes } from './CoordinateAxes';
import { useTwinState } from '../TwinProvider';
import { Text } from '@react-three/drei';
import { IndustrialMaterial } from './IndustrialMaterial';
export function RobotModel({ showAxes = true }) {
    const { bodyWidthX, bodyLengthY, bodyHeightZ, trackHeightZ, structureHeightZ, structureWidthX, structureLengthY, hullRadius } = robotConfig;
    const { arm: { xExtension }, position } = useTwinState();
    const torchX = bodyWidthX / 2 + xExtension;
    // Calculate rotation to match hull curvature
    const theta = Math.asin(position.x / hullRadius);
    // Create a tank-like hull shape (side profile)
    // X maps to Length (Y), Y maps to Height (Z)
    const hullShape = useMemo(() => {
        const shape = new THREE.Shape();
        const l = bodyLengthY;
        const h = bodyHeightZ;
        shape.moveTo(-l / 2 + l * 0.1, h / 2); // Top rear
        shape.lineTo(l / 2 - l * 0.15, h / 2); // Top front
        shape.lineTo(l / 2 + l * 0.05, h * 0.1); // Upper nose
        shape.lineTo(l / 2, -h / 2); // Bottom front (sloped glacis)
        shape.lineTo(-l / 2, -h / 2); // Bottom rear
        shape.lineTo(-l / 2 - l * 0.05, h * 0.1); // Rear bulge
        shape.lineTo(-l / 2 + l * 0.1, h / 2); // Back to top rear
        return shape;
    }, [bodyLengthY, bodyHeightZ]);
    const extrudeSettings = useMemo(() => ({
        depth: bodyWidthX,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2
    }), [bodyWidthX]);
    return (_jsx("group", { position: [position.x, position.y, position.z], rotation: [0, -theta, 0], children: _jsxs("group", { rotation: [0, 0, Math.PI / 2], children: [_jsxs("group", { position: [0, 0, trackHeightZ / 2], children: [_jsxs("group", { rotation: [0, 0, Math.PI / 2], children: [" ", _jsxs("group", { rotation: [Math.PI / 2, 0, 0], children: [" ", _jsxs("mesh", { position: [0, 0, -bodyWidthX / 2], castShadow: true, receiveShadow: true, children: [_jsx("extrudeGeometry", { args: [hullShape, extrudeSettings] }), _jsx(IndustrialMaterial, { color: "#8a8d8f", metalness: 0.5, roughness: 0.5, bumpScale: 0.003 })] })] })] }), _jsxs("mesh", { position: [0, bodyLengthY / 3, bodyHeightZ / 2 + 0.01], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [bodyWidthX * 1.05, 0.05, 0.02] }), _jsx(IndustrialMaterial, { color: "#666666", metalness: 0.5, roughness: 0.5 })] }), _jsxs("mesh", { position: [0, -bodyLengthY / 3, bodyHeightZ / 2 + 0.01], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [bodyWidthX * 1.05, 0.05, 0.02] }), _jsx(IndustrialMaterial, { color: "#666666", metalness: 0.5, roughness: 0.5 })] }), _jsxs("mesh", { position: [(bodyWidthX + 0.02) / 2, 0, 0], receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.6, roughness: 0.4 })] }), _jsxs("mesh", { position: [-(bodyWidthX + 0.02) / 2, 0, 0], receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.02, bodyLengthY * 0.7, bodyHeightZ * 1.1] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.6, roughness: 0.4 })] })] }), _jsx(Tracks, {}), _jsx(Electromagnet, {}), _jsxs("group", { position: [0, 0, trackHeightZ + structureHeightZ / 2], children: [_jsxs("mesh", { position: [structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2], rotation: [Math.PI / 2, 0, 0], castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.02, 0.03, structureHeightZ, 12] }), _jsx(IndustrialMaterial, { color: "#b0b0b0", metalness: 0.6 })] }), _jsxs("mesh", { position: [-structureWidthX / 3, structureLengthY / 3, -structureHeightZ / 2], rotation: [Math.PI / 2, 0, 0], castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.02, 0.03, structureHeightZ, 12] }), _jsx(IndustrialMaterial, { color: "#b0b0b0", metalness: 0.6 })] }), _jsxs("mesh", { position: [structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2], rotation: [Math.PI / 2, 0, 0], castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.02, 0.03, structureHeightZ, 12] }), _jsx(IndustrialMaterial, { color: "#b0b0b0", metalness: 0.6 })] }), _jsxs("mesh", { position: [-structureWidthX / 3, -structureLengthY / 3, -structureHeightZ / 2], rotation: [Math.PI / 2, 0, 0], castShadow: true, receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [0.02, 0.03, structureHeightZ, 12] }), _jsx(IndustrialMaterial, { color: "#b0b0b0", metalness: 0.6 })] }), _jsxs("mesh", { castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [structureWidthX, structureLengthY, 0.04] }), _jsx(IndustrialMaterial, { color: "#a0a4a8", metalness: 0.5, roughness: 0.4 })] })] }), _jsx(CuttingArm, {}), _jsxs("group", { position: [torchX, 0, 0], children: [_jsxs("mesh", { position: [0, 0, 0.02], children: [_jsx("boxGeometry", { args: [0.005, 3, 0.005] }), _jsx("meshBasicMaterial", { color: "#ffaa00", transparent: true, opacity: 0.5 })] }), showAxes && (_jsx(Text, { position: [0.05, 1.2, 0.05], color: "#ffaa00", fontSize: 0.05, children: "VERTICAL CUT PATH" }))] }), showAxes && _jsx(CoordinateAxes, {})] }) }));
}
