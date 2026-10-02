"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionStatus } from '@/lib/domain';

export default function RobotPassportPage() {
  const { systemMode, events } = usePlatformStore();

  const completedMissionsCount = events.filter(e => e.message.includes(MissionStatus.COMPLETED)).length;
  const emergencyStopsCount = events.filter(e => e.category === 'SAFETY' && e.message.includes('EVACUATION') || e.message.includes('EMERGENCY_STOP')).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBOT PASSPORT</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational lifecycle and historical metrics.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>IDENTITY & LIFECYCLE</h2>
          </div>
          <div className="ui-panel-body grid-4-col">
            <div className="metric-group">
              <div className="metric-label">Robot Serial</div>
              <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>RBG-6.0-PROTO</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Current Mode</div>
              <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>{systemMode}</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Commissioned</div>
              <div className="metric-value" style={{ fontSize: '1.2rem' }}>2026-10-01</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Operating Time</div>
              <div className="metric-value" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NOT AVAILABLE IN SIMULATION</div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>OPERATIONAL METRICS</h2>
          </div>
          <div className="ui-panel-body grid-4-col">
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>Completed Missions</div>
              <div className="metric-value" style={{ fontSize: '2rem', color: 'var(--good)' }}>{completedMissionsCount}</div>
            </div>
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>Emergency Stops</div>
              <div className="metric-value" style={{ fontSize: '2rem', color: 'var(--critical)' }}>{emergencyStopsCount}</div>
            </div>
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>Total Cuts</div>
              <div className="metric-value" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>NOT AVAILABLE IN SIMULATION</div>
            </div>
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>Maintenance Events</div>
              <div className="metric-value" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>NOT AVAILABLE IN SIMULATION</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
