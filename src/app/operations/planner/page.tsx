import React from 'react';

export default function OperationsPlannerPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Operations Planner</h1>
        <p>Module purpose: Placeholder for Operations Planner</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Operations Planner module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
