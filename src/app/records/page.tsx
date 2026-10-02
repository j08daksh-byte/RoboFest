import React from 'react';
import Link from 'next/link';

export default function RecordsLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Records</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Records</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/records/history" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Event History</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Event History module</div>
            </div>
          </Link>
          
          <Link href="/records/maintenance" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Maintenance Log</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Maintenance Log module</div>
            </div>
          </Link>
          
          <Link href="/records/knowledge-base" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Knowledge Base</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Knowledge Base module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
