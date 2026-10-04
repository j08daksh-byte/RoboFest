"use client";

import React, { useEffect, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function RobotHealthPage() {
  const { systemMode } = usePlatformStore();
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/robot/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(console.error);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'HEALTHY': return 'var(--good)';
      case 'WARNING': return 'var(--warning)';
      case 'CRITICAL': 
      case 'FAULT': return 'var(--critical)';
      case 'UNKNOWN': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const components = healthData?.components || [];
  
  // Aggregate overall health
  let overallHealth = 'UNKNOWN';
  if (components.length > 0) {
    if (components.some((c: any) => c.status === 'FAULT' || c.status === 'CRITICAL')) {
      overallHealth = 'CRITICAL';
    } else if (components.some((c: any) => c.status === 'WARNING' || c.status === 'DEGRADED')) {
      overallHealth = 'WARNING';
    } else if (components.every((c: any) => c.status === 'HEALTHY')) {
      overallHealth = 'HEALTHY';
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBOT HEALTH</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic component health analysis from telemetry.</p>
      </header>
      
      <main className="grid-2-col-asym">
        
        {/* Left: Component Matrix */}
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">SUBSYSTEM HEALTH MATRIX</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {components.length === 0 && (
              <div style={{ padding: '12px 0', color: 'var(--text-muted)' }}>Loading health matrix...</div>
            )}
            {components.map((comp: any, idx: number) => (
              <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx !== components.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div>
                  <div style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>{comp.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {comp.faultState || `Last obs: ${new Date(comp.lastObservedAt).toLocaleTimeString()}`}
                  </div>
                </div>
                <div className={`status-badge ${comp.status.toLowerCase()}`}>
                  {comp.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Overall / Trends */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="ui-panel">
            <div className="ui-panel-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div className="heading-technical" style={{ justifyContent: 'center', border: 'none', marginBottom: '8px' }}>OVERALL SYSTEM HEALTH</div>
              <div style={{ color: getStatusColor(overallHealth), fontSize: '32px', fontWeight: 800, letterSpacing: '1px' }}>
                {overallHealth}
              </div>
            </div>
          </div>
          
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">KEY TRENDS</h2>
            </div>
            <div className="ui-panel-body">
              {components.map((c: any) => {
                if (!c.maintenanceRecords || c.maintenanceRecords.length === 0) return null;
                const rec = c.maintenanceRecords[0];
                return (
                  <div className="metric-row" key={c.id}>
                    <span className="metric-label">{c.name} Last Service</span>
                    <span className="metric-value">{new Date(rec.performedAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
              {components.length > 0 && components.every((c: any) => !c.maintenanceRecords?.length) && (
                <div className="metric-row"><span className="metric-label" style={{ color: 'var(--text-muted)' }}>No maintenance records</span></div>
              )}
            </div>
          </div>
        </div>

      </main>
      
      <div style={{ padding: '12px', marginTop: 'auto', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '12px' }}>
        <strong>SIMULATION NOTE:</strong> This is a simulation health model. Values map deterministically from active telemetry. No live predictions are currently available.
      </div>
    </div>
  );
}
