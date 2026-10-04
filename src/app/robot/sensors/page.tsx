"use client";

import React, { useState, useEffect } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Activity } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';

export default function RobotSensorsPage() {
  const { sensor, environment, robot, systemMode, telemetryHistory } = usePlatformStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    if (systemMode !== 'SIMULATED') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/telemetry?mode=${systemMode}&limit=40`);
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              const mapped = data.data.map((r: any) => ({
                timestamp: r.timestamp,
                sourceMode: r.mode,
                robot: { powerVoltage: r.powerVoltage, powerCurrent: r.powerCurrent },
                motors: { currentLeft: r.motorCurrentLeft, currentRight: r.motorCurrentRight, tempLeft: r.motorTempLeft, tempRight: r.motorTempRight },
                imu: { acceleration: { x: r.imuAccelX, y: r.imuAccelY, z: r.imuAccelZ }, gyro: { x: r.imuGyroX, y: r.imuGyroY, z: r.imuGyroZ }, tiltAngle: r.imuTiltAngle },
                hardware: { electromagnetCurrent: r.electromagnetCurrent, electromagnetEnabled: r.electromagnetEnabled, armExtensionX: r.armExtensionX, armExtensionY: r.armExtensionY, vibrationLevel: r.vibrationLevel },
                gas: { torchStatus: r.torchStatus, oxyPressurePsi: r.oxyPressurePsi, oxyFlowRate: r.oxyFlowRate, acePressurePsi: r.acePressurePsi, aceFlowRate: r.aceFlowRate },
                environment: { temperatureC: r.envTemperatureC, humidityPercentage: r.envHumidity, atmosphericPressureHpa: r.envAtmosphericPressure, windSpeedKmh: r.envWindSpeed, rain: r.envRain, visibilityStatus: r.envVisibility, o2Percentage: r.envO2Percentage, coPpm: r.envCoPpm, co2Ppm: r.envCo2Ppm, combustibleGasLel: r.envCombustibleGasLel }
              }));
              usePlatformStore.setState({ telemetryHistory: mapped });
            }
          }
        } catch (e) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [systemMode]);
  
  // Use last 40 ticks for sparklines
  const history = [...telemetryHistory].reverse().slice(-40);

  const renderRow = (label: string, value: string | number, historyData?: number[], color?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{value}</span>
      </div>
      {historyData && historyData.length > 0 && (
        <div style={{ width: '80px', marginLeft: '12px', flexShrink: 0 }}>
          <Sparkline data={historyData} color={color || 'var(--accent)'} height={24} />
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-top">
          <h1 className="page-title">SENSOR CENTER</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Live diagnostic view of all onboard sensors and subsystems.</p>
      </header>
      
      <main className="grid-3-col" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--sp-24)', alignContent: 'start' }}>
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">IMU SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('Tilt Angle', `${sensor.imu.tiltAngle.toFixed(2)}°`, history.map(h => h.imu.tiltAngle), 'var(--warning)')}
            {renderRow('Accel X', `${sensor.imu.acceleration.x.toFixed(2)} g`, history.map(h => h.imu.acceleration.x), 'var(--accent)')}
            {renderRow('Accel Y', `${sensor.imu.acceleration.y.toFixed(2)} g`, history.map(h => h.imu.acceleration.y), 'var(--accent)')}
            {renderRow('Accel Z', `${sensor.imu.acceleration.z.toFixed(2)} g`, history.map(h => h.imu.acceleration.z), 'var(--accent)')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">DRIVE SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('Left Motor Temp', `${sensor.motors.tempLeft.toFixed(1)}°C`, history.map(h => h.motors.tempLeft), 'var(--critical)')}
            {renderRow('Right Motor Temp', `${sensor.motors.tempRight.toFixed(1)}°C`, history.map(h => h.motors.tempRight), 'var(--critical)')}
            {renderRow('Left Motor Cur', `${sensor.motors.currentLeft.toFixed(2)} A`, history.map(h => h.motors.currentLeft), 'var(--accent)')}
            {renderRow('Right Motor Cur', `${sensor.motors.currentRight.toFixed(2)} A`, history.map(h => h.motors.currentRight), 'var(--accent)')}
            {renderRow('Vibration', `${sensor.hardware.vibrationLevel.toFixed(2)} m/s²`, history.map(h => h.hardware.vibrationLevel), 'var(--warning)')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">POWER SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('Power Source', 'EXTERNAL CABLE')}
            {renderRow('Connection', robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED')}
            {renderRow('Line Voltage', `${robot.powerVoltage.toFixed(1)} V`, history.map(h => h.robot?.powerVoltage), 'var(--good)')}
            {renderRow('Line Current', `${robot.powerCurrent.toFixed(1)} A`, history.map(h => h.robot?.powerCurrent), 'var(--accent)')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">ACTUATION SUBSYSTEM</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('Magnet Current', `${sensor.hardware.electromagnetCurrent.toFixed(1)} A`, history.map(h => h.hardware.electromagnetCurrent), 'var(--accent)')}
            {renderRow('Magnet Status', robot.electromagnetEnabled ? 'ON' : 'OFF')}
            {renderRow('Arm Ext X', sensor.hardware.armExtensionX.toFixed(2), history.map(h => h.hardware.armExtensionX), 'var(--accent)')}
            {renderRow('Arm Ext Y', sensor.hardware.armExtensionY.toFixed(2), history.map(h => h.hardware.armExtensionY), 'var(--accent)')}
            {renderRow('Torch Enable', robot.torchEnabled ? 'ENABLED' : 'DISABLED')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">GAS & CUTTING</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('Torch Ignited', sensor.gas.torchStatus)}
            {renderRow('Oxy Pressure', `${sensor.gas.oxyPressurePsi.toFixed(1)} PSI`, history.map(h => h.gas.oxyPressurePsi), 'var(--good)')}
            {renderRow('Oxy Flow', `${sensor.gas.oxyFlowRate.toFixed(1)} LPM`, history.map(h => h.gas.oxyFlowRate), 'var(--accent)')}
            {renderRow('Ace Pressure', `${sensor.gas.acePressurePsi.toFixed(1)} PSI`, history.map(h => h.gas.acePressurePsi), 'var(--good)')}
            {renderRow('Ace Flow', `${sensor.gas.aceFlowRate.toFixed(1)} LPM`, history.map(h => h.gas.aceFlowRate), 'var(--accent)')}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h3 className="heading-technical">ENVIRONMENTAL</h3>
          </div>
          <div className="ui-panel-body">
            {renderRow('O2', `${environment.o2Percentage}%`, history.map(h => h.environment?.o2Percentage), 'var(--good)')}
            {renderRow('Combustible', `${environment.combustibleGasLel}% LEL`, history.map(h => h.environment?.combustibleGasLel), 'var(--critical)')}
            {renderRow('CO', `${environment.coPpm} ppm`, history.map(h => h.environment?.coPpm), 'var(--warning)')}
            {renderRow('CO2', `${environment.co2Ppm} ppm`, history.map(h => h.environment?.co2Ppm), 'var(--warning)')}
            {renderRow('Temperature', `${environment.temperatureC.toFixed(1)}°C`, history.map(h => h.environment?.temperatureC), 'var(--accent)')}
            {renderRow('Humidity', `${environment.humidityPercentage.toFixed(1)}%`, history.map(h => h.environment?.humidityPercentage), 'var(--accent)')}
            {renderRow('Pressure', `${environment.atmosphericPressureHpa.toFixed(0)} hPa`, history.map(h => h.environment?.atmosphericPressureHpa), 'var(--good)')}
            {renderRow('Wind Speed', `${environment.windSpeedKmh.toFixed(1)} km/h`, history.map(h => h.environment?.windSpeedKmh), 'var(--accent)')}
            {renderRow('Rain', environment.rain ? 'YES' : 'NO')}
            {renderRow('Visibility', environment.visibilityStatus)}
          </div>
        </div>
      </main>
      
      <div className="ui-panel" style={{ flexShrink: 0, marginTop: '16px', background: 'transparent' }}>
        <div className="ui-panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Last Updated: {mounted ? new Date(sensor.metadata.lastUpdated).toLocaleTimeString() : '--:--:--'}
          </span>
          <span className={`status-badge ${sensor.metadata.isStale ? 'warning' : 'good'}`}>
            <Activity size={14} style={{ marginRight: '6px' }} />
            {sensor.metadata.isStale ? 'STALE DATA' : 'SIMULATED LIVE TELEMETRY'}
          </span>
        </div>
      </div>
    </div>
  );
}
