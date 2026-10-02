"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { LineChart, BarChart4 } from 'lucide-react';

export default function IntelligenceAnalyticsPage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ANALYTICS & METRICS</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Long-term data aggregation and operational analysis.</p>
      </header>
      
      <main className="grid-2-col">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">OPERATIONAL EFFICIENCY</h2>
          </div>
          <div className="ui-panel-body" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state" style={{ border: 'none' }}>
              <LineChart size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
              <div className="empty-state-title">INSUFFICIENT DATA</div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">CONSUMABLE USAGE</h2>
          </div>
          <div className="ui-panel-body" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state" style={{ border: 'none' }}>
              <BarChart4 size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
              <div className="empty-state-title">INSUFFICIENT DATA</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
