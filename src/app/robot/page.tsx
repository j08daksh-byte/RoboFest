import React from 'react';
import Link from 'next/link';

export default function RobotLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Robot</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Robot</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/robot/twin" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Digital Twin</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Digital Twin module</div>
            </div>
          </Link>
          
          <Link href="/robot/sensors" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Sensors</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Sensors module</div>
            </div>
          </Link>
          
          <Link href="/robot/health" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Robot Health</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Robot Health module</div>
            </div>
          </Link>
          
          <Link href="/robot/passport" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Robot Passport</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Robot Passport module</div>
            </div>
          </Link>
          
          <Link href="/robot/vision" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Vision</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Vision module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
