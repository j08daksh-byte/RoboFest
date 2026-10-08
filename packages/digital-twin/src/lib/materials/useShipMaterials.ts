import { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useAssetBaseUrl } from '../../TwinProvider';

// Procedural texture generator for subtle variation without heavy external assets
function createNoiseTexture(size: number, baseColor: string, noiseColor: string, opacity: number, scale: number): THREE.CanvasTexture | null {
  if (typeof window === 'undefined') return null; // SSR protection

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = noiseColor;
  ctx.globalAlpha = opacity;

  // Simple high-frequency noise
  for (let i = 0; i < size; i += scale) {
    for (let j = 0; j < size; j += scale) {
      if (Math.random() > 0.5) {
        ctx.fillRect(i, j, scale, scale);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.anisotropy = 4; // usually set by renderer
  return texture;
}

// Generate a gradient texture for funnel soot
function createGradientTexture(colorStart: string, colorEnd: string): THREE.CanvasTexture | null {
  if (typeof window === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function useShipMaterials(xRayMode: boolean = false) {
  const assetBaseUrl = useAssetBaseUrl();
  const rustDiff = useTexture(`${assetBaseUrl}/textures/green_metal_rust/green_metal_rust_diff_2k.jpg`);

  const materials = useMemo(() => {
    let clonedRustDiff = null;
    if (rustDiff) {
      clonedRustDiff = rustDiff.clone();
      clonedRustDiff.wrapS = clonedRustDiff.wrapT = THREE.RepeatWrapping;
      clonedRustDiff.repeat.set(10, 4);
      clonedRustDiff.needsUpdate = true;
    }

    const setXRay = (mat: THREE.Material) => {
      if (xRayMode) {
        mat.transparent = true;
        mat.opacity = 0.15;
        mat.depthWrite = false;
      }
    };

    // 1. Painted Hull Steel
    const hullPaint = new THREE.MeshStandardMaterial({
      color: '#3a4750',
      map: clonedRustDiff as any,
      roughness: 0.65,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    setXRay(hullPaint);


    // 2. Anti-Fouling Lower Hull
    // Dark red, rougher, more weathered
    const antiFoulingAlbedo = createNoiseTexture(512, '#7a2222', '#5c1717', 0.6, 8);
    const antiFoulingRoughness = createNoiseTexture(256, '#999999', '#bbbbbb', 0.6, 4);
    
    const hullAntiFouling = new THREE.MeshStandardMaterial({
      color: '#8b2929',
      map: antiFoulingAlbedo,
      roughnessMap: antiFoulingRoughness,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    if (antiFoulingAlbedo) {
      antiFoulingAlbedo.repeat.set(10, 2);
      hullAntiFouling.color.setHex(0xffffff);
    }
    if (antiFoulingRoughness) antiFoulingRoughness.repeat.set(10, 2);
    setXRay(hullAntiFouling);

    // 3. Deck Steel
    // Very rough dark grey with anti-slip micro-texture
    const deckAlbedo = createNoiseTexture(512, '#28313b', '#1e252d', 0.7, 2);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: '#2d3748',
      map: deckAlbedo,
      roughness: 0.95,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    if (deckAlbedo) {
      deckAlbedo.repeat.set(20, 4);
      deckMaterial.color.setHex(0xffffff);
    }
    setXRay(deckMaterial);

    // 4. Superstructure Paint
    const superAlbedo = createNoiseTexture(256, '#e2e8f0', '#cbd5e1', 0.3, 4);
    const superstructurePaint = new THREE.MeshStandardMaterial({
      color: '#f0f4f8',
      map: superAlbedo,
      roughness: 0.5,
      metalness: 0.1
    });
    if (superAlbedo) {
      superAlbedo.repeat.set(4, 4);
      superstructurePaint.color.setHex(0xffffff);
    }
    setXRay(superstructurePaint);

    // 5. Glass
    const glass = new THREE.MeshStandardMaterial({
      color: '#1a202c',
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 1.0,
      transparent: true,
      opacity: xRayMode ? 0.15 : 0.85,
      depthWrite: !xRayMode
    });

    // 6. Metal details (Hatches, Winches)
    const equipmentMetal = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.6,
      metalness: 0.6
    });
    setXRay(equipmentMetal);

    const hatchMetal = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.7,
      metalness: 0.4
    });
    setXRay(hatchMetal);

    // 7. Funnel Soot Gradient
    const funnelSootMap = createGradientTexture('#111111', '#e74c3c');
    const funnelMaterial = new THREE.MeshStandardMaterial({
      color: '#e74c3c',
      map: funnelSootMap,
      roughness: 0.7,
      metalness: 0.2
    });
    if (funnelSootMap) funnelMaterial.color.setHex(0xffffff);
    setXRay(funnelMaterial);

    // 8. Warning Paint (Yellow)
    const warningPaint = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.6,
      metalness: 0.1
    });
    setXRay(warningPaint);

    return {
      hullPaint,
      hullAntiFouling,
      deckMaterial,
      superstructurePaint,
      glass,
      equipmentMetal,
      hatchMetal,
      funnelMaterial,
      warningPaint
    };
  }, [rustDiff, xRayMode]);

  return materials;
}


