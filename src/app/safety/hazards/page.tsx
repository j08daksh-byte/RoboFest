"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function SafetyHazardsPage() {
  const { safety, systemMode } = usePlatformStore();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'NORMAL': return '#2ea043';
      case 'WARNING': return '#d29922';
      case 'CRITICAL':
      case 'TORCH_OFF':
      case 'ROBOT_STOP':
      case 'ALARM':
      case 'EVACUATION': return '#f85149';
      default: return '#8b949e';
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">SAFETY & HAZARDS</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic safety hierarchy and active interlocks.</p>
      </header>
      
      <main className="grid-2-col">
        
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>CURRENT STATE</h2>
          </div>
          <div className="ui-panel-body">
            <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '16px' }}>
              <div className="heading-technical" style={{ justifyContent: 'center' }}>SAFETY LEVEL</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 700, color: getLevelColor(safety.level), letterSpacing: '1px' }}>{safety.level}</div>
            </div>

            <div className="grid-2-col" style={{ marginBottom: '24px' }}>
              <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
                <div className="metric-label" style={{ marginBottom: '8px' }}>Movement Permission</div>
                <div className="metric-value" style={{ fontSize: '1.2rem', color: safety.movementPermission ? 'var(--good)' : 'var(--critical)' }}>
                  {safety.movementPermission ? 'GRANTED' : 'DENIED'}
                </div>
              </div>
              <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
                <div className="metric-label" style={{ marginBottom: '8px' }}>Torch Permission</div>
                <div className="metric-value" style={{ fontSize: '1.2rem', color: safety.torchPermission ? 'var(--good)' : 'var(--critical)' }}>
                  {safety.torchPermission ? 'GRANTED' : 'DENIED'}
                </div>
              </div>
            </div>
            
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>E-Stop State</div>
              <div className="metric-value" style={{ fontSize: '1.2rem', color: safety.emergencyStateActive ? 'var(--critical)' : 'var(--good)' }}>
                {safety.emergencyStateActive ? 'ACTIVE' : 'CLEAR'}
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>ACTIVE HAZARDS</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {safety.activeHazards.length === 0 ? (
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-state-title" style={{ color: 'var(--good)' }}>NO ACTIVE HAZARDS</div>
                <div>System is clear. Safety conditions nominal.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {safety.activeHazards.map(hazard => (
                  <div key={hazard.id} className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '16px', borderLeft: `4px solid ${hazard.severity === 'HIGH' ? 'var(--critical)' : 'var(--warning)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{hazard.id}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(hazard.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: hazard.severity === 'HIGH' ? 'var(--critical)' : 'var(--warning)' }}>{hazard.description}</div>
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Severity: {hazard.severity}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>ARCHITECTURE NOTE:</strong> Safety decisions displayed here are generated by deterministic platform rules processing live simulated telemetry. UI logic does not compute safety states.
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
