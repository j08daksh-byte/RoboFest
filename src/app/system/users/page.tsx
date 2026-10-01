import React from 'react';

export default function SystemUsersPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>System Users</h1>
        <p>Module purpose: Placeholder for System Users</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The System Users module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
