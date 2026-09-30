'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { GizmoHelper, GizmoViewport, Grid } from '@react-three/drei';
import { ShipAssembly } from '@/components/DigitalTwin/ShipAssembly';
import { TestShipCameraController, CameraPreset, InspectionTarget } from '@/components/DigitalTwin/TestShipCameraController';
import { useTestShipStore } from '@/lib/state/testShipStore';
import Link from 'next/link';

export default function TestShipPage() {
  const { 
    showSurfaceDebug, showStructuralLines, showSurfaceNormals, showSurfaceTangents, showRobotProxies, 
    setToggles 
  } = useTestShipStore();

  const [preset, setPreset] = useState<CameraPreset>('ISOMETRIC');
  const [target, setTarget] = useState<InspectionTarget>('Whole Ship');

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a192f', overflow: 'hidden' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif', pointerEvents: 'none' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Procedural Ship Hull Prototype</h2>
        <Link href="/" style={{ color: '#4facfe', textDecoration: 'none', pointerEvents: 'auto' }}>← Back to Main App</Link>
      </div>

      {/* Toolbar / Controls */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 15, width: 250, pointerEvents: 'auto' }}>
        
        {/* Camera Presets */}
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: 13 }}>CAMERA PRESETS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {(['RESET', 'FRONT', 'REAR', 'STARBOARD', 'PORT', 'TOP', 'BOTTOM', 'ISOMETRIC'] as CameraPreset[]).map(p => (
              <button 
                key={p} 
                onClick={() => setPreset(p)}
                style={{ background: preset === p ? '#4facfe' : '#333', color: 'white', border: 'none', padding: '6px', fontSize: 11, cursor: 'pointer', borderRadius: 4 }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Inspection Targets */}
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: 13 }}>INSPECTION TARGET</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(['Whole Ship', 'Bow', 'Midship', 'Stern', 'Keel'] as InspectionTarget[]).map(t => (
              <button 
                key={t} 
                onClick={() => setTarget(t)}
                style={{ background: target === t ? '#4facfe' : '#333', color: 'white', border: 'none', padding: '6px', fontSize: 12, cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Debug Toggles */}
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 8, color: 'white', fontSize: 12 }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 13 }}>DEBUG OVERLAY</h4>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showSurfaceDebug} onChange={e => setToggles({ showSurfaceDebug: e.target.checked })} style={{ marginRight: 8 }} /> Surface Debug
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showStructuralLines} onChange={e => setToggles({ showStructuralLines: e.target.checked })} style={{ marginRight: 8 }} /> Structural Lines
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showSurfaceNormals} onChange={e => setToggles({ showSurfaceNormals: e.target.checked })} style={{ marginRight: 8 }} /> Surface Normals
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: 5, cursor: 'pointer' }}>
            <input type="checkbox" checked={showSurfaceTangents} onChange={e => setToggles({ showSurfaceTangents: e.target.checked })} style={{ marginRight: 8 }} /> Surface Tangents
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRobotProxies} onChange={e => setToggles({ showRobotProxies: e.target.checked })} style={{ marginRight: 8 }} /> Robot Proxies
          </label>
        </div>

      </div>

      <Canvas>
        <color attach="background" args={['#0a192f']} />
        
        {/* Basic Industrial Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[100, 100, 100]} intensity={1.5} />
        <directionalLight position={[-100, -100, 50]} intensity={0.5} />
        
        {/* Scale Reference / Grid (10m grid squares over 160m area) */}
        <Grid args={[160, 160]} cellColor="#444444" sectionColor="#3498db" sectionSize={10} cellSize={10} fadeDistance={80} fadeStrength={1} position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} />

        {/* The Ship */}
        <ShipAssembly />
        
        {/* Camera Controller handles OrbitControls under the hood */}
        <TestShipCameraController preset={preset} targetPreset={target} />

        {/* Orientation Compass */}
        <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
          <GizmoViewport axisColors={['#e74c3c', '#2ecc71', '#3498db']} labelColor="white" />
        </GizmoHelper>
      </Canvas>

      {/* Axis Legend */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, color: '#aaa', fontFamily: 'monospace', fontSize: 11, pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: 4 }}>
        +Y: BOW | -Y: STERN | +X: STBD | -X: PORT | +Z: UP
      </div>
    </main>
  );
}
