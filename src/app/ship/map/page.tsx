import React from 'react';

export default function ShipMapPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Ship Map</h1>
        <p>Module purpose: Placeholder for Ship Map</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Ship Map module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
