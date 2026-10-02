"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Scan } from 'lucide-react';

export default function ShipInternalStructurePage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-top">
          <h1 className="page-title">INTERNAL STRUCTURE</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">X-Ray and localized internal stiffener visualization.</p>
      </header>
      
      <main style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div className="ui-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
            <Scan size={64} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-16)' }} />
            <div className="empty-state-title" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>VISUALIZATION HOST</div>
            <div style={{ color: 'var(--text-muted)' }}>[TRACK A: INTERNAL CAD VIEWER GOES HERE]</div>
          </div>
        </div>
      </main>
    </div>
  );
}
