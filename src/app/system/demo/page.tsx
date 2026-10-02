"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function SystemDemoPage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">GUIDED DEMO</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Walkthrough scenarios for the presentation.</p>
      </header>
      
      <main className="grid-2-col-asym">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">AVAILABLE SCENARIOS</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
            <button style={{ padding: 'var(--sp-16)', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
              <strong>1. Nominal Operation</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Standard hull traversal and structural cutting.</div>
            </button>
            <button style={{ padding: 'var(--sp-16)', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
              <strong>2. Environmental Hazard</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Simulate a gas leak triggering an automated stop.</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
