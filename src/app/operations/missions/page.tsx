"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionControls } from '@/components/MissionControls';

export default function OperationsMissionsPage() {
  const { mission, events, systemMode } = usePlatformStore();

  const missionEvents = events.filter(e => e.missionId === mission.id);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">MISSION MANAGEMENT</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational planning and execution state.</p>
      </header>
      
      <main className="grid-1-col">
        
        <div className="grid-2-col-asym">
          <div className="ui-panel">
            <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="heading-technical" style={{ margin: 0 }}>CURRENT MISSION STATE</h2>
              <div style={{ padding: '4px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', fontSize: '0.8rem', color: mission.status === 'IN_PROGRESS' ? 'var(--good)' : 'var(--accent)' }}>
                {mission.status}
              </div>
            </div>

            <div className="ui-panel-body grid-2-col" style={{ marginBottom: '24px' }}>
              <div className="metric-group">
                <div className="metric-label">Mission ID</div>
                <div className="metric-value">{mission.id || 'None'}</div>
              </div>
              <div className="metric-group">
                <div className="metric-label">Ship / Hull Section</div>
                <div className="metric-value">{mission.shipName || 'N/A'} / {mission.hullSection || 'N/A'}</div>
              </div>
              <div className="metric-group" style={{ gridColumn: '1 / -1' }}>
                <div className="metric-label">Objective</div>
                <div className="metric-value">{mission.objective || 'N/A'}</div>
              </div>
              <div className="metric-group">
                <div className="metric-label">Start Time</div>
                <div className="metric-value">{mission.startTime ? new Date(mission.startTime).toLocaleString() : 'Not started'}</div>
              </div>
              <div className="metric-group">
                <div className="metric-label">Est. Completion</div>
                <div className="metric-value">{mission.estimatedCompletionTime ? new Date(mission.estimatedCompletionTime).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="metric-label">Mission Progress</span>
                <span className="metric-value">{mission.progressPercentage.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ width: `${mission.progressPercentage}%`, height: '100%', background: 'var(--good)', transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          <div className="ui-panel" style={{ height: 'fit-content' }}>
            <div className="ui-panel-header">
              <h2 className="heading-technical" style={{ marginBottom: 0 }}>MISSION CONTROLS</h2>
            </div>
            <div className="ui-panel-body">
              <MissionControls />
              <div style={{ marginTop: '24px', padding: '16px', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>NOTE:</strong> These actions execute against the deterministic platform state machine. Invalid transitions are blocked.
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>MISSION EVENT TIMELINE</h2>
          </div>
          <div className="ui-panel-body">
            {missionEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">NO EVENTS RECORDED</div>
                <div>No operational events found for this mission.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missionEvents.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap', width: '100px' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                    <div>
                      <div style={{ color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : 'var(--text-secondary)'), fontWeight: 600, fontSize: '0.85rem' }}>
                        [{ev.category}]
                      </div>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginTop: '4px' }}>{ev.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
