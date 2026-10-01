import React from 'react';

export default function RobotPassportPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Robot Passport</h1>
        <p>Module purpose: Placeholder for Robot Passport</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The Robot Passport module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
