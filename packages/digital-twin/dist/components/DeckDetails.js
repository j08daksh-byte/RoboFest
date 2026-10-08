import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { shipConfig } from '../lib/geometry/shipConfig';
export function DeckDetails({ surface, materials }) {
    // 1. Bollards (Mooring hardware)
    const bollardPositions = useMemo(() => {
        const pos = [];
        const L = shipConfig.lengthOverall;
        // Places bollards along the deck edge
        const yLocations = [L / 2 - 5, L / 2 - 15, L / 2 - 30, 0, -L / 2 + 30, -L / 2 + 15, -L / 2 + 5];
        yLocations.forEach(y => {
            const u = (y + L / 2) / L; // Normalize Y to U
            if (u >= 0 && u <= 1) {
                // Port
                const portPt = surface.evaluatePosition(u, -0.95);
                portPt.z += 0.5; // sit on deck
                pos.push(portPt);
                // Stbd
                const stbdPt = surface.evaluatePosition(u, 0.95);
                stbdPt.z += 0.5;
                pos.push(stbdPt);
            }
        });
        return pos;
    }, [surface]);
    const bollardMeshRef = useRef(null);
    React.useEffect(() => {
        if (bollardMeshRef.current) {
            const dummy = new THREE.Object3D();
            bollardPositions.forEach((p, i) => {
                dummy.position.copy(p);
                dummy.rotation.set(Math.PI / 2, 0, 0); // Cylinder stands up (Z-up)
                dummy.updateMatrix();
                bollardMeshRef.current.setMatrixAt(i, dummy.matrix);
            });
            bollardMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [bollardPositions]);
    // 2. Railings (Stanchions)
    const railingPositions = useMemo(() => {
        const pos = [];
        const L = shipConfig.lengthOverall;
        // Place stanchions every 2 meters
        for (let y = -L / 2 + 2; y <= L / 2 - 2; y += 2) {
            const u = (y + L / 2) / L;
            if (u >= 0 && u <= 1) {
                // Port
                const pPt = surface.evaluatePosition(u, -0.99);
                pos.push(pPt);
                // Stbd
                const sPt = surface.evaluatePosition(u, 0.99);
                pos.push(sPt);
            }
        }
        return pos;
    }, [surface]);
    const railingMeshRef = useRef(null);
    React.useEffect(() => {
        if (railingMeshRef.current) {
            const dummy = new THREE.Object3D();
            railingPositions.forEach((p, i) => {
                dummy.position.copy(p);
                dummy.position.z += 0.5; // half height of stanchion
                dummy.rotation.set(Math.PI / 2, 0, 0);
                dummy.updateMatrix();
                railingMeshRef.current.setMatrixAt(i, dummy.matrix);
            });
            railingMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [railingPositions]);
    // 3. Continuous Railing Top Tube
    const railingTopGeo = useMemo(() => {
        const ptsPort = [];
        const ptsStbd = [];
        const L = shipConfig.lengthOverall;
        for (let y = -L / 2 + 2; y <= L / 2 - 2; y += 2) {
            const u = (y + L / 2) / L;
            if (u >= 0 && u <= 1) {
                const pPt = surface.evaluatePosition(u, -0.99);
                pPt.z += 1.0; // 1m high rail
                ptsPort.push(pPt);
                const sPt = surface.evaluatePosition(u, 0.99);
                sPt.z += 1.0;
                ptsStbd.push(sPt);
            }
        }
        const geoPort = new THREE.BufferGeometry().setFromPoints(ptsPort);
        const geoStbd = new THREE.BufferGeometry().setFromPoints(ptsStbd);
        return { geoPort, geoStbd };
    }, [surface]);
    return (_jsxs("group", { children: [_jsx("instancedMesh", { ref: bollardMeshRef, args: [undefined, undefined, bollardPositions.length], material: materials.equipmentMetal, castShadow: true, children: _jsx("cylinderGeometry", { args: [0.3, 0.4, 1.0, 12] }) }), _jsx("instancedMesh", { ref: railingMeshRef, args: [undefined, undefined, railingPositions.length], material: materials.superstructurePaint, children: _jsx("cylinderGeometry", { args: [0.05, 0.05, 1.0, 4] }) }), _jsx("primitive", { object: new THREE.Line(railingTopGeo.geoPort, new THREE.LineBasicMaterial({ color: '#bdc3c7', linewidth: 2 })) }), _jsx("primitive", { object: new THREE.Line(railingTopGeo.geoStbd, new THREE.LineBasicMaterial({ color: '#bdc3c7', linewidth: 2 })) }), _jsx("mesh", { position: [-2, 10, 15.2], castShadow: true, receiveShadow: true, material: materials.equipmentMetal, children: _jsx("cylinderGeometry", { args: [0.2, 0.2, 50, 8] }) }), _jsx("mesh", { position: [-2.5, 10, 15.2], castShadow: true, receiveShadow: true, material: materials.equipmentMetal, children: _jsx("cylinderGeometry", { args: [0.15, 0.15, 50, 8] }) })] }));
}
// ----------------------------------------------------------------------
// SUPERSTRUCTURE DETAILS (Radar, LifeRings)
// ----------------------------------------------------------------------
export function BridgeDetails({ materials }) {
    const radarRef = useRef(null);
    useFrame((state, delta) => {
        if (radarRef.current) {
            radarRef.current.rotation.y += delta * 2; // Spinning radar
        }
    });
    const deckZ = 15.1;
    return (_jsxs("group", { position: [0, -25, deckZ], children: [_jsx("group", { position: [-9.2, -4, 2], children: _jsx("mesh", { rotation: [Math.PI / 4, 0, 0], material: materials.deckMaterial, children: _jsx("boxGeometry", { args: [1, 6, 0.1] }) }) }), _jsx("group", { position: [-8.2, -4, 6], children: _jsx("mesh", { rotation: [Math.PI / 4, 0, 0], material: materials.deckMaterial, children: _jsx("boxGeometry", { args: [1, 6, 0.1] }) }) }), _jsx("mesh", { position: [-11.2, 1, 10], rotation: [0, Math.PI / 2, 0], material: materials.warningPaint, children: _jsx("torusGeometry", { args: [0.4, 0.1, 8, 16] }) }), _jsx("mesh", { position: [11.2, 1, 10], rotation: [0, Math.PI / 2, 0], material: materials.warningPaint, children: _jsx("torusGeometry", { args: [0.4, 0.1, 8, 16] }) }), _jsx("mesh", { position: [-9, 0, 7.5], rotation: [0, -Math.PI / 6, 0], material: materials.superstructurePaint, children: _jsx("cylinderGeometry", { args: [0.1, 0.1, 5, 8] }) }), _jsx("mesh", { position: [9, 0, 7.5], rotation: [0, Math.PI / 6, 0], material: materials.superstructurePaint, children: _jsx("cylinderGeometry", { args: [0.1, 0.1, 5, 8] }) }), _jsxs("group", { position: [0, -2, 12 + 6], children: [" ", _jsx("mesh", { ref: radarRef, material: materials.superstructurePaint, children: _jsx("boxGeometry", { args: [3, 0.2, 0.4] }) })] }), _jsx("mesh", { position: [-3, -2, 12 + 4], material: materials.equipmentMetal, children: _jsx("cylinderGeometry", { args: [0.02, 0.05, 4, 8] }) }), _jsx("mesh", { position: [3, -2, 12 + 3], material: materials.equipmentMetal, children: _jsx("cylinderGeometry", { args: [0.02, 0.05, 3, 8] }) })] }));
}
