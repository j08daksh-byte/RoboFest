import { CutGeometry, CutMaterial } from './domain';

export const DEMO_MATERIAL: CutMaterial = {
  name: 'Hull Steel A-Grade',
  thicknessMm: 12,
  densityKgM3: 7850
};

export const DEMO_CUTS: Array<{ id: string, name: string, geometry: CutGeometry, material: CutMaterial }> = [
  {
    id: 'DEMO-STRAIGHT',
    name: 'Valid Straight Cut',
    geometry: { type: 'STRAIGHT', start: { x: 0, y: 0 }, end: { x: 2, y: 0 } },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-RECT',
    name: 'Valid Rectangle',
    geometry: { type: 'RECTANGLE', origin: { x: 1, y: 1 }, width: 2, height: 1 },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-CIRCLE',
    name: 'Valid Circle',
    geometry: { type: 'CIRCLE', center: { x: -2, y: 0 }, radius: 0.5 },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-INVALID',
    name: 'Invalid Geometry (Zero Radius)',
    geometry: { type: 'CIRCLE', center: { x: 0, y: 0 }, radius: -1 },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-REACH',
    name: 'Out of Reach (Far X)',
    geometry: { type: 'STRAIGHT', start: { x: 12, y: 0 }, end: { x: 13, y: 0 } },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-STRUCT',
    name: 'Structural Conflict (Hits Rib)',
    geometry: { type: 'STRAIGHT', start: { x: 7, y: 0 }, end: { x: 8.5, y: 0 } },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-SUPPORT',
    name: 'Support Conflict (Hits Cable)',
    geometry: { type: 'STRAIGHT', start: { x: 0, y: -3 }, end: { x: 0, y: -5 } },
    material: DEMO_MATERIAL
  },
  {
    id: 'DEMO-SAFETY',
    name: 'Safety Blocked (Any valid cut - Requires warning/e-stop)',
    geometry: { type: 'STRAIGHT', start: { x: -1, y: 1 }, end: { x: 1, y: 1 } },
    material: DEMO_MATERIAL
  }
];
