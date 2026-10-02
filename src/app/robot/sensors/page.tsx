"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function RobotSensorsPage() {
  const { sensor, environment, robot, systemMode } = usePlatformStore();

  const renderMetric = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">SENSOR CENTER</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Live diagnostic view of all onboard sensors.</p>
      </header>
      
      <main className="grid-3-col">
        
        <div className="ui-panel">
          <h3 className="heading-technical">IMU SUBSYSTEM</h3>
          <div className="metric-group">
            {renderMetric('Tilt Angle', `${sensor.imu.tiltAngle.toFixed(2)}°`)}
            {renderMetric('Accel X', `${sensor.imu.acceleration.x.toFixed(2)} g`)}
            {renderMetric('Accel Y', `${sensor.imu.acceleration.y.toFixed(2)} g`)}
            {renderMetric('Accel Z', `${sensor.imu.acceleration.z.toFixed(2)} g`)}
          </div>
        </div>

        <div className="ui-panel">
          <h3 className="heading-technical">DRIVE SUBSYSTEM</h3>
          <div className="metric-group">
            {renderMetric('Left Motor Temp', `${sensor.motors.tempLeft}°C`)}
            {renderMetric('Right Motor Temp', `${sensor.motors.tempRight}°C`)}
            {renderMetric('Left Motor Current', `${sensor.motors.currentLeft.toFixed(2)} A`)}
            {renderMetric('Right Motor Current', `${sensor.motors.currentRight.toFixed(2)} A`)}
            {renderMetric('Vibration Level', `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²`)}
          </div>
        </div>

        <div className="ui-panel">
          <h3 className="heading-technical">POWER SUBSYSTEM</h3>
          <div className="metric-group">
            {renderMetric('Power Source', 'EXTERNAL CABLE')}
            {renderMetric('Connection', robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED')}
            {renderMetric('Line Voltage', `${robot.powerVoltage.toFixed(1)} V`)}
            {renderMetric('Line Current', `${robot.powerCurrent.toFixed(1)} A`)}
          </div>
        </div>

        <div className="ui-panel">
          <h3 className="heading-technical">ACTUATION SUBSYSTEM</h3>
          <div className="metric-group">
            {renderMetric('Electromagnet Current', `${sensor.hardware.electromagnetCurrent.toFixed(1)} A`)}
            {renderMetric('Electromagnet Status', robot.electromagnetEnabled ? 'ON' : 'OFF')}
            {renderMetric('Arm Ext X', sensor.hardware.armExtensionX.toFixed(2))}
            {renderMetric('Arm Ext Y', sensor.hardware.armExtensionY.toFixed(2))}
            {renderMetric('Torch Enable', robot.torchEnabled ? 'ENABLED' : 'DISABLED')}
          </div>
        </div>

        <div className="ui-panel">
          <h3 className="heading-technical">GAS & CUTTING</h3>
          <div className="metric-group">
            {renderMetric('Torch Ignited', sensor.gas.torchStatus)}
            {renderMetric('Oxy Pressure', `${sensor.gas.oxyPressurePsi.toFixed(1)} PSI`)}
            {renderMetric('Oxy Flow', `${sensor.gas.oxyFlowRate.toFixed(1)} LPM`)}
            {renderMetric('Ace Pressure', `${sensor.gas.acePressurePsi.toFixed(1)} PSI`)}
            {renderMetric('Ace Flow', `${sensor.gas.aceFlowRate.toFixed(1)} LPM`)}
          </div>
        </div>

        <div className="ui-panel">
          <h3 className="heading-technical">ENVIRONMENTAL</h3>
          <div className="metric-group">
            {renderMetric('O2', `${environment.o2Percentage}%`)}
            {renderMetric('Combustible Gas', `${environment.combustibleGasLel}% LEL`)}
            {renderMetric('CO', `${environment.coPpm} ppm`)}
            {renderMetric('CO2', `${environment.co2Ppm} ppm`)}
            {renderMetric('Temperature', `${environment.temperatureC}°C`)}
            {renderMetric('Humidity', `${environment.humidityPercentage}%`)}
          </div>
        </div>

      </main>
      <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Last Updated: {new Date(sensor.metadata.lastUpdated).toLocaleTimeString()}</span>
        <span style={{ color: sensor.metadata.isStale ? 'var(--warning)' : 'var(--good)', fontWeight: 'bold' }}>{sensor.metadata.isStale ? 'STALE DATA' : 'LIVE TELEMETRY'}</span>
      </div>
    </div>
  );
}
