"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SafetyHazardsPage() {
  const { safety, systemMode } = usePlatformStore();

  const isNormal = safety.level === 'NORMAL';

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">SAFETY & HAZARDS</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic safety hierarchy and active interlocks.</p>
      </header>
      
      <main className="grid-2-col-asym">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">CURRENT STATE</h2>
            </div>
            <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-24)' }}>
              
              <div style={{ 
                background: isNormal ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                border: `1px solid ${isNormal ? 'var(--good)' : 'var(--critical)'}`,
                padding: 'var(--sp-24)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--sp-8)'
              }}>
                <div className="heading-technical" style={{ border: 'none', color: isNormal ? 'var(--good)' : 'var(--critical)' }}>SAFETY LEVEL</div>
                <div style={{ fontSize: '48px', fontWeight: 800, color: isNormal ? 'var(--good)' : 'var(--critical)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {isNormal ? <ShieldCheck size={40} /> : <AlertTriangle size={40} />}
                  {safety.level}
                </div>
              </div>

              <div>
                <h3 className="heading-technical" style={{ marginBottom: 'var(--sp-12)' }}>INTERLOCK PERMISSIONS</h3>
                <div className="metric-row">
                  <span className="metric-label">Movement Permission</span>
                  <span className={`status-badge ${safety.movementPermission ? 'good' : 'critical'}`}>
                    {safety.movementPermission ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Torch Permission</span>
                  <span className={`status-badge ${safety.torchPermission ? 'good' : 'critical'}`}>
                    {safety.torchPermission ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">E-Stop State</span>
                  <span className={`status-badge ${safety.emergencyStateActive ? 'critical' : 'good'}`}>
                    {safety.emergencyStateActive ? 'ACTIVE' : 'CLEAR'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">ACTIVE HAZARDS</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {safety.activeHazards.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, minHeight: '300px', justifyContent: 'center' }}>
                <ShieldCheck size={48} style={{ color: 'var(--good)', opacity: 0.5, marginBottom: 'var(--sp-16)' }} />
                <div className="empty-state-title" style={{ color: 'var(--good)' }}>NO ACTIVE HAZARDS</div>
                <div>System is clear. Safety conditions nominal.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
                {safety.activeHazards.map(hazard => (
                  <div key={hazard.id} style={{ background: 'var(--bg-dark)', padding: 'var(--sp-16)', borderLeft: `4px solid ${hazard.severity === 'HIGH' ? 'var(--critical)' : 'var(--warning)'}`, borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-8)' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{hazard.id}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(hazard.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: hazard.severity === 'HIGH' ? 'var(--critical)' : 'var(--warning)', fontSize: '13px' }}>{hazard.description}</div>
                    <div style={{ marginTop: 'var(--sp-8)' }}>
                      <span className={`status-badge ${hazard.severity === 'HIGH' ? 'critical' : 'warning'}`}>SEVERITY: {hazard.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-24)' }}>
              <div style={{ padding: 'var(--sp-12)', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--accent)' }}>ARCHITECTURE NOTE:</strong> Safety decisions displayed here are generated by deterministic platform rules processing live simulated telemetry. UI logic does not compute safety states.
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
