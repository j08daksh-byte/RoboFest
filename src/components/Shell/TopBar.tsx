"use client";

import React from 'react';
import { useRobotStore } from '@/lib/robotState';
import { 
  Wifi,
  WifiOff,
  ActivitySquare,
  AlertTriangle,
  UserCircle
} from 'lucide-react';

export function TopBar() {
  const simulationState = useRobotStore(state => state.simulationState);
  
  // Fake visual placeholders for Phase 3 shell
  const isSimulated = true;
  const isConnected = true;
  const missionStatus = "PLANNED";
  const safetyStatus = "NORMAL";

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className={`status-indicator ${isSimulated ? 'simulated' : 'live'}`}>
          {isSimulated ? <ActivitySquare size={16} /> : <Wifi size={16} />}
          {isSimulated ? 'SIMULATION MODE' : 'LIVE SYSTEM'}
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
          MISSION: {missionStatus}
        </div>
        
        <div className="status-indicator" style={{ border: '1px solid #2ea043', color: '#2ea043' }}>
          SAFETY: {safetyStatus}
        </div>
        
        <div style={{ marginLeft: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCircle size={24} />
          <span style={{ fontSize: '0.85rem' }}>Operator 01</span>
        </div>
      </div>
    </header>
  );
}
