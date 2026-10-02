import React from 'react';
import Link from 'next/link';

export default function ShipLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Ship</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Ship</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/ship/map" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Ship / Hull Map</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Ship / Hull Map module</div>
            </div>
          </Link>
          
          <Link href="/ship/internal-structure" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Internal Structure</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Internal Structure module</div>
            </div>
          </Link>
          
          <Link href="/ship/shipyard" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Digital Shipyard</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Digital Shipyard module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
