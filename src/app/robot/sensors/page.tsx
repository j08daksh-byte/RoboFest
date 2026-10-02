"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Activity } from 'lucide-react';

export default function RobotSensorsPage() {
  const { sensor, environment, robot, systemMode } = usePlatformStore();

  const renderRow = (label: string, value: string | number) => (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">SENSOR CENTER</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Live diagnostic view of all onboard sensors and subsystems.</p>
      </header>
      
      <main className="grid-3-col">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">IMU SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('Tilt Angle', `${sensor.imu.tiltAngle.toFixed(2)}°`)}
            {renderRow('Accel X', `${sensor.imu.acceleration.x.toFixed(2)} g`)}
            {renderRow('Accel Y', `${sensor.imu.acceleration.y.toFixed(2)} g`)}
            {renderRow('Accel Z', `${sensor.imu.acceleration.z.toFixed(2)} g`)}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">DRIVE SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('Left Motor Temp', `${sensor.motors.tempLeft.toFixed(1)}°C`)}
            {renderRow('Right Motor Temp', `${sensor.motors.tempRight.toFixed(1)}°C`)}
            {renderRow('Left Motor Cur', `${sensor.motors.currentLeft.toFixed(2)} A`)}
            {renderRow('Right Motor Cur', `${sensor.motors.currentRight.toFixed(2)} A`)}
            {renderRow('Vibration', `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²`)}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">POWER SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('Power Source', 'EXTERNAL CABLE')}
            {renderRow('Connection', robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED')}
            {renderRow('Line Voltage', `${robot.powerVoltage.toFixed(1)} V`)}
            {renderRow('Line Current', `${robot.powerCurrent.toFixed(1)} A`)}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">ACTUATION SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('Magnet Current', `${sensor.hardware.electromagnetCurrent.toFixed(1)} A`)}
            {renderRow('Magnet Status', robot.electromagnetEnabled ? 'ON' : 'OFF')}
            {renderRow('Arm Ext X', sensor.hardware.armExtensionX.toFixed(2))}
            {renderRow('Arm Ext Y', sensor.hardware.armExtensionY.toFixed(2))}
            {renderRow('Torch Enable', robot.torchEnabled ? 'ENABLED' : 'DISABLED')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">GAS & CUTTING</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('Torch Ignited', sensor.gas.torchStatus)}
            {renderRow('Oxy Pressure', `${sensor.gas.oxyPressurePsi.toFixed(1)} PSI`)}
            {renderRow('Oxy Flow', `${sensor.gas.oxyFlowRate.toFixed(1)} LPM`)}
            {renderRow('Ace Pressure', `${sensor.gas.acePressurePsi.toFixed(1)} PSI`)}
            {renderRow('Ace Flow', `${sensor.gas.aceFlowRate.toFixed(1)} LPM`)}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">ENVIRONMENTAL</h3>
          </div>
          <div className="ui-panel-body metric-group">
            {renderRow('O2', `${environment.o2Percentage}%`)}
            {renderRow('Combustible', `${environment.combustibleGasLel}% LEL`)}
            {renderRow('CO', `${environment.coPpm} ppm`)}
            {renderRow('CO2', `${environment.co2Ppm} ppm`)}
            {renderRow('Temperature', `${environment.temperatureC.toFixed(1)}°C`)}
            {renderRow('Humidity', `${environment.humidityPercentage.toFixed(1)}%`)}
          </div>
        </div>

      </main>
      
      <div className="ui-panel" style={{ marginTop: 'auto', background: 'transparent' }}>
        <div className="ui-panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Last Updated: {new Date(sensor.metadata.lastUpdated).toLocaleTimeString()}
          </span>
          <span className={`status-badge ${sensor.metadata.isStale ? 'warning' : 'good'}`}>
            <Activity size={14} style={{ marginRight: '6px' }} />
            {sensor.metadata.isStale ? 'STALE DATA' : 'LIVE TELEMETRY'}
          </span>
        </div>
      </div>
    </div>
  );
}
