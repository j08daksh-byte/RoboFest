import React from 'react';
import Link from 'next/link';

export default function RecordsLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">OPERATIONAL RECORDS</h1><span className="sim-badge">OPERATIONAL</span></div><p className="page-subtitle">RoboFest real-time event history and safety logs</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/records/history" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Event History</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>View authoritative operational safety logs and system events</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
