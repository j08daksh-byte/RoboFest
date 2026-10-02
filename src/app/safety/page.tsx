import React from 'react';
import Link from 'next/link';

export default function SafetyLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Safety</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Safety</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/safety/hazards" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Safety & Hazards</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Safety & Hazards module</div>
            </div>
          </Link>
          
          <Link href="/safety/weather" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Weather / Site</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Weather / Site module</div>
            </div>
          </Link>
          
          <Link href="/safety/emergency" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Emergency Control</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Emergency Control module</div>
            </div>
          </Link>
          
          <Link href="/safety/notifications" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Notifications</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Notifications module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
