import React from 'react';

export default function RobotVisionPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Robot Vision</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Module purpose: Placeholder for Robot Vision</p></header>
      <main className="grid-1-col">
        <div className="empty-state" style={{ marginTop: "40px" }}>
          <h2>No active data</h2>
          <p>The Robot Vision module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
