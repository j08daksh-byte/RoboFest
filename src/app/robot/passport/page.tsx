"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionStatus } from '@/lib/domain';

export default function RobotPassportPage() {
  const { systemMode, events } = usePlatformStore();

  const completedMissionsCount = events.filter(e => e.message.includes(MissionStatus.COMPLETED)).length;
  const emergencyStopsCount = events.filter(e => e.category === 'SAFETY' && (e.message.includes('EVACUATION') || e.message.includes('EMERGENCY_STOP'))).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBOT PASSPORT</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational lifecycle and historical metrics.</p>
      </header>
      
      <main className="grid-1-col">
        {/* Robot Identity Strip */}
        <div className="ui-panel" style={{ background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-panel))', borderLeft: '4px solid var(--accent)' }}>
          <div className="ui-panel-body grid-4-col" style={{ padding: '24px' }}>
            <div className="metric-group">
              <span className="metric-label">Robot Serial</span>
              <span className="metric-value" style={{ color: 'var(--accent)', fontSize: '24px' }}>RBG-6.0-PROTO</span>
            </div>
            <div className="metric-group">
              <span className="metric-label">Current Mode</span>
              <span className="metric-value">{systemMode.replace('_', ' ')}</span>
            </div>
            <div className="metric-group">
              <span className="metric-label">Commissioned</span>
              <span className="metric-value">2026-10-01</span>
            </div>
            <div className="metric-group">
              <span className="metric-label">Operating Time</span>
              <span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A (SIMULATION)</span>
            </div>
          </div>
        </div>

        <div className="grid-2-col">
          {/* Mission & Operations */}
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">OPERATIONAL STATISTICS</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row"><span className="metric-label">Total Missions Started</span><span className="metric-value">0</span></div>
              <div className="metric-row"><span className="metric-label">Missions Completed</span><span className="metric-value" style={{color: completedMissionsCount > 0 ? 'var(--good)' : 'var(--text-main)'}}>{completedMissionsCount}</span></div>
              <div className="metric-row"><span className="metric-label">Total Panels Removed</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A</span></div>
              <div className="metric-row"><span className="metric-label">Steel Weight Removed (Est)</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A</span></div>
              <div className="metric-row"><span className="metric-label">Operating Hours</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A</span></div>
            </div>
          </div>

          {/* Safety & Maintenance */}
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">LIFECYCLE EVENTS</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row">
                <span className="metric-label">Emergency Stops</span>
                <span className="metric-value" style={{color: emergencyStopsCount > 0 ? 'var(--critical)' : 'var(--good)'}}>{emergencyStopsCount}</span>
              </div>
              <div className="metric-row"><span className="metric-label">Safety Overrides</span><span className="metric-value">0</span></div>
              <div className="metric-row"><span className="metric-label">Component Replacements</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A</span></div>
              <div className="metric-row"><span className="metric-label">Scheduled Maintenance</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>N/A</span></div>
              <div className="metric-row"><span className="metric-label">Last Firmware Update</span><span className="metric-value">v6.0.0-rc1</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
