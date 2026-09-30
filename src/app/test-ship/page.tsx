'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ShipHullPrototype } from '@/components/DigitalTwin/ShipHullPrototype';
import Link from 'next/link';

export default function TestShipPage() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a192f' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h2>Procedural Ship Hull Prototype</h2>
        <Link href="/" style={{ color: '#4facfe', textDecoration: 'none' }}>← Back to Main App</Link>
        <div style={{ marginTop: 15, background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, fontSize: 13, lineHeight: '1.6' }}>
          <strong>Coordinate Convention:</strong><br/>
          X: Transverse (Starboard + / Port -)<br/>
          Y: Longitudinal (Forward + / Aft -)<br/>
          Z: Vertical (Up + / Down -)<br/>
          <br/>
          <strong>Surface Queries:</strong><br/>
          Green Arrow = Surface Normal (Local Z)<br/>
          Blue Arrow = Surface Tangent (Local Y)
        </div>
      </div>
      <Canvas camera={{ position: [50, -60, 40], fov: 45 }}>
        <color attach="background" args={['#0a192f']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[100, 100, 100]} intensity={1.5} />
        <directionalLight position={[-100, -100, 50]} intensity={0.5} />
        <ShipHullPrototype />
        <OrbitControls makeDefault />
      </Canvas>
    </main>
  );
}
