import React from 'react';
import Link from 'next/link';

export default function OperationsLandingPage() {
  return (
    <div className="page-container">
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Operations</h1><span className="sim-badge">SIMULATED / DEMO</span></div><p className="page-subtitle">Overview and sub-modules for Operations</p></header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          
          <Link href="/command-center" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Command Center</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Command Center module</div>
            </div>
          </Link>
          
          <Link href="/operations/missions" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Missions</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Missions module</div>
            </div>
          </Link>
          
          <Link href="/operations/planner" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">Cutting Planner</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open Cutting Planner module</div>
            </div>
          </Link>
          
          <Link href="/operations/cut-strategy" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">AI Cut Strategy</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open AI Cut Strategy module</div>
            </div>
          </Link>
          
        </div>
      </main>
    </div>
  );
}
