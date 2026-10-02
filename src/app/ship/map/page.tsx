import React from 'react';

export default function ShipMapPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Ship Map</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Module purpose: Placeholder for Ship Map</p></header>
      <main className="grid-1-col">
        <div className="empty-state" style={{ marginTop: "40px" }}>
          <h2>No active data</h2>
          <p>The Ship Map module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
