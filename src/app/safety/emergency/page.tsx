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
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">EMERGENCY CONTROL</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Manual safety overrides and emergency stopping.</p>
      </header>
      
      <main className="grid-2-col-asym">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="ui-panel" style={{ padding: '32px', borderColor: 'var(--critical)', background: 'color-mix(in srgb, var(--critical) 5%, var(--bg-card))' }}>
            <div className="ui-panel-header" style={{ borderBottom: '1px solid var(--critical)', paddingBottom: '16px' }}>
              <h2 className="heading-technical" style={{ color: 'var(--critical)', marginBottom: 0 }}>PRIMARY OVERRIDE</h2>
            </div>
            <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button 
                onClick={handleEStop}
                style={{ 
                  padding: '32px', background: confirmingEStop ? '#da3633' : '#a40e26', 
                  color: 'white', border: '2px solid #ff7b72', borderRadius: '8px', 
                  fontSize: '1.5rem', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '1px',
                  transition: 'all 0.2s',
                  boxShadow: confirmingEStop ? '0 0 30px rgba(218, 54, 51, 0.8)' : '0 4px 12px rgba(164, 14, 38, 0.5)'
                }}
              >
                {confirmingEStop ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}
              </button>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical" style={{ marginBottom: 0 }}>SECONDARY CONTROLS</h2>
            </div>
            <div className="ui-panel-body grid-2-col">
              <button 
                onClick={handleStopRobot}
                style={{ padding: '20px', background: 'var(--warning)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
              >
                STOP ROBOT
              </button>
              <button 
                onClick={handleTorchOff}
                style={{ padding: '20px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
              >
                TORCH OFF
              </button>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>SAFETY ENGINE STATE</h2>
          </div>
          <div className="ui-panel-body grid-1-col">
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '20px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>E-Stop State</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: safety.emergencyStateActive ? 'var(--critical)' : 'var(--good)' }}>
                {safety.emergencyStateActive ? 'ACTIVE' : 'CLEAR'}
              </div>
            </div>
            <div className="ui-panel" style={{ background: 'var(--bg-dark)', padding: '20px' }}>
              <div className="metric-label" style={{ marginBottom: '8px' }}>Safety Level</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: safety.level === 'NORMAL' ? 'var(--good)' : 'var(--critical)' }}>
                {safety.level}
              </div>
            </div>
            
            <div className="grid-2-col" style={{ marginTop: '12px' }}>
              <div className="metric-group">
                <div className="metric-label">Movement Permission</div>
                <div className="metric-value" style={{ color: safety.movementPermission ? 'var(--good)' : 'var(--critical)' }}>
                  {safety.movementPermission ? 'GRANTED' : 'DENIED'}
                </div>
              </div>
              <div className="metric-group">
                <div className="metric-label">Torch Permission</div>
                <div className="metric-value" style={{ color: safety.torchPermission ? 'var(--good)' : 'var(--critical)' }}>
                  {safety.torchPermission ? 'GRANTED' : 'DENIED'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
