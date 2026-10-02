"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { SystemMode, SafetyLevel } from '@/lib/domain';
import { 
  Wifi,
  WifiOff,
  ActivitySquare,
  AlertTriangle,
  UserCircle
} from 'lucide-react';

export function TopBar() {
  const { systemMode, robot, mission, safety } = usePlatformStore();
  
  const isSimulated = systemMode === SystemMode.SIMULATED || systemMode === SystemMode.DEMO;
  const isConnected = robot.status !== 'OFFLINE';
  
  // Dynamic color for safety
  const getSafetyColor = (level: SafetyLevel) => {
    switch(level) {
      case SafetyLevel.NORMAL: return 'var(--good)';
      case SafetyLevel.WARNING: return 'var(--warning)';
      case SafetyLevel.CRITICAL:
      case SafetyLevel.TORCH_OFF:
      case SafetyLevel.ROBOT_STOP:
      case SafetyLevel.ALARM:
      case SafetyLevel.EVACUATION:
        return 'var(--critical)';
      default: return 'var(--text-muted)';
    }
  };
  
  const safetyColor = getSafetyColor(safety.level);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div style={{ fontWeight: 800, letterSpacing: '1px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '2px' }}></div>
          RF6 COMMAND
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <div className={`status-indicator ${isSimulated ? 'simulated' : 'live'}`}>
          {isSimulated ? <ActivitySquare size={16} /> : <Wifi size={16} />}
          {systemMode.replace('_', ' ')}
        </div>
        
        {!isConnected && (
          <div className="status-indicator offline">
            <WifiOff size={16} />
            OFFLINE
          </div>
        )}

        <div className="status-indicator" style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          MISSION: {mission.status.replace(/_/g, ' ')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="status-indicator" style={{ border: `1px solid ${safetyColor}`, color: safetyColor, background: `color-mix(in srgb, ${safetyColor} 10%, transparent)` }}>
          <AlertTriangle size={16} />
          SAFETY: {safety.level.replace(/_/g, ' ')}
        </div>
        
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
          <UserCircle size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>OP-01</span>
        </div>

        <button 
          onClick={() => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
          }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginLeft: '8px',
            transition: 'background 0.2s'
          }}
        >
          THEME
        </button>
      </div>
    </header>
  );
}
