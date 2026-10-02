"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionControls } from '@/components/MissionControls';

export default function OperationsMissionsPage() {
  const { mission, events, systemMode } = usePlatformStore();

  const missionEvents = events.filter(e => e.missionId === mission.id);

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Mission Management</h1>
        <p>Operational planning and execution state.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #30363d', paddingBottom: '12px' }}>
              <h2 style={{ color: '#c9d1d9', margin: 0 }}>Current Mission State</h2>
              <div style={{ padding: '4px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', fontWeight: 'bold', color: mission.status === 'IN_PROGRESS' ? '#2ea043' : '#58a6ff' }}>
                {mission.status}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Mission ID</div>
                <div style={{ fontSize: '1.1rem', color: '#c9d1d9' }}>{mission.id || 'None'}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Ship / Hull Section</div>
                <div style={{ fontSize: '1.1rem', color: '#c9d1d9' }}>{mission.shipName || 'N/A'} / {mission.hullSection || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Objective</div>
                <div style={{ fontSize: '1.1rem', color: '#c9d1d9' }}>{mission.objective || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Start Time</div>
                <div style={{ fontSize: '1.1rem', color: '#c9d1d9' }}>{mission.startTime ? new Date(mission.startTime).toLocaleString() : 'Not started'}</div>
              </div>
              <div>
                <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Est. Completion</div>
                <div style={{ fontSize: '1.1rem', color: '#c9d1d9' }}>{mission.estimatedCompletionTime ? new Date(mission.estimatedCompletionTime).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8b949e' }}>Mission Progress</span>
                <span style={{ color: '#c9d1d9', fontWeight: 'bold' }}>{mission.progressPercentage.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${mission.progressPercentage}%`, height: '100%', background: '#2ea043', transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px' }}>
            <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Mission Event Timeline</h2>
            {missionEvents.length === 0 ? (
              <div style={{ color: '#8b949e', textAlign: 'center', padding: '20px' }}>No events recorded for this mission yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missionEvents.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#0d1117', borderRadius: '6px', border: '1px solid #30363d' }}>
                    <div style={{ color: '#8b949e', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{new Date(ev.timestamp).toLocaleTimeString()}</div>
                    <div>
                      <div style={{ color: ev.severity === 'CRITICAL' ? '#f85149' : (ev.severity === 'WARNING' ? '#d29922' : '#c9d1d9'), fontWeight: 'bold', fontSize: '0.9rem' }}>
                        [{ev.category}]
                      </div>
                      <div style={{ color: '#c9d1d9', fontSize: '0.9rem', marginTop: '4px' }}>{ev.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', height: 'fit-content' }}>
          <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Demo Controls</h2>
          <MissionControls />
          <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#8b949e' }}>
            These actions execute against the deterministic platform state machine. Invalid transitions are blocked.
          </div>
        </div>
      </main>
    </div>
  );
}
