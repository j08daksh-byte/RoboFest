"use client";

import React from 'react';
import { DigitalTwin } from '@/components/DigitalTwin';

export default function RobotTwinPage() {
  return (
    <div className="module-container" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
      <header className="module-header" style={{ padding: '24px 24px 0 24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Digital Twin</h1>
            <p>Isolated full-scale visualization of the robot and ship hull.</p>
          </div>
          <span className="sim-badge" style={{ marginTop: '0' }}>SIMULATED / DEMO</span>
        </div>
      </header>
      
      <main className="module-content" style={{ flex: 1, position: 'relative', borderTop: '1px solid #30363d' }}>
        <div className="twin-wrapper">
          <DigitalTwin />
        </div>
      </main>
    </div>
  );
}
