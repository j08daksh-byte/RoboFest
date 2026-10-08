import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as THREE from 'three';
import { useTwinState } from '../TwinProvider';
import { robotConfig } from '../lib/robotConfig';
export function getRobotWorldPosition(localPos) {
    return new THREE.Vector3(50.25 + localPos.z, localPos.y, 37.5 - localPos.x);
}
export function CatenaryCable({ start, end, sag, color = "#222", thickness = 0.02 }) {
    const midPoint = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2 - Math.abs(sag));
    if (sag < 0) {
        midPoint.z = Math.min(start.z, end.z) + sag;
    }
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    return (_jsxs("mesh", { castShadow: true, children: [_jsx("tubeGeometry", { args: [curve, 32, thickness, 8, false] }), _jsx("meshStandardMaterial", { color: color, metalness: 0.6, roughness: 0.7 })] }));
}
export function PulleySystem({ position }) {
    return (_jsxs("group", { position: position, children: [_jsxs("mesh", { position: [0, 0, -0.02], receiveShadow: true, castShadow: true, children: [_jsx("boxGeometry", { args: [0.3, 0.4, 0.04] }), _jsx("meshStandardMaterial", { color: "#222", metalness: 0.8, roughness: 0.5 })] }), _jsxs("mesh", { position: [0, -0.1, 0.08], castShadow: true, children: [_jsx("boxGeometry", { args: [0.1, 0.2, 0.2] }), _jsx("meshStandardMaterial", { color: "#444", metalness: 0.8 })] }), _jsxs("mesh", { position: [0, -0.2, 0.12], rotation: [0, Math.PI / 2, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.08, 0.08, 0.04, 16] }), _jsx("meshStandardMaterial", { color: "#111", roughness: 0.8 })] })] }));
}
export function SafetyCables() {
    const { position } = useTwinState();
    const worldPos = getRobotWorldPosition(position);
    const mastX = 95; // Moved far out to clear 5x scaled hull (beam=75)
    const mastZBase = -2;
    const mastZTop = 45; // Taller mast for larger ship
    const mastHeight = mastZTop - mastZBase;
    const mastY = 0; // Mast is completely stationary
    // The visual boom extends 6.8 units from the mast center at -3, so its tip is at mastX - 6.4
    const boomEndX = mastX - 6.4;
    const boomEndZ = mastZTop - 0.8;
    // 4 Primary support cable anchors on the boom
    const boomPoint1 = new THREE.Vector3(boomEndX, mastY - 0.3, boomEndZ);
    const boomPoint2 = new THREE.Vector3(boomEndX, mastY + 0.3, boomEndZ);
    const boomPoint3 = new THREE.Vector3(boomEndX + 0.3, mastY - 0.15, boomEndZ);
    const boomPoint4 = new THREE.Vector3(boomEndX + 0.3, mastY + 0.15, boomEndZ);
    const rWidth = robotConfig.structureWidthX;
    const rLen = robotConfig.structureLengthY;
    const rHeight = robotConfig.trackHeightZ + robotConfig.structureHeightZ;
    const corner1 = getRobotWorldPosition({ x: position.x - rLen / 2, y: position.y - rWidth / 2, z: position.z + rHeight });
    const corner2 = getRobotWorldPosition({ x: position.x + rLen / 2, y: position.y - rWidth / 2, z: position.z + rHeight });
    const corner3 = getRobotWorldPosition({ x: position.x - rLen / 2, y: position.y + rWidth / 2, z: position.z + rHeight });
    const corner4 = getRobotWorldPosition({ x: position.x + rLen / 2, y: position.y + rWidth / 2, z: position.z + rHeight });
    // Pulley at the SINGLE top point of the ship (attached to the existing upper white ship bar/rail)
    const shipTopWorld = getRobotWorldPosition({ x: -4.5, y: position.y, z: -0.1 });
    // Lateral cable attaches to the center-top of the robot chassis (NOT passing through it)
    const robotTopCenter = getRobotWorldPosition({ x: position.x, y: position.y, z: position.z + rHeight + 0.1 });
    return (_jsxs("group", { children: [_jsxs("group", { position: [mastX, mastY, mastZBase], children: [_jsxs("mesh", { position: [0, 0, mastHeight / 2], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [0.8, 0.8, mastHeight] }), _jsx("meshStandardMaterial", { color: "#fca311", metalness: 0.7, roughness: 0.4 }), " "] }), _jsxs("mesh", { position: [0, 0, 0.2], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [3, 3, 0.4] }), _jsx("meshStandardMaterial", { color: "#222", metalness: 0.8, roughness: 0.6 })] }), [0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (_jsx("mesh", { position: [Math.cos(rot) * 0.7, Math.sin(rot) * 0.7, 1.5], rotation: [0, 0, rot], castShadow: true, children: _jsxs("mesh", { position: [0, 0, 0], rotation: [0, -Math.PI / 6, 0], children: [_jsx("boxGeometry", { args: [0.2, 0.2, 3] }), _jsx("meshStandardMaterial", { color: "#fca311", metalness: 0.7, roughness: 0.4 })] }) }, i))), _jsxs("mesh", { position: [-3, 0, mastHeight - 0.4], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [6.8, 0.6, 0.8] }), _jsx("meshStandardMaterial", { color: "#2c3e50", metalness: 0.8, roughness: 0.4 }), " "] }), _jsx("group", { position: [-5.5, 0, mastHeight - 0.8], children: _jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.3, 0.3, 0.5, 24] }), _jsx("meshStandardMaterial", { color: "#111", metalness: 0.9, roughness: 0.3 })] }) })] }), _jsx(CatenaryCable, { start: boomPoint1, end: corner1, sag: 0.2, color: "#333", thickness: 0.015 }), _jsx(CatenaryCable, { start: boomPoint2, end: corner2, sag: 0.2, color: "#333", thickness: 0.015 }), _jsx(CatenaryCable, { start: boomPoint3, end: corner3, sag: 0.2, color: "#333", thickness: 0.015 }), _jsx(CatenaryCable, { start: boomPoint4, end: corner4, sag: 0.2, color: "#333", thickness: 0.015 }), _jsx(PulleySystem, { position: shipTopWorld }), _jsx(CatenaryCable, { start: shipTopWorld, end: robotTopCenter, sag: 0.05, color: "#ffaa00", thickness: 0.012 })] }));
}
