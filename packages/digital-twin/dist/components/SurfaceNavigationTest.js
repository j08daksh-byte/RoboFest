import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { TestEllipsoidSurface, computeRobotOrientation } from '../lib/geometry/HullSurfaceQuery';
export function SurfaceNavigationTest() {
    const [pointIndex, setPointIndex] = useState(0);
    const surface = useMemo(() => new TestEllipsoidSurface(10, 30, 15), []);
    const samplePoints = useMemo(() => [
        { u: 0, v: 0 },
        { u: 0.5, v: 0.5 },
        { u: -0.5, v: 0.5 },
        { u: -0.8, v: -0.8 },
        { u: 1.0, v: -0.5 },
    ], []);
    useEffect(() => {
        const interval = setInterval(() => {
            setPointIndex((prev) => (prev + 1) % samplePoints.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [samplePoints.length]);
    const currentParams = samplePoints[pointIndex];
    const query = useMemo(() => {
        const q = surface.querySurfacePoint(currentParams.u, currentParams.v);
        // Geometric assertions per Step 8
        const nLen = q.normal.length();
        const tLen = q.tangent.length();
        const dot = q.normal.dot(q.tangent);
        if (Math.abs(nLen - 1.0) > 0.001)
            console.error("Normal not unit length", nLen);
        if (Math.abs(tLen - 1.0) > 0.001)
            console.error("Tangent not unit length", tLen);
        if (Math.abs(dot) > 0.001)
            console.error("Normal and Tangent not orthogonal", dot);
        return q;
    }, [surface, currentParams]);
    const robotQuat = useMemo(() => computeRobotOrientation(query.normal, query.tangent), [query]);
    // Generate a mesh for the curved surface for visualization
    const surfaceMesh = useMemo(() => {
        const segments = 40;
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        // Create vertices
        for (let i = 0; i <= segments; i++) {
            const u = (i / segments - 0.5) * 3; // map [0,1] to [-1.5, 1.5]
            for (let j = 0; j <= segments; j++) {
                const v = (j / segments - 0.5) * 3;
                const res = surface.querySurfacePoint(u, v);
                vertices.push(res.position.x, res.position.y, res.position.z);
            }
        }
        // Create indices
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + (j + 1);
                const b = i * (segments + 1) + j;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + (j + 1);
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }, [surface]);
    return (_jsxs("group", { position: [0, 0, 0], children: [_jsx("mesh", { geometry: surfaceMesh, children: _jsx("meshStandardMaterial", { color: "#2c3e50", wireframe: true, transparent: true, opacity: 0.3 }) }), _jsxs("group", { position: query.position, quaternion: robotQuat, children: [_jsxs("mesh", { position: [0, 0, 0.5], children: [_jsx("boxGeometry", { args: [1, 2, 1] }), _jsx("meshStandardMaterial", { color: "#e74c3c" })] }), _jsx("arrowHelper", { args: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 3, 0x00ff00] }), _jsx("arrowHelper", { args: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 3, 0x0000ff] })] })] }));
}
