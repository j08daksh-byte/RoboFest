import React from 'react';
import Link from 'next/link';

export default function SystemLandingPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>System</h1>
        <p>Overview and sub-modules for System</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/system/users" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Users / Roles</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Users / Roles module</div>
            </div>
          </Link>
          
          <Link href="/system/demo" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Guided Demo</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Guided Demo module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
