"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MissionStatus } from '@/lib/domain';

export default function RobotPassportPage() {
  const { systemMode, events } = usePlatformStore();

  const completedMissionsCount = events.filter(e => e.message.includes(MissionStatus.COMPLETED)).length;
  const emergencyStopsCount = events.filter(e => e.category === 'SAFETY' && e.message.includes('EVACUATION') || e.message.includes('EMERGENCY_STOP')).length;

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Robot Passport</h1>
        <p>Operational lifecycle and historical metrics.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Identity & Lifecycle</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Robot Serial</div>
              <div style={{ fontSize: '1.2rem', color: '#58a6ff' }}>RBG-6.0-PROTO</div>
            </div>
            <div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Current Mode</div>
              <div style={{ fontSize: '1.2rem', color: '#d29922' }}>{systemMode}</div>
            </div>
            <div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Commissioned</div>
              <div style={{ fontSize: '1.1rem' }}>2026-10-01</div>
            </div>
            <div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Operating Time</div>
              <div style={{ fontSize: '1.1rem', color: '#8b949e' }}>NOT AVAILABLE IN CURRENT SIMULATION</div>
            </div>
          </div>
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Operational Metrics</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '8px' }}>Total Completed Missions</div>
              <div style={{ fontSize: '2rem', color: '#2ea043' }}>{completedMissionsCount}</div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '8px' }}>Emergency Stops Triggered</div>
              <div style={{ fontSize: '2rem', color: '#f85149' }}>{emergencyStopsCount}</div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '8px' }}>Total Cuts Performed</div>
              <div style={{ fontSize: '1rem', color: '#8b949e', marginTop: '10px' }}>NOT AVAILABLE IN CURRENT SIMULATION</div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '8px' }}>Maintenance Events</div>
              <div style={{ fontSize: '1rem', color: '#8b949e', marginTop: '10px' }}>NOT AVAILABLE IN CURRENT SIMULATION</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
