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
    // Add escape key listener to exit immersive
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
    backgroundColor: 'var(--bg-main)',
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
        padding: '12px 24px', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-panel)',
        minHeight: '52px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '1px', fontWeight: 600, color: 'var(--text-main)' }}>RF6 DIGITAL TWIN</h1>
          {immersive && safetyState.level === 'NORMAL' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--good)', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', border: '1px solid var(--good)', borderRadius: '4px' }}>
              <ShieldCheck size={14} /> SAFETY: NORMAL
            </span>
          )}
          {immersive && safetyState.level !== 'NORMAL' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--critical)', fontSize: '0.8rem', fontWeight: 600, padding: '4px 8px', border: '1px solid var(--critical)', borderRadius: '4px', animation: 'pulse 2s infinite' }}>
              <AlertTriangle size={14} /> SAFETY: {safetyState.level}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="sim-badge" style={{ margin: 0 }}>SIMULATED</span>
          <button 
            onClick={() => setImmersive(!immersive)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--bg-card)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              padding: '6px 12px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            {immersive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
        minHeight: '70px',
        padding: '0 24px',
        alignItems: 'center',
        gap: '32px'
      }}>
        <div className="ui-metric" style={{ border: 'none', flexDirection: 'column', gap: '4px', padding: 0 }}>
          <span className="ui-metric-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>ROBOT STATUS</span>
          <span className="ui-metric-value" style={{ color: 'var(--good)' }}>ONLINE</span>
        </div>
        <div className="ui-metric" style={{ border: 'none', flexDirection: 'column', gap: '4px', padding: 0 }}>
          <span className="ui-metric-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>POWER</span>
          <span className="ui-metric-value" style={{ color: robot.powerConnected ? 'var(--good)' : 'var(--critical)' }}>EXTERNAL CABLE</span>
        </div>
        <div className="ui-metric" style={{ border: 'none', flexDirection: 'column', gap: '4px', padding: 0 }}>
          <span className="ui-metric-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>MAGNET</span>
          <span className="ui-metric-value" style={{ color: electromagnet.enabled ? 'var(--warning)' : 'var(--good)' }}>{electromagnet.enabled ? 'LOCKED' : 'RELEASED'}</span>
        </div>
        <div className="ui-metric" style={{ border: 'none', flexDirection: 'column', gap: '4px', padding: 0 }}>
          <span className="ui-metric-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>TORCH</span>
          <span className="ui-metric-value" style={{ color: torch.enabled ? 'var(--accent)' : 'var(--text-main)' }}>{torch.enabled ? 'IGNITED' : 'OFF'}</span>
        </div>
      </footer>
    </div>
  );
}
