"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Gauge } from 'lucide-react';

export default function IntelligenceTelemetryPage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">RAW TELEMETRY STREAM</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">High-frequency data ingestion logs.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel">
          <div className="ui-panel-body" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state" style={{ border: 'none' }}>
              <Gauge size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
              <div className="empty-state-title">STREAM PAUSED</div>
              <div>Raw telemetry stream visualization is not available in demo mode.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
