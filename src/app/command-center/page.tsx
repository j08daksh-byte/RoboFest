"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';

export default function CommandCenterPage() {
  const { robot, safety, sensor, environment } = usePlatformStore();

  return (
    <div className="cc-layout">
      {/* Center: The Digital Twin */}
      <div className="cc-twin-panel">
        <div className="twin-wrapper">
          <DigitalTwin />
        </div>
      </div>
      
      {/* Right: Side Panels */}
      <div className="cc-side-panel">
        <div className="ui-panel">
          <div className="ui-panel-title">ROBOT HEALTH</div>
          <div className="ui-metric"><span className="ui-metric-label">Motor Temps</span><span className="ui-metric-value">{sensor.motors.tempLeft}°C</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Battery</span><span className="ui-metric-value">{robot.batteryPercentage}%</span></div>
        </div>
        
        <div className="ui-panel">
          <div className="ui-panel-title">SAFETY</div>
          <div className="ui-metric"><span className="ui-metric-label">Interlocks</span><span className="ui-metric-value" style={{color: safety.level === 'NORMAL' ? '#2ea043' : '#f85149'}}>{safety.level === 'NORMAL' ? 'CLEAR' : safety.level}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Inclinometer</span><span className="ui-metric-value">{sensor.imu.tiltAngle}°</span></div>
        </div>

        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">MANUAL OVERRIDE</div>
          <ControlPanel />
        </div>
      </div>
      
      {/* Bottom: Secondary Data */}
      <div className="cc-bottom-panel">
        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">SENSORS</div>
          <div className="ui-metric"><span className="ui-metric-label">Oxy</span><span className="ui-metric-value">{sensor.gas.oxyPressurePsi} psi</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Acetylene</span><span className="ui-metric-value">{sensor.gas.acePressurePsi} psi</span></div>
        </div>
        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">ENVIRONMENT</div>
          <div className="ui-metric"><span className="ui-metric-label">Wind</span><span className="ui-metric-value">{environment.windSpeedKmh} km/h</span></div>
        </div>
        <div className="ui-panel" style={{ flex: 2 }}>
          <div className="ui-panel-title">ROBO-ASSIST</div>
          <div style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '10px' }}>
            Awaiting operator input...
          </div>
        </div>
      </div>
    </div>
  );
}
