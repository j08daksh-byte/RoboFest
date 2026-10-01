import React from 'react';

export default function RobotVisionPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Robot Vision</h1>
        <p>Module purpose: Placeholder for Robot Vision</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Robot Vision module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
