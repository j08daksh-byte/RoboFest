import React from 'react';

export default function SafetyHazardsPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Safety Hazards</h1>
        <p>Module purpose: Placeholder for Safety Hazards</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Safety Hazards module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
