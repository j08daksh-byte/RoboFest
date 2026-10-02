import React from 'react';
import Link from 'next/link';

export default function IntelligenceLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Intelligence</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Intelligence</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/intelligence/robo-assist" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">ROBO-ASSIST</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open ROBO-ASSIST module</div>
            </div>
          </Link>
          
          <Link href="/intelligence/analytics" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Analytics</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Analytics module</div>
            </div>
          </Link>
          
          <Link href="/intelligence/telemetry" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Telemetry</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Telemetry module</div>
            </div>
          </Link>
          
          <Link href="/intelligence/performance" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Performance</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Performance module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
