"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function RobotHealthPage() {
  const { robot, sensor, systemMode } = usePlatformStore();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'HEALTHY': return 'var(--good)';
      case 'WARNING': return 'var(--warning)';
      case 'CRITICAL': return 'var(--critical)';
      default: return 'var(--text-muted)';
    }
  };

  const evalPower = () => {
    if (!robot.powerConnected) return 'CRITICAL';
    if (robot.powerVoltage < 210) return 'WARNING';
    return 'HEALTHY';
  };

  const evalMotors = () => {
    const maxT = Math.max(sensor.motors.tempLeft, sensor.motors.tempRight);
    if (maxT > 75) return 'CRITICAL';
    if (maxT > 60) return 'WARNING';
    return 'HEALTHY';
  };

  const evalGas = () => {
    if (sensor.gas.torchStatus === 'FAULT') return 'CRITICAL';
    if (sensor.gas.oxyPressurePsi < 100) return 'WARNING';
    return 'HEALTHY';
  };

  const subsystems = [
    { name: 'External Power', status: evalPower(), detail: robot.powerConnected ? `${robot.powerVoltage.toFixed(1)}V / ${robot.powerCurrent.toFixed(1)}A` : 'DISCONNECTED' },
    { name: 'Drive Motors', status: evalMotors(), detail: `Max ${Math.max(sensor.motors.tempLeft, sensor.motors.tempRight)}°C` },
    { name: 'Gas / Torch', status: evalGas(), detail: `Oxy: ${sensor.gas.oxyPressurePsi.toFixed(0)} PSI` },
    { name: 'Sensors / IMU', status: sensor.metadata.isStale ? 'WARNING' : 'HEALTHY', detail: sensor.metadata.isStale ? 'Stale Data' : 'Active' },
    { name: 'Electromagnet', status: 'HEALTHY', detail: `Current: ${sensor.hardware.electromagnetCurrent.toFixed(1)}A` },
    { name: 'Vibration', status: sensor.hardware.vibrationLevel > 1.5 ? 'WARNING' : 'HEALTHY', detail: `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²` }
  ];

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
            {subsystems.map((sys, idx) => (
              <div key={sys.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx !== subsystems.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div>
                  <div style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 600 }}>{sys.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{sys.detail}</div>
                </div>
                <div className={`status-badge ${sys.status.toLowerCase()}`}>
                  {sys.status}
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
              <div style={{ color: getStatusColor(robot.overallHealth), fontSize: '32px', fontWeight: 800, letterSpacing: '1px' }}>
                {robot.overallHealth}
              </div>
            </div>
          </div>
          
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">KEY TRENDS</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row"><span className="metric-label">Operating Hrs</span><span className="metric-value">1,420 h</span></div>
              <div className="metric-row"><span className="metric-label">Next Service</span><span className="metric-value">45 h</span></div>
              <div className="metric-row"><span className="metric-label">Critical Faults (24h)</span><span className="metric-value">0</span></div>
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
