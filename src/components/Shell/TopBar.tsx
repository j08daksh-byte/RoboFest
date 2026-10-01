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
      case SafetyLevel.NORMAL: return '#2ea043';
      case SafetyLevel.WARNING: return '#d29922';
      case SafetyLevel.CRITICAL:
      case SafetyLevel.TORCH_OFF:
      case SafetyLevel.ROBOT_STOP:
      case SafetyLevel.ALARM:
      case SafetyLevel.EVACUATION:
        return '#f85149';
      default: return '#8b949e';
    }
  };
  
  const safetyColor = getSafetyColor(safety.level);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
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
      </div>
      
      <div className="top-bar-right">
        <div className="status-indicator" style={{ border: '1px solid #30363d', color: '#8b949e' }}>
          MISSION: {mission.status.replace(/_/g, ' ')}
        </div>
        
        <div className="status-indicator" style={{ border: `1px solid ${safetyColor}`, color: safetyColor }}>
          SAFETY: {safety.level.replace(/_/g, ' ')}
        </div>
        
        <div style={{ marginLeft: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCircle size={24} />
          <span style={{ fontSize: '0.85rem' }}>Operator 01</span>
        </div>
      </div>
    </header>
  );
}
