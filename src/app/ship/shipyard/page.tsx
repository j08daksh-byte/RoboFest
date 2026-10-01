import React from 'react';

export default function ShipShipyardPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Ship Shipyard</h1>
        <p>Module purpose: Placeholder for Ship Shipyard</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Ship Shipyard module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
