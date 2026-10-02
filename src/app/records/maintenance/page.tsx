"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Wrench } from 'lucide-react';

export default function RecordsMaintenancePage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">MAINTENANCE</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Service schedules and component lifecycle tracking.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel">
          <div className="ui-panel-body" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state" style={{ border: 'none' }}>
              <Wrench size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
              <div className="empty-state-title">NO PENDING SERVICE</div>
              <div>All components are within operational parameters.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
