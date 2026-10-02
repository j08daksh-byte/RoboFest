"use client";

import React, { useState, useEffect } from 'react';
import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';
import { useRobotStore } from '@/lib/robotState';
import { usePlatformStore } from '@/lib/platformStore';
import { Maximize2, Minimize2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RobotTwinPage() {
  const [immersive, setImmersive] = useState(false);
  const { electromagnet, torch } = useRobotStore();
  const robot = usePlatformStore(state => state.robot);
  const safetyState = usePlatformStore(state => state.safety);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && immersive) {
        setImmersive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [immersive]);

  const containerClasses = `digital-twin-workspace ${immersive ? 'immersive-mode' : ''}`;
  
  const containerStyle: React.CSSProperties = immersive ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'var(--bg-dark)',
    display: 'flex',
    flexDirection: 'column'
  } : {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    position: 'relative'
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 var(--sp-16)', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-panel)',
        minHeight: '48px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', fontWeight: 700, color: 'var(--accent)' }}>RF6 DIGITAL TWIN</h1>
          {immersive && safetyState.level === 'NORMAL' && (
            <span className="status-badge good">
              <ShieldCheck size={14} style={{ marginRight: '4px' }} /> SAFETY: NORMAL
            </span>
          )}
          {immersive && safetyState.level !== 'NORMAL' && (
            <span className="status-badge critical" style={{ animation: 'pulse 2s infinite' }}>
              <AlertTriangle size={14} style={{ marginRight: '4px' }} /> SAFETY: {safetyState.level}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="status-badge simulated">SIMULATED</span>
          <button 
            onClick={() => setImmersive(!immersive)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--bg-card)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-sm)', 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              textTransform: 'uppercase'
            }}
          >
            {immersive ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {immersive ? 'EXIT IMMERSIVE' : 'IMMERSIVE'}
          </button>
        </div>
      </header>
      
      <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div className="twin-wrapper">
            <DigitalTwin />
          </div>
        </div>
        
        <div style={{ 
          width: '320px', 
          backgroundColor: 'var(--bg-panel)', 
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowX: 'hidden',
          zIndex: 10
        }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ControlPanel mode="full" />
          </div>
        </div>
      </main>
      
      <footer style={{
        display: 'flex',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-panel)',
        minHeight: '60px',
        padding: '0 var(--sp-24)',
        alignItems: 'center',
        gap: '40px',
        flexShrink: 0
      }}>
        <div className="metric-group">
          <span className="metric-label">ROBOT STATUS</span>
          <span className="metric-value" style={{ color: 'var(--good)' }}>ONLINE</span>
        </div>
        <div className="metric-group">
          <span className="metric-label">POWER</span>
          <span className="metric-value" style={{ color: robot.powerConnected ? 'var(--good)' : 'var(--critical)' }}>EXTERNAL CABLE</span>
        </div>
        <div className="metric-group">
          <span className="metric-label">MAGNET</span>
          <span className="metric-value" style={{ color: electromagnet.enabled ? 'var(--warning)' : 'var(--good)' }}>{electromagnet.enabled ? 'LOCKED' : 'RELEASED'}</span>
        </div>
        <div className="metric-group">
          <span className="metric-label">TORCH</span>
          <span className="metric-value" style={{ color: torch.enabled ? 'var(--accent)' : 'var(--text-main)' }}>{torch.enabled ? 'IGNITED' : 'OFF'}</span>
        </div>
      </footer>
    </div>
  );
}
