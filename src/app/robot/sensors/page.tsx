"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function RobotSensorsPage() {
  const { sensor, environment, robot, systemMode } = usePlatformStore();

  const renderMetric = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #30363d' }}>
      <span style={{ color: '#8b949e' }}>{label}</span>
      <span style={{ color: '#c9d1d9', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Sensor Center</h1>
        <p>Live diagnostic view of all onboard sensors.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>IMU</h3>
          {renderMetric('Tilt Angle', `${sensor.imu.tiltAngle.toFixed(2)}°`)}
          {renderMetric('Accel X', `${sensor.imu.acceleration.x.toFixed(2)} g`)}
          {renderMetric('Accel Y', `${sensor.imu.acceleration.y.toFixed(2)} g`)}
          {renderMetric('Accel Z', `${sensor.imu.acceleration.z.toFixed(2)} g`)}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>DRIVE</h3>
          {renderMetric('Left Motor Temp', `${sensor.motors.tempLeft}°C`)}
          {renderMetric('Right Motor Temp', `${sensor.motors.tempRight}°C`)}
          {renderMetric('Left Motor Current', `${sensor.motors.currentLeft.toFixed(2)} A`)}
          {renderMetric('Right Motor Current', `${sensor.motors.currentRight.toFixed(2)} A`)}
          {renderMetric('Vibration Level', `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²`)}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>POWER</h3>
          {renderMetric('Battery Voltage', `${robot.batteryVoltage.toFixed(1)} V`)}
          {renderMetric('Battery Current', `${robot.batteryCurrent.toFixed(1)} A`)}
          {renderMetric('Charge Level', `${robot.batteryPercentage}%`)}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>ACTUATION</h3>
          {renderMetric('Electromagnet Current', `${sensor.hardware.electromagnetCurrent.toFixed(1)} A`)}
          {renderMetric('Electromagnet Status', robot.electromagnetEnabled ? 'ON' : 'OFF')}
          {renderMetric('Arm Ext X', sensor.hardware.armExtensionX.toFixed(2))}
          {renderMetric('Arm Ext Y', sensor.hardware.armExtensionY.toFixed(2))}
          {renderMetric('Torch Enable', robot.torchEnabled ? 'ENABLED' : 'DISABLED')}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>GAS / CUTTING</h3>
          {renderMetric('Torch Ignited', sensor.gas.torchStatus)}
          {renderMetric('Oxy Pressure', `${sensor.gas.oxyPressurePsi.toFixed(1)} PSI`)}
          {renderMetric('Oxy Flow', `${sensor.gas.oxyFlowRate.toFixed(1)} LPM`)}
          {renderMetric('Ace Pressure', `${sensor.gas.acePressurePsi.toFixed(1)} PSI`)}
          {renderMetric('Ace Flow', `${sensor.gas.aceFlowRate.toFixed(1)} LPM`)}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ color: '#58a6ff', marginBottom: '12px' }}>ENVIRONMENTAL</h3>
          {renderMetric('O2', `${environment.o2Percentage}%`)}
          {renderMetric('Combustible Gas', `${environment.combustibleGasLel}% LEL`)}
          {renderMetric('CO', `${environment.coPpm} ppm`)}
          {renderMetric('CO2', `${environment.co2Ppm} ppm`)}
          {renderMetric('Temperature', `${environment.temperatureC}°C`)}
          {renderMetric('Humidity', `${environment.humidityPercentage}%`)}
        </div>

      </main>
      <div style={{ padding: '16px', color: '#8b949e', fontSize: '0.8rem' }}>
        Freshness: {new Date(sensor.metadata.lastUpdated).toLocaleTimeString()} ({sensor.metadata.isStale ? 'STALE' : 'LIVE'})
      </div>
    </div>
  );
}
