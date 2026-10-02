"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';
import { MissionStatus } from '@/lib/domain';

export default function SafetyEmergencyPage() {
  const { safety, systemMode, setRobotState, setMission, mission } = usePlatformStore();
  const [confirmingEStop, setConfirmingEStop] = useState(false);

  const handleEStop = () => {
    if (!confirmingEStop) {
      setConfirmingEStop(true);
      return;
    }
    // Modify through platform layer via simulator scenario override
    telemetrySimulator.setScenario(SimulationScenario.EMERGENCY_STOP);
    setConfirmingEStop(false);
  };

  const handleStopRobot = () => {
    if (mission.status === MissionStatus.IN_PROGRESS) {
      setMission({ status: MissionStatus.INTERRUPTED });
    }
    // We would normally zero velocity commands here in a real robot layer
  };

  const handleTorchOff = () => {
    setRobotState({ torchEnabled: false });
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Emergency Control</h1>
        <p>Manual safety overrides and emergency stopping.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Simulated Control Panel</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <button 
              onClick={handleEStop}
              style={{ 
                padding: '24px', background: confirmingEStop ? '#da3633' : '#a40e26', 
                color: 'white', border: '2px solid #ff7b72', borderRadius: '8px', 
                fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: confirmingEStop ? '0 0 20px rgba(218, 54, 51, 0.8)' : 'none'
              }}
            >
              {confirmingEStop ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}
            </button>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={handleStopRobot}
                style={{ flex: 1, padding: '16px', background: '#d29922', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                STOP ROBOT
              </button>
              <button 
                onClick={handleTorchOff}
                style={{ flex: 1, padding: '16px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                TORCH OFF
              </button>
            </div>
          </div>
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ color: '#c9d1d9', borderBottom: '1px solid #30363d', paddingBottom: '12px', marginBottom: '20px' }}>Safety Engine State</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '4px' }}>E-Stop State</div>
              <div style={{ fontSize: '1.2rem', color: safety.emergencyStateActive ? '#f85149' : '#2ea043' }}>
                {safety.emergencyStateActive ? 'ACTIVE' : 'CLEAR'}
              </div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '4px' }}>Safety Level</div>
              <div style={{ fontSize: '1.2rem', color: safety.level === 'NORMAL' ? '#2ea043' : '#f85149' }}>
                {safety.level}
              </div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '4px' }}>Movement Permission</div>
              <div style={{ fontSize: '1.2rem', color: safety.movementPermission ? '#2ea043' : '#f85149' }}>
                {safety.movementPermission ? 'GRANTED' : 'DENIED'}
              </div>
            </div>
            <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '4px' }}>Torch Permission</div>
              <div style={{ fontSize: '1.2rem', color: safety.torchPermission ? '#2ea043' : '#f85149' }}>
                {safety.torchPermission ? 'GRANTED' : 'DENIED'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
