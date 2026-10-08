import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useMemo } from 'react';
import * as THREE from 'three';
import { robotConfig } from '../lib/robotConfig';
import { useTwinState } from '../TwinProvider';
import { IndustrialMaterial } from './IndustrialMaterial';
function CrawlerTrack({ side, offsetX }) {
    const { trackWidthX, trackLengthY, trackHeightZ } = robotConfig;
    const { trackOffset } = useTwinState();
    // Track proportions
    const wheelRadius = trackHeightZ / 2;
    const straightLength = trackLengthY - (wheelRadius * 2);
    const halfStraight = straightLength / 2;
    const circumference = (2 * straightLength) + (2 * Math.PI * wheelRadius);
    const treadCount = 36;
    const treads = useMemo(() => {
        const arr = [];
        for (let i = 0; i < treadCount; i++) {
            const baseDist = (i / treadCount) * circumference;
            // We subtract trackOffset so if the robot moves UP (+Y), the track offset increases, 
            // which means the belt material goes DOWN (-Y) relative to the chassis.
            // Wait, moving UP means the belt goes DOWN relative to the robot.
            let distance = (baseDist - trackOffset) % circumference;
            if (distance < 0)
                distance += circumference;
            let y = 0;
            let z = 0;
            let angle = 0;
            if (distance < straightLength) {
                y = -halfStraight + distance;
                z = -wheelRadius;
                angle = 0;
            }
            else if (distance < straightLength + Math.PI * wheelRadius) {
                const curveDist = distance - straightLength;
                const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI; // 0 to PI
                y = halfStraight + Math.sin(theta) * wheelRadius;
                z = -wheelRadius + (1 - Math.cos(theta)) * wheelRadius;
                angle = theta;
            }
            else if (distance < 2 * straightLength + Math.PI * wheelRadius) {
                const topDist = distance - (straightLength + Math.PI * wheelRadius);
                y = halfStraight - topDist;
                z = wheelRadius;
                angle = Math.PI;
            }
            else {
                const curveDist = distance - (2 * straightLength + Math.PI * wheelRadius);
                const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI; // 0 to PI
                y = -halfStraight - Math.sin(theta) * wheelRadius;
                z = wheelRadius - (1 - Math.cos(theta)) * wheelRadius;
                angle = Math.PI + theta;
            }
            arr.push({ position: new THREE.Vector3(0, y, z), rotation: new THREE.Euler(angle, 0, 0) });
        }
        return arr;
    }, [circumference, straightLength, halfStraight, wheelRadius, trackOffset]);
    const magnetRowsCount = 36; // Increased to match tread count so they cover the entire belt
    const magnets = useMemo(() => {
        const arr = [];
        for (let i = 0; i < magnetRowsCount; i++) {
            const baseDist = (i / magnetRowsCount) * circumference;
            let distance = (baseDist - trackOffset) % circumference;
            if (distance < 0)
                distance += circumference;
            let y = 0;
            let z = 0;
            let angle = 0;
            if (distance < straightLength) {
                y = -halfStraight + distance;
                z = -wheelRadius;
                angle = 0;
            }
            else if (distance < straightLength + Math.PI * wheelRadius) {
                const curveDist = distance - straightLength;
                const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI;
                y = halfStraight + Math.sin(theta) * wheelRadius;
                z = -wheelRadius + (1 - Math.cos(theta)) * wheelRadius;
                angle = theta;
            }
            else if (distance < 2 * straightLength + Math.PI * wheelRadius) {
                const topDist = distance - (straightLength + Math.PI * wheelRadius);
                y = halfStraight - topDist;
                z = wheelRadius;
                angle = Math.PI;
            }
            else {
                const curveDist = distance - (2 * straightLength + Math.PI * wheelRadius);
                const theta = (curveDist / (Math.PI * wheelRadius)) * Math.PI;
                y = -halfStraight - Math.sin(theta) * wheelRadius;
                z = wheelRadius - (1 - Math.cos(theta)) * wheelRadius;
                angle = Math.PI + theta;
            }
            // Two magnets per row (Left and Right relative to the track width)
            arr.push({
                position: new THREE.Vector3(0, y, z),
                rotation: new THREE.Euler(angle, 0, 0)
            });
        }
        return arr;
    }, [circumference, straightLength, halfStraight, wheelRadius, trackOffset]);
    // Shiny Circular Magnet with countersunk center
    const CircularMagnet = () => (_jsxs("group", { position: [0, 0, -0.022], children: [_jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.022, 0.022, 0.008, 32] }), _jsx(IndustrialMaterial, { color: "#f0f0f0", metalness: 1.0, roughness: 0.2, bumpScale: 0.001 })] }), _jsxs("mesh", { position: [0, 0, -0.003], rotation: [Math.PI / 2, 0, 0], castShadow: true, children: [_jsx("cylinderGeometry", { args: [0.005, 0.012, 0.003, 32] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.8, roughness: 0.4 })] }), _jsxs("mesh", { position: [0, 0, -0.005], rotation: [Math.PI / 2, 0, 0], children: [_jsx("cylinderGeometry", { args: [0.006, 0.006, 0.009, 16] }), _jsx("meshBasicMaterial", { color: "#000000" })] })] }));
    // Aluminum Wheel component matching physical reference
    const renderWheel = (posY) => (_jsxs("group", { position: [0, posY, 0], rotation: [0, 0, Math.PI / 2], children: [_jsxs("mesh", { castShadow: true, children: [_jsx("cylinderGeometry", { args: [wheelRadius * 0.9, wheelRadius * 0.9, trackWidthX * 0.8, 32] }), _jsx(IndustrialMaterial, { color: "#cccccc", metalness: 0.9, roughness: 0.3, bumpScale: 0.002 })] }), _jsxs("mesh", { position: [0, (trackWidthX * 0.8) / 2 + 0.001, 0], rotation: [-Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [wheelRadius * 0.55, wheelRadius * 0.58, 32] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.8, roughness: 0.5 })] }), _jsxs("mesh", { position: [0, -(trackWidthX * 0.8) / 2 - 0.001, 0], rotation: [Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [wheelRadius * 0.55, wheelRadius * 0.58, 32] }), _jsx(IndustrialMaterial, { color: "#999999", metalness: 0.8, roughness: 0.5 })] }), _jsxs("mesh", { children: [_jsx("cylinderGeometry", { args: [wheelRadius * 0.15, wheelRadius * 0.15, trackWidthX * 0.81, 16] }), _jsx("meshBasicMaterial", { color: "#000" })] })] }));
    return (_jsxs("group", { position: [offsetX, 0, trackHeightZ / 2], children: [renderWheel(halfStraight), renderWheel(0), renderWheel(-halfStraight), _jsxs("mesh", { position: [0, 0, 0], castShadow: true, children: [_jsx("boxGeometry", { args: [trackWidthX * 0.4, straightLength, wheelRadius * 1.5] }), _jsx(IndustrialMaterial, { color: "#222222", metalness: 0.7, roughness: 0.5, bumpScale: 0.004 })] }), treads.map((t, idx) => (_jsx("group", { position: t.position, rotation: t.rotation, children: _jsxs("mesh", { position: [0, 0, -0.01], castShadow: true, children: [_jsx("boxGeometry", { args: [trackWidthX, 0.04, 0.015] }), _jsx(IndustrialMaterial, { color: "#1a1a1a", metalness: 0.3, roughness: 0.9, bumpScale: 0.005 })] }) }, `tread-${idx}`))), magnets.map((m, idx) => (_jsxs("group", { position: m.position, rotation: m.rotation, children: [_jsx("group", { position: [-trackWidthX * 0.25, 0, 0], children: _jsx(CircularMagnet, {}) }), _jsx("group", { position: [trackWidthX * 0.25, 0, 0], children: _jsx(CircularMagnet, {}) })] }, `magrow-${idx}`)))] }));
}
export function Tracks() {
    const { trackWidthX, bodyWidthX } = robotConfig;
    const trackOffsetX = bodyWidthX / 2 + trackWidthX / 2;
    return (_jsxs("group", { children: [_jsx(CrawlerTrack, { side: "left", offsetX: -trackOffsetX }), _jsx(CrawlerTrack, { side: "right", offsetX: trackOffsetX })] }));
}
