import { jsx as _jsx } from "react/jsx-runtime";
// @ts-nocheck
import { useMemo } from 'react';
import * as THREE from 'three';
let sharedNoiseTexture = null;
function getNoiseTexture() {
    if (typeof document === 'undefined')
        return null;
    if (sharedNoiseTexture)
        return sharedNoiseTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        // Add noise and "scratches"
        for (let i = 0; i < 50000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#cccccc' : '#e6e6e6';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 3, Math.random() * 3);
        }
        sharedNoiseTexture = new THREE.CanvasTexture(canvas);
        sharedNoiseTexture.wrapS = THREE.RepeatWrapping;
        sharedNoiseTexture.wrapT = THREE.RepeatWrapping;
        sharedNoiseTexture.repeat.set(3, 3);
    }
    return sharedNoiseTexture;
}
export function IndustrialMaterial({ color, metalness = 0.6, roughness = 0.5, bumpScale = 0.001 }) {
    const tex = useMemo(() => getNoiseTexture(), []);
    return (_jsx("meshStandardMaterial", { color: color, metalness: metalness, roughness: roughness, bumpMap: tex || undefined, bumpScale: bumpScale }));
}
