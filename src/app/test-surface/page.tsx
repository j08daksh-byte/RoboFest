'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SurfaceNavigationTest } from '@/components/DigitalTwin/SurfaceNavigationTest';
import Link from 'next/link';

export default function TestSurfacePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h2>Hull Surface Navigation POC</h2>
        <Link href="/" style={{ color: '#3498db' }}>← Back to Main App</Link>
        <p style={{ maxWidth: 400, marginTop: 10, fontSize: 14, color: '#aaa' }}>
          This is an isolated test scene demonstrating orientation calculations across an arbitrary curved surface (ellipsoid patch).
        </p>
      </div>
      <Canvas camera={{ position: [20, 20, 20], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <SurfaceNavigationTest />
        <OrbitControls makeDefault />
      </Canvas>
    </main>
  );
}
