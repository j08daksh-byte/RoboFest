"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionControls } from '@/components/MissionControls';
import { ShipCutPanel } from '@/components/ShipCutPanel';
import { CutEditor } from '@/components/CutEditor';

export default function OperationsMissionsPage() {
  const { mission, events, systemMode } = usePlatformStore();

  const missionEvents = events.filter(e => e.missionId === mission.id);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">MISSION MANAGEMENT</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational planning and execution state.</p>
      </header>
      
      <main className="grid-2-col-asym">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel">
            <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="heading-technical" style={{ margin: 0, border: 'none' }}>CURRENT MISSION STATE</h2>
              <div className={`status-badge ${mission.status === 'RUNNING' ? 'good' : 'warning'}`}>
                {mission.status.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="ui-panel-body">
              <div className="grid-2-col" style={{ marginBottom: 'var(--sp-24)' }}>
                <div className="metric-group">
                  <span className="metric-label">Mission ID</span>
                  <span className="metric-value">{mission.id || 'None'}</span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Ship / Hull Section</span>
                  <span className="metric-value">{mission.shipName || 'N/A'} / {mission.hullSection || 'N/A'}</span>
                </div>
                <div className="metric-group" style={{ gridColumn: '1 / -1' }}>
                  <span className="metric-label">Objective</span>
                  <span className="metric-value">{mission.objective || 'N/A'}</span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Start Time</span>
                  <span className="metric-value">{mission.startTime ? new Date(mission.startTime).toLocaleString() : 'Not started'}</span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Est. Completion</span>
                  <span className="metric-value">{mission.estimatedCompletionTime ? new Date(mission.estimatedCompletionTime).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              <div style={{ padding: 'var(--sp-16)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="metric-label">Mission Progress</span>
                  <span className="metric-value">{mission.progressPercentage.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <div style={{ width: `${mission.progressPercentage}%`, height: '100%', background: 'var(--good)', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-16)', alignItems: 'start' }}>
            <CutEditor />
            <ShipCutPanel />
          </div>

          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">MISSION EVENT TIMELINE</h2>
            </div>
            <div className="ui-panel-body">
              {missionEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">NO EVENTS RECORDED</div>
                  <div>No operational events found for this mission.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {missionEvents.map((ev, i) => (
                    <div key={ev.id} style={{ display: 'flex', gap: 'var(--sp-16)', padding: 'var(--sp-12) 0', borderBottom: i !== missionEvents.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap', width: '80px', paddingTop: '2px' }}>
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </div>
                      <div>
                        <div style={{ color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : 'var(--text-secondary)'), fontWeight: 600, fontSize: '11px', letterSpacing: '0.5px' }}>
                          [{ev.category}]
                        </div>
                        <div style={{ color: 'var(--text-main)', fontSize: '13px', marginTop: '4px' }}>{ev.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ui-panel" style={{ height: 'fit-content' }}>
          <div className="ui-panel-header">
            <h2 className="heading-technical">MISSION CONTROLS</h2>
          </div>
          <div className="ui-panel-body">
            <MissionControls />
            <div style={{ marginTop: 'var(--sp-24)', padding: 'var(--sp-12)', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent)' }}>NOTE:</strong> These actions execute against the deterministic platform state machine. Invalid transitions are blocked.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
