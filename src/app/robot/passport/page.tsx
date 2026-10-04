"use client";

import React, { useEffect, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { getAnalytics } from '@/lib/api/analytics';

export default function RobotPassportPage() {
  const { systemMode } = usePlatformStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAnalytics('all')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  const completedMissionsCount = stats?.missions?.completed || 0;
  const emergencyStopsCount = stats?.safety?.estops || 0;
  const panelsRemovedCount = stats?.cuts?.completed || 0; // Using completed cuts as proxy for panels removed in this context
  const cutsCompletedCount = stats?.cuts?.completed || 0;
  const operatingHours = stats?.robot?.totalRuntimeSeconds ? (stats.robot.totalRuntimeSeconds / 3600).toFixed(2) : '0.00';

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBOT PASSPORT</h1>
          <span className={`status-badge ${systemMode.toLowerCase()}`}>[{systemMode}]</span>
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
              <span className="metric-value">{stats?.robot?.firstOperationalTimestamp ? new Date(stats.robot.firstOperationalTimestamp).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="metric-group">
              <span className="metric-label">Operating Time</span>
              <span className="metric-value" style={{ color: 'var(--text-muted)' }}>{operatingHours} hrs ({systemMode})</span>
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
              <div className="metric-row"><span className="metric-label">Total Missions Started</span><span className="metric-value">{stats?.missions?.total || 0}</span></div>
              <div className="metric-row"><span className="metric-label">Missions Completed</span><span className="metric-value" style={{color: completedMissionsCount > 0 ? 'var(--good)' : 'var(--text-main)'}}>{completedMissionsCount}</span></div>
              <div className="metric-row"><span className="metric-label">Total Cuts Completed</span><span className="metric-value" style={{color: cutsCompletedCount > 0 ? 'var(--good)' : 'var(--text-main)'}}>{cutsCompletedCount}</span></div>
              <div className="metric-row"><span className="metric-label">Total Panels Removed</span><span className="metric-value" style={{color: panelsRemovedCount > 0 ? 'var(--good)' : 'var(--text-main)'}}>{panelsRemovedCount}</span></div>
              <div className="metric-row"><span className="metric-label">Operating Hours</span><span className="metric-value">{operatingHours} h</span></div>
            </div>
          </div>

          {/* Safety & Maintenance */}
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">LIFECYCLE EVENTS</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row">
                <span className="metric-label">Safety Events (e.g. E-Stops)</span>
                <span className="metric-value" style={{color: emergencyStopsCount > 0 ? 'var(--critical)' : 'var(--good)'}}>{emergencyStopsCount}</span>
              </div>
              <div className="metric-row"><span className="metric-label">Maintenance Events</span><span className="metric-value">{stats?.robot?.maintenanceEvents || 0}</span></div>
              <div className="metric-row"><span className="metric-label">Hardware Faults</span><span className="metric-value" style={{color: stats?.robot?.faultCount > 0 ? 'var(--critical)' : 'var(--good)'}}>{stats?.robot?.faultCount || 0}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
