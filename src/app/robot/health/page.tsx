"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function RobotHealthPage() {
  const { robot, sensor, systemMode } = usePlatformStore();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'HEALTHY': return '#2ea043';
      case 'WARNING': return '#d29922';
      case 'CRITICAL': return '#f85149';
      default: return '#8b949e';
    }
  };

  const evalBattery = () => {
    if (robot.batteryVoltage < 21) return 'CRITICAL';
    if (robot.batteryVoltage < 23) return 'WARNING';
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
    { name: 'Battery System', status: evalBattery(), detail: `${robot.batteryVoltage.toFixed(1)}V / ${robot.batteryPercentage}%` },
    { name: 'Drive Motors', status: evalMotors(), detail: `Max ${Math.max(sensor.motors.tempLeft, sensor.motors.tempRight)}°C` },
    { name: 'Gas / Torch', status: evalGas(), detail: `Oxy: ${sensor.gas.oxyPressurePsi.toFixed(0)} PSI` },
    { name: 'Sensors / IMU', status: sensor.metadata.isStale ? 'WARNING' : 'HEALTHY', detail: sensor.metadata.isStale ? 'Stale Data' : 'Active' },
    { name: 'Electromagnet', status: 'HEALTHY', detail: `Current: ${sensor.hardware.electromagnetCurrent.toFixed(1)}A` },
    { name: 'Vibration', status: sensor.hardware.vibrationLevel > 1.5 ? 'WARNING' : 'HEALTHY', detail: `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²` }
  ];

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Robot Health Summary</h1>
        <p>Deterministic component health analysis from telemetry.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ color: getStatusColor(robot.overallHealth), fontSize: '2rem', marginBottom: '8px' }}>
            {robot.overallHealth}
          </h2>
          <p style={{ color: '#8b949e' }}>OVERALL SYSTEM HEALTH</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {subsystems.map(sys => (
            <div key={sys.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
              <div>
                <h4 style={{ color: '#c9d1d9', margin: '0 0 4px 0' }}>{sys.name}</h4>
                <div style={{ color: '#8b949e', fontSize: '0.9rem' }}>{sys.detail}</div>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: `${getStatusColor(sys.status)}20`, color: getStatusColor(sys.status), border: `1px solid ${getStatusColor(sys.status)}` }}>
                {sys.status}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid #d29922', borderRadius: '6px', color: '#d29922', fontSize: '0.85rem' }}>
          <strong>Note:</strong> This is a simulation health model. Values map deterministically from active telemetry.
        </div>
      </main>
    </div>
  );
}
