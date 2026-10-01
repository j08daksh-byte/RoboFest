import React from 'react';

export default function RobotSensorsPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Robot Sensors</h1>
        <p>Module purpose: Placeholder for Robot Sensors</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Robot Sensors module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
