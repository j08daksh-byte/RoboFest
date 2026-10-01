import React from 'react';

export default function SafetyEmergencyPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Safety Emergency</h1>
        <p>Module purpose: Placeholder for Safety Emergency</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Safety Emergency module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
