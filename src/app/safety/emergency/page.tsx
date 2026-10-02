"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';
import { MissionStatus } from '@/lib/domain';
import { ShieldAlert, Octagon, ZapOff } from 'lucide-react';

export default function SafetyEmergencyPage() {
  const { safety, systemMode, setRobotState, setMission, mission } = usePlatformStore();
  const [confirmingEStop, setConfirmingEStop] = useState(false);

  const handleEStop = () => {
    if (!confirmingEStop) {
      setConfirmingEStop(true);
      return;
    }
    telemetrySimulator.setScenario(SimulationScenario.EMERGENCY_STOP);
    setConfirmingEStop(false);
  };

  const handleStopRobot = () => {
    if (mission.status === MissionStatus.IN_PROGRESS) {
      setMission({ status: MissionStatus.INTERRUPTED });
    }
  };

  const handleTorchOff = () => {
    setRobotState({ torchEnabled: false });
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">EMERGENCY CONTROL</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Manual safety overrides and emergency stopping.</p>
      </header>
      
      <main className="grid-2-col-asym">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel" style={{ borderColor: 'var(--critical)', background: 'color-mix(in srgb, var(--critical) 5%, var(--bg-card))' }}>
            <div className="ui-panel-header" style={{ borderBottom: '1px solid color-mix(in srgb, var(--critical) 20%, transparent)' }}>
              <h2 className="heading-technical" style={{ color: 'var(--critical)', border: 'none' }}>PRIMARY OVERRIDE</h2>
            </div>
            <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--sp-24)' }}>
              <button 
                onClick={handleEStop}
                style={{ 
                  padding: 'var(--sp-24)', background: confirmingEStop ? '#da3633' : '#a40e26', 
                  color: 'white', border: confirmingEStop ? '2px solid white' : '2px solid #ff7b72', borderRadius: 'var(--radius-md)', 
                  fontSize: '24px', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                  transition: 'all 0.2s',
                  boxShadow: confirmingEStop ? '0 0 30px rgba(218, 54, 51, 0.8)' : '0 4px 12px rgba(164, 14, 38, 0.5)'
                }}
              >
                <ShieldAlert size={32} />
                {confirmingEStop ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP'}
              </button>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">SECONDARY CONTROLS</h2>
            </div>
            <div className="ui-panel-body grid-2-col">
              <button 
                onClick={handleStopRobot}
                style={{ padding: 'var(--sp-16)', background: 'var(--warning)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Octagon size={18} /> STOP ROBOT
              </button>
              <button 
                onClick={handleTorchOff}
                style={{ padding: 'var(--sp-16)', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ZapOff size={18} /> TORCH OFF
              </button>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">SAFETY ENGINE STATE</h2>
          </div>
          <div className="ui-panel-body">
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
              <div style={{ background: 'var(--bg-dark)', padding: 'var(--sp-16)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span className="metric-label" style={{ marginBottom: '8px', display: 'block' }}>E-Stop State</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: safety.emergencyStateActive ? 'var(--critical)' : 'var(--good)' }}>
                  {safety.emergencyStateActive ? 'ACTIVE' : 'CLEAR'}
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-dark)', padding: 'var(--sp-16)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span className="metric-label" style={{ marginBottom: '8px', display: 'block' }}>Safety Level</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: safety.level === 'NORMAL' ? 'var(--good)' : 'var(--critical)' }}>
                  {safety.level}
                </span>
              </div>
              
              <div className="grid-2-col" style={{ marginTop: 'var(--sp-8)' }}>
                <div className="metric-group">
                  <span className="metric-label">Movement Permission</span>
                  <span className={`status-badge ${safety.movementPermission ? 'good' : 'critical'}`}>
                    {safety.movementPermission ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Torch Permission</span>
                  <span className={`status-badge ${safety.torchPermission ? 'good' : 'critical'}`}>
                    {safety.torchPermission ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
