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
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic component health analysis from telemetry.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <h2 style={{ color: getStatusColor(robot.overallHealth), fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '1px' }}>
            {robot.overallHealth}
          </h2>
          <div className="heading-technical" style={{ justifyContent: 'center', marginBottom: 0 }}>OVERALL SYSTEM HEALTH</div>
        </div>

        <div className="grid-3-col">
          {subsystems.map(sys => (
            <div key={sys.name} className="ui-panel" style={{ padding: '20px', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.95rem' }}>{sys.name}</h4>
                <div style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, background: `color-mix(in srgb, ${getStatusColor(sys.status)} 15%, transparent)`, color: getStatusColor(sys.status), border: `1px solid color-mix(in srgb, ${getStatusColor(sys.status)} 30%, transparent)` }}>
                  {sys.status}
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                {sys.detail}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', color: 'var(--warning)', fontSize: '0.85rem' }}>
          <strong>NOTE:</strong> This is a simulation health model. Values map deterministically from active telemetry.
        </div>
      </main>
    </div>
  );
}
